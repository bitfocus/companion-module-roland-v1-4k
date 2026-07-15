const { InstanceBase, InstanceStatus, Regex, TCPHelper } = require('@companion-module/base')
const UpgradeScripts = require('./upgrades')
const UpdateActions = require('./actions')
const UpdateFeedbacks = require('./feedbacks')
const UpdateVariableDefinitions = require('./variables')
const UpdatePresets = require('./presets')
const Constants = require('./constants')

class V14KInstance extends InstanceBase {
	constructor(internal) {
		super(internal)

		Object.assign(this, Constants)

		this.INTERVAL = null
		this.RECONNECT_INTERVAL = undefined
		this.MODEL = 'V-1-4K'
		this.VERSION = ''
		this.DATA = {}
		this.receiveBuffer = ''
		this.pollQueue = []
		this.pollTimer = null
		this.memoryNamesLoaded = false
	}

	async init(config) {
		this.configUpdated(config)
	}

	async destroy() {
		try {
			if (this.socket !== undefined) {
				this.socket.destroy()
			}
			clearInterval(this.INTERVAL)
			if (this.pollTimer) {
				clearTimeout(this.pollTimer)
			}
			if (this.RECONNECT_INTERVAL !== undefined) {
				clearTimeout(this.RECONNECT_INTERVAL)
			}
			this.log('debug', 'Module destroyed')
		} catch (error) {
			this.log('error', 'Error during destroy: ' + error)
		}
	}

	async configUpdated(config) {
		this.config = config

		if (this.socket !== undefined) {
			this.socket.destroy()
			delete this.socket
		}

		clearInterval(this.INTERVAL)

		if (this.RECONNECT_INTERVAL !== undefined) {
			clearTimeout(this.RECONNECT_INTERVAL)
			this.RECONNECT_INTERVAL = undefined
		}

		this.updateActions()
		this.updateFeedbacks()
		this.updateVariableDefinitions()
		this.updatePresets()
		this.checkFeedbacks()
		this.initConnection()
	}

	getConfigFields() {
		return [
			{
				type: 'textinput',
				id: 'host',
				label: 'IP Address',
				default: '',
				width: 6,
				regex: Regex.IP,
			},
			{
				type: 'number',
				id: 'port',
				label: 'TCP Port',
				default: 8023,
				width: 6,
				min: 1,
				max: 65535,
			},
			{
				type: 'textinput',
				id: 'password',
				label: 'Password',
				default: '',
				width: 6,
			},
			{
				type: 'checkbox',
				id: 'polling',
				label: 'Enable Polling',
				default: true,
				width: 3,
			},
			{
				type: 'number',
				id: 'pollingrate',
				label: 'Polling Rate (ms)',
				default: 3000,
				width: 3,
				min: 1000,
				max: 30000,
			},
			{
				type: 'checkbox',
				id: 'verbose',
				label: 'Enable Verbose Logging',
				default: false,
				width: 3,
			},
		]
	}

	updateActions() {
		UpdateActions(this)
	}

	updateFeedbacks() {
		UpdateFeedbacks(this)
	}

	updateVariableDefinitions() {
		UpdateVariableDefinitions(this)
	}

	updatePresets() {
		UpdatePresets(this)
	}

	// ── TCP Connection ──

	initConnection() {
		if (this.socket !== undefined) {
			this.socket.destroy()
			delete this.socket
		}

		if (this.config.port === undefined) {
			this.config.port = 8023
		}

		if (this.config.host) {
			this.log('info', `Opening connection to ${this.config.host}:${this.config.port}`)

			this.socket = new TCPHelper(this.config.host, this.config.port)
			this.receiveBuffer = ''

			this.socket.on('error', (err) => {
				if (this.config.verbose) {
					this.log('warn', 'Error: ' + err)
				}
				clearInterval(this.INTERVAL)
				this.handleError(err)
			})

			this.socket.on('connect', () => {
				this.log('info', 'Connected')
				this.updateStatus(InstanceStatus.Ok)
			})

			this.socket.on('data', (buffer) => {
				this.processIncomingData(buffer.toString('utf8'))
			})
		}
	}

