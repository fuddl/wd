async function sparqlQuery(query) {
	let url = 'https://query.wikidata.org/sparql?format=json&query=' + encodeURIComponent(query);
	try {
		const response = await fetch(url);

		if (response.status !== 200) {
			throw 'Status Code: ' + response.status;
		}
		
		let json = JSON.parse(await response.text());
		
		return json.results.bindings;
	} catch(error) {
		throw ['Fetch Error :-S', error];
	}
}
