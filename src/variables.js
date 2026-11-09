module.exports = function (self) {
	const variables = {
		model: { name: 'Model' },
		version: { name: 'Version' },
		pgm_source: { name: 'PGM Source' },
		pst_source: { name: 'PST Source' },
		video_fader_level: { name: 'Video Fader Level' },
		auto_transition: { name: 'Auto Transition State' },
		transition_type: { name: 'Transition Type' },
		output_fade: { name: 'Output Fade State' },
		pinp_pgm: { name: 'PinP PGM State' },
		pinp_pvw: { name: 'PinP PVW State' },
		dsk_pgm: { name: 'DSK PGM State' },
		dsk_pvw: { name: 'DSK PVW State' },
		dsk_source: { name: 'DSK Source' },
		split_status: { name: 'SPLIT State' },
		roi_mode: { name: 'ROI Mode' },
		hdmi3_assign: { name: 'HDMI3 Output Assign' },
		hdmi4_assign: { name: 'HDMI4 Output Assign' },
		usb_assign: { name: 'USB Output Assign' },
		current_memory: { name: 'Current Memory' },
		auto_switching: { name: 'Auto Switching State' },
		auto_mixing: { name: 'Auto Mixing State' },
		last_memory_number: { name: 'Last Memory Number' },
		last_memory_name: { name: 'Last Memory Name' },
	}

	for (let i = 0; i < self.TALLYDATA.length; i++) {
		let label = self.TALLYDATA[i].label.toLowerCase()
		variables[`tally_${label}`] = { name: `Tally ${self.TALLYDATA[i].label}` }
	}

	for (let i = 1; i <= 8; i++) {
		variables[`memoryname_${i}`] = { name: `Memory ${i} Name` }
	}

	self.setVariableDefinitions(variables)
}