	processIncomingData(data) {
		this.receiveBuffer += data

		if (this.receiveBuffer.includes('Enter password:')) {
			this.updateStatus(InstanceStatus.Connecting, 'Authenticating')
			this.log('info', 'Sending password...')
			this.socket.send(this.config.password + '\n')
			this.receiveBuffer = ''
			return
		}

		if (this.receiveBuffer.includes('Welcome to V-1-4K.')) {
			this.updateStatus(InstanceStatus.Ok)
			this.log('info', 'Authenticated.')
			this.receiveBuffer = ''
			this.sendSimpleCommand('VER;')
			this.startInterval()
			this.subscribeToTally()
			return
		}

		let lines = this.receiveBuffer.split('\n')
		this.receiveBuffer = lines.pop()

		for (let i = 0; i < lines.length; i++) {
			let line = lines[i].trim()
			if (line.length > 0) {
				this.updateData(line)
			}
		}
	}

	updateData(data) {
		if (this.config.verbose) {
			this.log('debug', 'Received: ' + data)
		}

		data = data.replace(/\x02/g, '')

		if (data.trim() === 'ERR:0;' || data.trim() === 'ERR:4;' || data.trim() === 'ERR:5;') {
			if (this.config.verbose) {
				this.log('warn', 'Device returned error: ' + data.trim())
			}
			return
		}

		try {
			let segments = data.split(';')

			for (let s = 0; s < segments.length; s++) {
				let segment = segments[s].trim()
				if (segment === '' || segment === 'ACK') continue

				let colonIndex = segment.indexOf(':')
				if (colonIndex === -1) continue

				let prefix = segment.substring(0, colonIndex).trim()
				let paramStr = segment.substring(colonIndex + 1).trim()
				let params = paramStr.split(',')

				this.parseResponse(prefix, params)
			}

			this.checkFeedbacks()
		} catch (error) {
			this.log('error', 'Error parsing data: ' + error)
			this.log('error', 'Data: ' + data)
		}
	}

	parseResponse(prefix, params) {
		switch (prefix) {
			case 'VER':
				if (params.length >= 2) {
					this.MODEL = params[0]
					this.VERSION = params[1]
					this.setVariableValues({ model: this.MODEL, version: this.VERSION })
				}
				break
			case 'PGM':
				if (params.length >= 1) {
					this.DATA.pgmSource = params[0]
					if (params.length >= 2) this.DATA.pgmInput = params[1]
					this.setVariableValues({ pgm_source: this.DATA.pgmSource })
				}
				break
			case 'PST':
				if (params.length >= 1) {
					this.DATA.pstSource = params[0]
					if (params.length >= 2) this.DATA.pstInput = params[1]
					this.setVariableValues({ pst_source: this.DATA.pstSource })
				}
				break
			case 'TLY':
				if (params.length >= 15) {
					for (let i = 0; i < Math.min(params.length, this.TALLYDATA.length); i++) {
						this.TALLYDATA[i].status = parseInt(params[i])
					}
					this.updateTallyVariables()
				}
				break
			case 'VFL':
				if (params.length >= 1) {
					this.DATA.videoFaderLevel = parseInt(params[0])
					this.setVariableValues({ video_fader_level: this.DATA.videoFaderLevel })
				}
				break
			case 'ATG':
				if (params.length >= 1) {
					this.DATA.autoTransition = params[0]
					this.setVariableValues({ auto_transition: this.DATA.autoTransition })
				}
				break
			case 'TRS':
				if (params.length >= 1) {
					this.DATA.transitionType = params[0]
					this.setVariableValues({ transition_type: this.DATA.transitionType })
				}
				break
			case 'TIM':
				if (params.length >= 2) {
					this.DATA[`transTime_${params[0]}`] = parseInt(params[1])
				}
				break
			case 'FTB':
				if (params.length >= 1) {
					this.DATA.outputFade = params[0]
					this.setVariableValues({ output_fade: this.DATA.outputFade })
				}
				break
			case 'PPS':
				if (params.length >= 2) {
					this.DATA.pinpPgm = params[1]
					this.setVariableValues({ pinp_pgm: this.DATA.pinpPgm })
				}
				break
			case 'PPW':
				if (params.length >= 2) {
					this.DATA.pinpPvw = params[1]
					this.setVariableValues({ pinp_pvw: this.DATA.pinpPvw })
				}
				break
			case 'DSK':
				if (params.length >= 2) {
					this.DATA.dskPgm = params[1]
					this.setVariableValues({ dsk_pgm: this.DATA.dskPgm })
				}
				break
			case 'DVW':
				if (params.length >= 2) {
					this.DATA.dskPvw = params[1]
					this.setVariableValues({ dsk_pvw: this.DATA.dskPvw })
				}
				break
			case 'DSS':
				if (params.length >= 2) {
					this.DATA.dskSource = params[1]
					if (params.length >= 3) this.DATA.dskSourceInput = params[2]
					this.setVariableValues({ dsk_source: this.DATA.dskSource })
				}
				break
			case 'KYL':
				if (params.length >= 2) this.DATA.dskLevel = parseInt(params[1])
				break
			case 'KYG':
				if (params.length >= 2) this.DATA.dskGain = parseInt(params[1])
				break
			case 'SPS':
				if (params.length >= 2) {
					this.DATA.splitStatus = params[1]
					this.setVariableValues({ split_status: this.DATA.splitStatus })
				}
				break
			case 'ROISW':
				if (params.length >= 1) {
					this.DATA.roiMode = params[0]
					this.setVariableValues({ roi_mode: this.DATA.roiMode })
				}
				break
			case 'VOS':
				if (params.length >= 2) {
					let port = params[0]
					let assign = params[1]
					this.DATA[`outputAssign_${port}`] = assign
					if (port === 'HDMI3') this.setVariableValues({ hdmi3_assign: assign })
					if (port === 'HDMI4') this.setVariableValues({ hdmi4_assign: assign })
				}
				break
			case 'MEM':
				if (params.length >= 1) {
					this.DATA.currentMemory = params[0]
					this.setVariableValues({ current_memory: this.DATA.currentMemory })
				}
				break
			case 'ASW':
				if (params.length >= 1) {
					this.DATA.autoSwitching = params[0]
					this.setVariableValues({ auto_switching: this.DATA.autoSwitching })
				}
				break
			case 'ATM':
				if (params.length >= 1) {
					this.DATA.autoMixing = params[0]
					this.setVariableValues({ auto_mixing: this.DATA.autoMixing })
				}
				break
			case 'IAM':
				if (params.length >= 2) this.DATA[`audioMute_${params[0]}`] = params[1]
				break
			case 'OAM':
				if (params.length >= 2) this.DATA[`outputMute_${params[0]}`] = params[1]
				break
			case 'HCP':
				if (params.length >= 1) this.DATA.hdcp = params[0]
				break
			case 'DTH':
				this.parseDTHResponse(params)
				break
		}
	}

