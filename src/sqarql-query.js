async function sparqlQuery(query) {
	let url = 'https://query.wikidata.org/sparql?format=json&query=' + encodeURIComponent(query.split(/\s+/).join(' '));
	try {
		const response = await fetch(url);

		if (response.status !== 200) {
			throw 'Status Code: ' + response.status;
		}
		
		let json = JSON.parse(await response.text());
		
		if (json.results) {
			return json.results.bindings;
		} else {
			return json;
		}
	} catch(error) {
		const delay = Math.floor(Math.random() * 1000)
		console.warn(`Sparql Query failed, retring in ${delay / 1000} seconds`)
		console.log(error)

		await new Promise(resolve => setTimeout(resolve, delay));

		console.log('retring…');
		return await sparqlQuery(query)
	}
}

export { sparqlQuery }
