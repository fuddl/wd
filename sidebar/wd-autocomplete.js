async function wikidataAutocomplete(query, lang) {
	let url = `https://www.wikidata.org/w/api.php?action=wbsearchentities&language=${ lang }&format=json&search=${ encodeURIComponent(query) }&limit=50`;
	try {
		const response = await fetch(url);

		if (response.status !== 200) {
			throw 'Status Code: ' + response.status;
		}	

		let json = JSON.parse( await response.text());
		
		return json.search;
	} catch(error) {
		throw ['Fetch Error :-S', error];
	}
}
