async function getRelatedItems(item) {
	let query = `
		SELECT ?prop ?item
		WITH
		{
			SELECT *
			WHERE 
			{
				?item ?wdt wd:${item} .
				?prop wikibase:directClaim ?wdt .
			}
		} as %test
		WHERE
		{
			hint:Query hint:optimizer "None".
			INCLUDE %test
		} ORDER BY ASC(?prop) LIMIT 100
	`;
	return sparqlQuery(query);
}

export { getRelatedItems }