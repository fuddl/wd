async function wikidataGetEntity(id) {

	let url = `https://www.wikidata.org/wiki/Special:EntityData/${ id }.json`;
	try {
		const response = await fetch(url);

		if (response.status !== 200) {
			throw 'Status Code: ' + response.status;
		}

		let json = JSON.parse(await response.text());
		
		return json.entities;
	} catch(error) {
		throw ['Fetch Error :-S', error];
	}
}
