async function getAllProperties() {
	let query = `
		SELECT ?property ?propertyType ?propertyLabel ?propertyDescription ?propertyAltLabel WHERE {
		  ?property wikibase:propertyType wikibase:WikibaseItem .
		  SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en". }
		}
		ORDER BY ASC(xsd:integer(STRAFTER(STR(?property), 'P')))
	`;
	return sparqlQuery(query);
}