// Keeps track of the commands that were sent and have not been answered yet.
//
// The V-1-4K answers commands in the order it received them, but an error reply
// (`ERR:5;`) does not say which command it belongs to. Remembering what is still
// unanswered lets the module name the command that was rejected.

const MAX_PENDING = 256
// Replies normally arrive within a few tens of milliseconds. Anything older than
// this was never answered and must not be blamed for a later error.
const MAX_AGE_MS = 2000

// Queries whose reply does not simply drop the leading "Q".
const IRREGULAR_REPLY_PREFIX = {
	QHDCP: 'HCP',
	QBSY: 'BSY',
}

// Which value reply, if any, a command is answered with.
// Returns null for commands that are only acknowledged with `ACK;`.
function expectedReply(command) {
	const body = command.trim().replace(/;$/, '')
	const colon = body.indexOf(':')
	const code = colon === -1 ? body : body.substring(0, colon)
	const args = colon === -1 ? undefined : body.substring(colon + 1).split(',')
	const firstArg = args === undefined ? undefined : args[0].trim()

	if (code === 'RQH') return { prefix: 'DTH', param: firstArg }
	if (code === 'TLY' || code === 'VER') return { prefix: code }
	if (IRREGULAR_REPLY_PREFIX[code]) return { prefix: IRREGULAR_REPLY_PREFIX[code], param: firstArg }
	if (code.length > 1 && code[0] === 'Q') return { prefix: code.substring(1), param: firstArg }

	return null
}

class PendingCommands {
	constructor(now = Date.now) {
		this.now = now
		this.entries = []
	}

	clear() {
		this.entries = []
	}

	prune() {
		const oldest = this.now() - MAX_AGE_MS
		while (this.entries.length > 0 && this.entries[0].time < oldest) {
			this.entries.shift()
		}
	}

	// A command was just sent.
	sent(command) {
		this.prune()
		this.entries.push({ command, expects: expectedReply(command), time: this.now() })
		if (this.entries.length > MAX_PENDING) this.entries.shift()
	}

	// A reply carrying a value arrived, e.g. `VOS:HDMI3,PGM`. It settles the command
	// it answers and everything sent before it. Unsolicited messages (pushed tally
	// changes) match nothing and leave the list untouched.
	value(prefix, params) {
		const index = this.entries.findIndex(
			(entry) =>
				entry.expects !== null &&
				entry.expects.prefix === prefix &&
				(entry.expects.param === undefined || entry.expects.param === params[0]),
		)
		if (index !== -1) this.entries.splice(0, index + 1)
	}

	// A bare `ACK;` arrived. It settles the oldest command that expects no value.
	ack() {
		this.prune()
		const index = this.entries.findIndex((entry) => entry.expects === null)
		if (index !== -1) this.entries.splice(0, index + 1)
	}

	// An error reply arrived. Returns the command it belongs to, or undefined
	// when nothing is waiting for an answer.
	error() {
		this.prune()
		const entry = this.entries.shift()
		return entry ? entry.command : undefined
	}
}

module.exports = { PendingCommands, expectedReply }
