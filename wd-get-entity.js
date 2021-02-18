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

	let ns = id.charAt(0);

	let url = `https://${ endpoints[ns] }/wiki/Special:EntityData/${ id }.json` + suffix;
	try {
		const response = await fetch(url, {
			cache: usecache ? 'default' : 'reload',
		});

		if (response.status !== 200) {
			throw 'Status Code: ' + response.status;
		}

		let json = await response.json();

		let cached = await addToLabelCache(id, json.entities);
		
		return json.entities;
	} catch(error) {
		throw ['Fetch Error :-S', error];
	}
}

async function addToLabelCache(id, entity) {
	const label = getValueByLang(entity[id], 'labels', false);
	const description = getValueByLang(entity[id], 'descriptions', false);

	if (label || description) {
		const cache = await browser.storage.local.get();
		if (label) {
			if (!('labels' in cache)) {
				cache.labels = {};
			}
			cache.labels[id] = label;
		}
		if (description) {
			if (!('descriptions' in cache)) {
				cache.descriptions = {};
			}
			cache.descriptions[id] = description;
		}
		browser.storage.local.set(cache);
		return true;
	} else {
		return false;
	}
}
