function groupClaims(claims) {
	let groups = [
		{
			name: 'Classification',
			properties: [
				'P31',   // Instance of
				'P279',  // Subclass of
				'P1074', // fictional analog of
			]
		},
		{
			name: 'Identity',
			properties: [
				'P18',   // Image
				'P2910', // icon
				'P3383', // film poster
				'P154',  // logo
				'P2561', // Name
				'P512',  // academic degree that the person holds
				'P735',  // Given name
				'P734',  // Family name
				'P1477', // Birth name
				'P97',   // Noble title
				'P21',   // sex or gender
				'P91',   // sexual orientation
				'P306',  // operating system
			]
		},
		{
			name: 'Naming',
			properties: [
				'P6333',   // title of broader work 	
				'P1448',   // official name
				'P1476',   // title
				'P1680',   // subtitle
				'P1813',   // short name
				'P348',    // version number
				'P487',    // Unicode character
			]
		},
		{
			name: 'Work Credit',
			properties: [
				'P50',   // author	
				'P58',   // screenwriter
				'P3174', // art director
				'P161',  // cast member
				'P725',  // voice actor
				'P767',  // contributor
				'P4805', // make-up artist
				'P3092', // film crew member
			]
		},
		{
			name: 'Geography',
			properties: [
				'P41',    // Flag
				'P1943',  // location map
				'P242',   // locator map image
				'P94',    // coat of arms
				'P625',   // coordinate location
				'P2907',  // UTC timezone offset
				'P36',    // capital
				'P1376',  // capital of
				'P3075',  // official religion
			]
		},
		{
			name: 'Chronology',
			properties: [
				'P571',  // Inception
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
				'P1442', // image of grave
				'P576',  // dissolved, abolished or demolished
				'P2669', // discontinued date
				'P7888', // merged into
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
			]
		},
		{
			name: 'Narrative',
			properties: [
				'P5800',  // narrative role
				'P6249',  // narrative age
				'P674',   // characters
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