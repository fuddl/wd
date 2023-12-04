import { wikidataGetEntity } from '../wd-get-entity.js'
import { getValueByLang } from './get-value-by-lang.js'

async function wikidataAutocompleteGetSenses(search) {

	const senseSearch = await Promise.all(search.map(async (entry) => {
		const lexeme = await wikidataGetEntity(entry.id, true, true)
		if (lexeme.senses) {
			entry.senses = lexeme.senses 
		}
		return entry
	}));

	const newSearch = []
	for (const item of senseSearch) {
		for (const itemSense of item.senses) {
			const gloss = getValueByLang(itemSense, 'glosses', '[no gloss]')
			newSearch.push({
				id: itemSense.id,
				title: `Sense:${itemSense.id}`,
				label: item.label,
				description: `${item.description}: ${gloss}`
			})
		}
	}

	return newSearch
}

async function wikidataAutocomplete(query, lang, scope = 'item') {

	// hotfix for https://phabricator.wikimedia.org/T271500
	const queryScope = scope == 'sense' ? 'lexeme' : scope

	let url = `https://www.wikidata.org/w/api.php?action=wbsearchentities&language=${ lang }&format=json&search=${ encodeURIComponent(query) }&limit=50&type=${ queryScope }`;

	try {
		const response = await fetch(url);

		if (response.status !== 200) {
			throw 'Status Code: ' + response.status;
		}	

		let json = JSON.parse( await response.text());

		// hotfix for https://phabricator.wikimedia.org/T271500
		if (scope == 'sense') {
			json.search = wikidataAutocompleteGetSenses(json.search)
		}
		
		return json.search;
	} catch(error) {
		throw ['Fetch Error :-S', error];
	}
}

export { wikidataAutocomplete }