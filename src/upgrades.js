// Option ids used up to v0.1.3, mapped to the readable ids used since.
const STILL_SOURCE_IDS = { '00': 'HDMI1', '01': 'HDMI2', '02': 'HDMI3', '03': 'HDMI4', '04': 'HDMI5' }
const STILL_TARGET_IDS = { '00': 'STILL1', '01': 'STILL2' }
const STILL_DELETE_IDS = { '7F': 'ALL', '00': 'STILL1', '01': 'STILL2' }
const TALLY_SOURCE_IDS = {
	0: 'HDMI1',
	1: 'HDMI2',
	2: 'HDMI3',
	3: 'HDMI4',
	4: 'HDMI5',
	5: 'STILL1',
	6: 'STILL2',
	7: 'INPUT1',
	8: 'INPUT2',
	9: 'INPUT3',
	10: 'INPUT4',
	11: 'INPUT5',
	12: 'INPUT6',
	13: 'INPUT7',
	14: 'INPUT8',
}
const TALLY_STATE_IDS = { 1: 'PGM', 2: 'PST', 3: 'PGM_PST' }

// Replace a plain (non-expression) option value through a lookup table.
// Returns true when the option was changed.
function remapOption(options, key, table) {
	const option = options ? options[key] : undefined
	if (!option || typeof option !== 'object' || option.isExpression) return false

	const oldValue = String(option.value)
	if (!Object.prototype.hasOwnProperty.call(table, oldValue)) return false

	options[key] = { isExpression: false, value: table[oldValue] }
	return true
}

// Changes made after v0.1.3:
// - the network password moved from the config to the secrets store
// - "PVW Source Select" was removed (it was identical to "PST Source Select")
// - still image and tally options use readable ids instead of device codes
function upgradeAfterV013(_context, props) {
	const result = {
		updatedConfig: null,
		updatedSecrets: null,
		updatedActions: [],
		updatedFeedbacks: [],
	}

	const config = props.config
	if (config && Object.prototype.hasOwnProperty.call(config, 'password')) {
		const secrets = props.secrets || {}
		if (typeof config.password === 'string' && config.password !== '' && !secrets.password) {
			result.updatedSecrets = { ...secrets, password: config.password }
		}

		const updatedConfig = { ...config }
		delete updatedConfig.password
		result.updatedConfig = updatedConfig
	}

	for (const action of props.actions) {
		let changed = false

		if (action.actionId === 'select_pvw') {
			action.actionId = 'select_pst'
			changed = true
		} else if (action.actionId === 'capture_still') {
			const sourceChanged = remapOption(action.options, 'source', STILL_SOURCE_IDS)
			const targetChanged = remapOption(action.options, 'target', STILL_TARGET_IDS)
			changed = sourceChanged || targetChanged
		} else if (action.actionId === 'delete_still') {
			changed = remapOption(action.options, 'target', STILL_DELETE_IDS)
		}

		if (changed) result.updatedActions.push(action)
	}

	for (const feedback of props.feedbacks) {
		if (feedback.feedbackId !== 'tally') continue

		const sourceChanged = remapOption(feedback.options, 'source', TALLY_SOURCE_IDS)
		const stateChanged = remapOption(feedback.options, 'state', TALLY_STATE_IDS)
		if (sourceChanged || stateChanged) result.updatedFeedbacks.push(feedback)
	}

	return result
}

module.exports = [upgradeAfterV013]