	parseDTHResponse(params) {
		if (params.length < 2) return

		let address = params[0]
		let value = params[1]

		if (address.length === 6) {
			let p1 = address.substring(0, 2)
			let p2 = address.substring(2, 4)
			let p3 = address.substring(4, 6)

			if (p1 === '0C' && p2 === '00') {
				let tallyIndex = parseInt(p3, 16)
				if (tallyIndex >= 0 && tallyIndex < this.TALLYDATA.length) {
					this.TALLYDATA[tallyIndex].status = parseInt(value, 16)
				}
			}

			if (p1 === '60') {
				let memoryNumber = parseInt(p2, 16)
				let charIndex = parseInt(p3, 16)
				if (memoryNumber >= 0 && memoryNumber < 8) {
					if (!this.DATA[`memoryName_${memoryNumber}`]) {
						this.DATA[`memoryName_${memoryNumber}`] = '        '
					}
					let name = this.DATA[`memoryName_${memoryNumber}`]
					let charCode = parseInt(value, 16)
					let char = charCode > 0 ? String.fromCharCode(charCode) : ' '
					name = name.substring(0, charIndex) + char + name.substring(charIndex + 1)
					this.DATA[`memoryName_${memoryNumber}`] = name
					let varObj = {}
					varObj[`memoryname_${memoryNumber + 1}`] = name.trim()
					this.setVariableValues(varObj)
				}
			}

			if (p1 === '0A' && p2 === '00' && p3 === '03') {
				let memNum = parseInt(value, 16)
				this.DATA.lastMemoryNumber = memNum
				let memName = this.DATA[`memoryName_${memNum}`] || ''
				this.setVariableValues({
					last_memory_number: memNum,
					last_memory_name: memName.trim(),
				})
			}

			this.DATA[`sysex_${address}`] = value
		}
	}

	updateTallyVariables() {
		let varObj = {}
		for (let i = 0; i < this.TALLYDATA.length; i++) {
			let label = this.TALLYDATA[i].label.toLowerCase()
			let statusText = 'OFF'
			if (this.TALLYDATA[i].status === 1) statusText = 'PGM'
			else if (this.TALLYDATA[i].status === 2) statusText = 'PST'
			else if (this.TALLYDATA[i].status === 3) statusText = 'PGM+PST'
			varObj[`tally_${label}`] = statusText
		}
		this.setVariableValues(varObj)
	}

