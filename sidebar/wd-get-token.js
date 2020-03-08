async function wikidataGetEditToken(query, lang) {
	let url = `https://www.wikidata.org/w/api.php?action=query&meta=tokens&format=json`;
	console.log(url);
	try {
		const response = await fetch(url);

		if (response.status !== 200) {
			throw 'Status Code: ' + response.status;
		}	

		let json = JSON.parse( await response.text());
		
		if (json.query.tokens.csrftoken) {
			return json.search;
		} else {
			return false;
		}
	} catch(error) {
		throw ['Fetch Error :-S', error];
	}
}
