async function wikidataGetEditToken(query, lang) {
	let url = `https://www.wikidata.org/w/api.php?action=query&meta=tokens&format=json`;
	console.log(url);
	try {
		const response = await fetch(url);

		if (response.status !== 200) {
			throw 'Status Code: ' + response.status;
		}	

		console.log(await response.text());
		let json = JSON.parse( await response.text());
		
		return json.search;
	} catch(error) {
		throw ['Fetch Error :-S', error];
	}
}