	handleError(err) {
		try {
			let error = err.toString()
			let printedError = false

			Object.keys(err).forEach((key) => {
				if (key === 'code') {
					if (err[key] === 'ECONNREFUSED') {
						this.log('error', 'Connection refused. Check the IP address.')
						this.updateStatus(InstanceStatus.ConnectionFailure, 'Connection Refused')
						printedError = true
					} else if (err[key] === 'ETIMEDOUT') {
						this.log('error', 'Connection timed out. Check the IP address.')
						this.updateStatus(InstanceStatus.ConnectionFailure, 'Connection Timed Out')
						printedError = true
					} else if (err[key] === 'ECONNRESET') {
						this.log('error', 'Connection reset.')
						this.updateStatus(InstanceStatus.ConnectionFailure, 'Connection Reset')
						printedError = true
					}

					if (this.socket !== undefined) {
						this.socket.destroy()
					}
					this.startReconnectInterval()
				}
			})

			if (!printedError) {
				this.log('error', `Error: ${error}`)
			}
		} catch (error) {
			this.log('error', 'Error handling error: ' + error)
		}
	}

	startReconnectInterval() {
		this.updateStatus(InstanceStatus.ConnectionFailure, 'Reconnecting')

		if (this.RECONNECT_INTERVAL !== undefined) {
			clearTimeout(this.RECONNECT_INTERVAL)
			this.RECONNECT_INTERVAL = undefined
		}

		this.log('info', 'Reconnecting in 30 seconds...')
		this.RECONNECT_INTERVAL = setTimeout(() => this.initConnection(), 30000)
	}

	startInterval() {
		this.pollQueue = []
		this.pollTimer = null
		this.memoryNamesLoaded = false

		if (this.config.polling) {
			let rate = parseInt(this.config.pollingrate) || 3000
			if (rate < 1000) rate = 1000
			this.log('info', `Polling interval: ${rate}ms`)
			this.INTERVAL = setInterval(() => this.getData(), rate)
		}
	}

	getData() {
		let commands = [
			'QPGM;',
			'QPST;',
			'TLY;',
			'QVFL;',
			'QATG;',
			'QTRS;',
			'QFTB;',
			'QPPS:PinP1;',
			'QPPW:PinP1;',
			'QDSK:DSK1;',
			'QDVW:DSK1;',
			'QDSS:DSK1;',
			'QSPS:SPLIT1;',
			'QROISW;',
			'QVOS:HDMI3;',
			'QVOS:HDMI4;',
			'QMEM;',
			'QASW;',
			'QATM;',
		]

		this.pollQueue = commands.slice()

		if (!this.memoryNamesLoaded) {
			for (let i = 0; i < 8; i++) {
				let hexMem = i.toString(16).padStart(2, '0').toUpperCase()
				for (let j = 0; j < 8; j++) {
					let hexChar = j.toString(16).padStart(2, '0').toUpperCase()
					this.pollQueue.push('RQH:60' + hexMem + hexChar + ',000001;')
				}
			}
			this.memoryNamesLoaded = true
		}

		this.processQueue()
	}

	processQueue() {
		if (this.pollTimer) {
			clearTimeout(this.pollTimer)
			this.pollTimer = null
		}

		if (this.pollQueue.length === 0) return

		let cmd = this.pollQueue.shift()
		this.sendRawCommand(cmd)

		if (this.pollQueue.length > 0) {
			this.pollTimer = setTimeout(() => this.processQueue(), 50)
		}
	}

	subscribeToTally() {
		this.sendRawCommand('DTH:0C0100,01;')
	}

	sendSimpleCommand(command) {
		if (!command.endsWith(';')) {
			command = command + ';'
		}

		if (this.socket !== undefined && this.socket.isConnected) {
			if (this.config.verbose) {
				this.log('debug', 'Sending: ' + command)
			}
			this.socket.send(command + '\n')
		} else {
			if (this.config.verbose) {
				this.log('warn', 'Socket not connected, cannot send.')
			}
		}
	}

	sendRawCommand(command) {
		if (!command.endsWith(';')) {
			command = command + ';'
		}

		if (this.socket !== undefined && this.socket.isConnected) {
			if (this.config.verbose) {
				this.log('debug', 'Sending raw: ' + command)
			}
			this.socket.send(command + '\n')
		}
	}

	sendCommand(address, value) {
		this.sendRawCommand('DTH:' + address + ',' + value + ';')
	}
}

module.exports = V14KInstance
module.exports.UpgradeScripts = UpgradeScripts
