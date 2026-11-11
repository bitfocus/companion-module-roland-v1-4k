const { combineRgb } = require('@companion-module/base')

module.exports = function (self) {
	const presets = {}
	const structure = []

	// PGM source buttons
	let pgmIds = []
	for (let i = 0; i < self.CHOICES_INPUTS.length; i++) {
		let input = self.CHOICES_INPUTS[i]
		let id = `pgm_${input.id}`
		pgmIds.push(id)
		presets[id] = {
			type: 'simple',
			name: `PGM ${input.label}`,
			style: {
				text: `PGM\\n${input.label}`,
				size: 'auto',
				color: combineRgb(255, 255, 255),
				bgcolor: combineRgb(0, 0, 0),
			},
			steps: [
				{
					down: [{ actionId: 'select_pgm', options: { source: input.id } }],
					up: [],
				},
			],
			feedbacks: [
				{
					feedbackId: 'pgm_source',
					options: { source: input.id },
					style: {
						bgcolor: combineRgb(255, 0, 0),
						color: combineRgb(255, 255, 255),
					},
				},
			],
		}
	}
	structure.push({ id: 'pgm_select', name: 'PGM Select', definitions: pgmIds })

	// PST source buttons
	let pstIds = []
	for (let i = 0; i < self.CHOICES_INPUTS.length; i++) {
		let input = self.CHOICES_INPUTS[i]
		let id = `pst_${input.id}`
		pstIds.push(id)
		presets[id] = {
			type: 'simple',
			name: `PST ${input.label}`,
			style: {
				text: `PST\\n${input.label}`,
				size: 'auto',
				color: combineRgb(255, 255, 255),
				bgcolor: combineRgb(0, 0, 0),
			},
			steps: [
				{
					down: [{ actionId: 'select_pst', options: { source: input.id } }],
					up: [],
				},
			],
			feedbacks: [
				{
					feedbackId: 'pst_source',
					options: { source: input.id },
					style: {
						bgcolor: combineRgb(0, 255, 0),
						color: combineRgb(0, 0, 0),
					},
				},
			],
		}
	}
	structure.push({ id: 'pst_select', name: 'PST Select', definitions: pstIds })

	// PVW source buttons
	let pvwIds = []
	for (let i = 0; i < self.CHOICES_INPUTS.length; i++) {
		let input = self.CHOICES_INPUTS[i]
		let id = `pvw_${input.id}`
		pvwIds.push(id)
		presets[id] = {
			type: 'simple',
			name: `PVW ${input.label}`,
			style: {
				text: `PVW\\n${input.label}`,
				size: 'auto',
				color: combineRgb(255, 255, 255),
				bgcolor: combineRgb(0, 0, 0),
			},
			steps: [
				{
					down: [{ actionId: 'select_pvw', options: { source: input.id } }],
					up: [],
				},
			],
			feedbacks: [
				{
					feedbackId: 'pst_source',
					options: { source: input.id },
					style: {
						bgcolor: combineRgb(0, 255, 0),
						color: combineRgb(0, 0, 0),
					},
				},
			],
		}
	}
	structure.push({ id: 'pvw_select', name: 'PVW Select', definitions: pvwIds })

	// Transition
	let transIds = []

	presets['auto_take'] = {
		type: 'simple',
		name: 'AUTO',
		style: { text: 'AUTO', size: 'auto', color: combineRgb(255, 255, 255), bgcolor: combineRgb(0, 0, 0) },
		steps: [{ down: [{ actionId: 'auto_take', options: {} }], up: [] }],
		feedbacks: [
			{
				feedbackId: 'auto_transition',
				options: {},
				style: { bgcolor: combineRgb(255, 128, 0), color: combineRgb(255, 255, 255) },
			},
		],
	}
	transIds.push('auto_take')

	presets['cut'] = {
		type: 'simple',
		name: 'CUT',
		style: { text: 'CUT', size: 'auto', color: combineRgb(255, 255, 255), bgcolor: combineRgb(0, 0, 0) },
		steps: [{ down: [{ actionId: 'cut', options: {} }], up: [] }],
		feedbacks: [],
	}
	transIds.push('cut')

	presets['ftb'] = {
		type: 'simple',
		name: 'FTB',
		style: { text: 'FTB', size: 'auto', color: combineRgb(255, 255, 255), bgcolor: combineRgb(0, 0, 0) },
		steps: [{ down: [{ actionId: 'output_fade_toggle', options: {} }], up: [] }],
		feedbacks: [
			{
				feedbackId: 'output_fade',
				options: {},
				style: { bgcolor: combineRgb(255, 0, 0), color: combineRgb(255, 255, 255) },
			},
		],
	}
	transIds.push('ftb')

	presets['trans_mix'] = {
		type: 'simple',
		name: 'MIX',
		style: { text: 'MIX', size: 'auto', color: combineRgb(255, 255, 255), bgcolor: combineRgb(0, 0, 0) },
		steps: [{ down: [{ actionId: 'set_transition_type', options: { type: 'MIX' } }], up: [] }],
		feedbacks: [
			{
				feedbackId: 'transition_type',
				options: { type: 'MIX' },
				style: { bgcolor: combineRgb(0, 128, 255), color: combineRgb(255, 255, 255) },
			},
		],
	}
	transIds.push('trans_mix')

	presets['trans_wipe'] = {
		type: 'simple',
		name: 'WIPE',
		style: { text: 'WIPE', size: 'auto', color: combineRgb(255, 255, 255), bgcolor: combineRgb(0, 0, 0) },
		steps: [{ down: [{ actionId: 'set_transition_type', options: { type: 'WIPE' } }], up: [] }],
		feedbacks: [
			{
				feedbackId: 'transition_type',
				options: { type: 'WIPE' },
				style: { bgcolor: combineRgb(0, 128, 255), color: combineRgb(255, 255, 255) },
			},
		],
	}
	transIds.push('trans_wipe')

	structure.push({ id: 'transition', name: 'Transition', definitions: transIds })

	// PinP & DSK
	let pinpDskIds = []

	presets['pinp_pgm'] = {
		type: 'simple',
		name: 'PinP PGM',
		style: { text: 'PinP\\nPGM', size: 'auto', color: combineRgb(255, 255, 255), bgcolor: combineRgb(0, 0, 0) },
		steps: [{ down: [{ actionId: 'pinp_pgm_toggle', options: {} }], up: [] }],
		feedbacks: [
			{
				feedbackId: 'pinp_pgm_on',
				options: {},
				style: { bgcolor: combineRgb(255, 0, 0), color: combineRgb(255, 255, 255) },
			},
		],
	}
	pinpDskIds.push('pinp_pgm')

	presets['dsk_pgm'] = {
		type: 'simple',
		name: 'DSK PGM',
		style: { text: 'DSK\\nPGM', size: 'auto', color: combineRgb(255, 255, 255), bgcolor: combineRgb(0, 0, 0) },
		steps: [{ down: [{ actionId: 'dsk_pgm_toggle', options: {} }], up: [] }],
		feedbacks: [
			{
				feedbackId: 'dsk_pgm_on',
				options: {},
				style: { bgcolor: combineRgb(255, 0, 0), color: combineRgb(255, 255, 255) },
			},
		],
	}
	pinpDskIds.push('dsk_pgm')

	structure.push({ id: 'pinp_dsk', name: 'PinP & DSK', definitions: pinpDskIds })

	// SPLIT & ROI
	let splitRoiIds = []

	presets['split_toggle'] = {
		type: 'simple',
		name: 'SPLIT',
		style: { text: 'SPLIT', size: 'auto', color: combineRgb(255, 255, 255), bgcolor: combineRgb(0, 0, 0) },
		steps: [{ down: [{ actionId: 'split_toggle', options: {} }], up: [] }],
		feedbacks: [
			{
				feedbackId: 'split_on',
				options: {},
				style: { bgcolor: combineRgb(255, 255, 0), color: combineRgb(0, 0, 0) },
			},
		],
	}
	splitRoiIds.push('split_toggle')

	presets['roi_mode_toggle'] = {
		type: 'simple',
		name: 'ROI Mode',
		style: { text: 'ROI\\nMode', size: 'auto', color: combineRgb(255, 255, 255), bgcolor: combineRgb(0, 0, 0) },
		steps: [{ down: [{ actionId: 'roi_mode_toggle', options: {} }], up: [] }],
		feedbacks: [
			{
				feedbackId: 'roi_mode_on',
				options: {},
				style: { bgcolor: combineRgb(0, 128, 255), color: combineRgb(255, 255, 255) },
			},
		],
	}
	splitRoiIds.push('roi_mode_toggle')

	structure.push({ id: 'split_roi', name: 'SPLIT & ROI', definitions: splitRoiIds })

	// Still Capture
	let captureIds = []
	let captureTargets = [
		{ id: '00', label: 'STILL 1' },
		{ id: '01', label: 'STILL 2' },
	]
	let captureSources = [
		{ id: '00', label: 'HDMI 1' },
		{ id: '01', label: 'HDMI 2' },
		{ id: '02', label: 'HDMI 3' },
		{ id: '03', label: 'HDMI 4' },
		{ id: '04', label: 'HDMI 5' },
	]
	for (let t = 0; t < captureTargets.length; t++) {
		for (let s = 0; s < captureSources.length; s++) {
			let id = `capture_${captureTargets[t].id}_${captureSources[s].id}`
			captureIds.push(id)
			presets[id] = {
				type: 'simple',
				name: `Capture ${captureSources[s].label} → ${captureTargets[t].label}`,
				style: {
					text: `CAP\\n${captureSources[s].label}\\n→${captureTargets[t].label}`,
					size: 'auto',
					color: combineRgb(255, 255, 255),
					bgcolor: combineRgb(128, 0, 0),
				},
				steps: [
					{
						down: [
							{
								actionId: 'capture_still',
								options: { source: captureSources[s].id, target: captureTargets[t].id },
							},
						],
						up: [],
					},
				],
				feedbacks: [],
			}
		}
	}
	structure.push({ id: 'still_capture', name: 'Still Capture', definitions: captureIds })

	// Memories
	let memIds = []
	for (let i = 0; i < self.CHOICES_MEMORIES.length; i++) {
		let mem = self.CHOICES_MEMORIES[i]
		let id = `memory_${mem.id}`
		memIds.push(id)
		presets[id] = {
			type: 'simple',
			name: mem.label,
			style: {
				text: `MEM\\n${i + 1}`,
				size: 'auto',
				color: combineRgb(255, 255, 255),
				bgcolor: combineRgb(0, 0, 0),
			},
			steps: [{ down: [{ actionId: 'load_memory', options: { memory: mem.id } }], up: [] }],
			feedbacks: [
				{
					feedbackId: 'memory_loaded',
					options: { memory: mem.id },
					style: { bgcolor: combineRgb(0, 128, 255), color: combineRgb(255, 255, 255) },
				},
			],
		}
	}
	structure.push({ id: 'memory', name: 'Memory', definitions: memIds })

	// USB Output Assign
	let usbIds = []
	let usbAssignChoices = [
		{ id: 'PGM', label: 'PGM' },
		{ id: 'PVW', label: 'PVW' },
		{ id: 'INPUT1', label: 'IN 1' },
		{ id: 'INPUT2', label: 'IN 2' },
		{ id: 'INPUT3', label: 'IN 3' },
		{ id: 'INPUT4', label: 'IN 4' },
	]
	for (let i = 0; i < usbAssignChoices.length; i++) {
		let assign = usbAssignChoices[i]
		let id = `usb_assign_${assign.id}`
		usbIds.push(id)
		presets[id] = {
			type: 'simple',
			name: `USB → ${assign.label}`,
			style: {
				text: `USB\\n${assign.label}`,
				size: 'auto',
				color: combineRgb(255, 255, 255),
				bgcolor: combineRgb(0, 0, 0),
			},
			steps: [
				{
					down: [{ actionId: 'output_assign', options: { port: 'USB', assign: assign.id } }],
					up: [],
				},
			],
			feedbacks: [
				{
					feedbackId: 'output_assign',
					options: { port: 'USB', assign: assign.id },
					style: {
						bgcolor: combineRgb(0, 128, 255),
						color: combineRgb(255, 255, 255),
					},
				},
			],
		}
	}
	structure.push({ id: 'usb_output', name: 'USB Output', definitions: usbIds })

	self.setPresetDefinitions(structure, presets)
}
