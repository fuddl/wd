async function getAllProperties() {
	// for aliases add ?propertyAltLabel 
	let query = `
		SELECT DISTINCT ?pid ?propLabel ?propDescription WHERE {
		  ?prop wikibase:propertyType wikibase:WikibaseItem.
          ?prop wdt:P31 ?type.
		  SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en". }
          FILTER ( ?type not in ( wd:Q15720608 ) ).
          BIND (STRAFTER(STR(?prop), 'P') AS ?pid ).
		}
		ORDER BY ASC(xsd:integer(STRAFTER(STR(?prop), 'P')))
	`;
	return sparqlQuery(query);
}