function groupClaims(claims) {
	let groups = [
		{
			name: 'classification',
			properties: [
				'P31',   // Instance of
				'P279',  // Subclass of
			]
		},
		{
			name: 'Identity',
			properties: [
				'P2561', // Name
				'P735',  // Given name
				'P734',  // Family name
				'P1477', // Birth name
				'P21',   // sex or gender
				'P91',   // sexual orientation
			]
		},
		{
			name: 'Biography',
			properties: [
				'P3150', // birthday
				'P569',  // date of birthday
				'P19',   // place of birthday
				'P69',   // educated at
				'P106',  // employer
				'P108',  // employer
				'P1416', // affiliation
				'P570',  // date of death
				'P20',   // Place of death
				'P509',  // cause of death
				'P1196', // manner of death
			]
		},
		{
			name: 'Family',
			properties: [
				'P53',   // Family
				'P22',   // Father
				'P25',   // Mother
				'P3373', // sibling
				'P1038', // relative
				'P26',   // spouse
				'P40',   // child
				'P451',  // unmarried partner
				'P3342', // significant person
				'P551',  // residence
				'P551',  // residence
			]
		},
		{
			name: 'Narrative',
			properties: [
				'P5800',  // narrative role
				'P6249',  // narrative age
				'P1441',  // present in work
				'P4584',  // first appearance
				'P840',   // narrative location
			]
		},
		{
			name: 'Appearance',
			properties: [
				'P4675',  // appears in the form of
				'P3828',  // wears
				'P462',   // color
			]
		},
	];

	let sorted = [];
	let remaining = [];
	for (group of groups) {
		for (prop of group.properties) {
			if (claims.hasOwnProperty(prop)) {
				sorted.push(prop);
			}
		}
	}

	for (prop of Object.keys(claims)) {
		if (!sorted.includes(prop)) {
			remaining.push(prop);
		}
	}

	return sorted.concat(remaining);
}