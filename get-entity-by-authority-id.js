function getEntityByAuthorityId(prop, id) {
	let query = `
		SELECT ?item
		WHERE {
			?item wdt:${ prop } "${ id }".
		}
	`;	
	return sparqlQuery(query);
}
