async function wikidataGetEntity(id, usecache = true) {
	const endpoints = {
		'Q': 'www.wikidata.org',
		'P': 'www.wikidata.org',
		'L': 'www.wikidata.org',
		'M': 'commons.wikimedia.org',
	};

	let suffix = '';
	if (!usecache) {
		suffix = '?' + Date.now();
	}

	let url = `https://${ endpoints[id.charAt(0)] }/wiki/Special:EntityData/${ id }.json` + suffix;
	try {
		const response = await fetch(url, {
			cache: usecache ? 'default' : 'reload',
		});

		if (response.status !== 200) {
			throw 'Status Code: ' + response.status;
		}

		let json = JSON.parse(await response.text());
		
		return json.entities;
	} catch(error) {
		throw ['Fetch Error :-S', error];
	}
}
