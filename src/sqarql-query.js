import { wait } from './core/async'

async function sparqlQuery(query, attempt = 1, forceCache = false) {
	let url = 'https://query.wikidata.org/sparql?format=json&query=' + encodeURIComponent(query.split(/\s+/).join(' '));
	try {
		const response = await fetch(url, {
			cache: forceCache ? 'force-cache' : 'default',
		});

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
		if (attempt > 5 || error === 'Status Code: 400') {
			throw ['Fetch Error :-S', error];
		}
		
		const delay = Math.floor(Math.random() * 1000 * attempt)
		console.warn(`Sparql Query failed, retring in ${delay / 1000} seconds`)
		console.log(error)

		await wait(delay);

		console.log('retring…');
		return await sparqlQuery(query, attempt + 1, forceCache)
	}
}

export { sparqlQuery }
