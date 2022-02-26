async function sparqlQuery(query) {
	let url = 'https://query.wikidata.org/sparql?format=json&query=' + encodeURIComponent(query.split(/\s+/).join(' '))
	try {
		const response = await fetch(url)

		if (response.status !== 200) {
			throw 'Status Code: ' + response.status
		}
		
		let json = JSON.parse(await response.text())
		
		if (json.results) {
			return json.results.bindings
		} else {
			return json
		}
	} catch(error) {
		throw ['Fetch Error :-S', error]
	}
}

export { sparqlQuery }
