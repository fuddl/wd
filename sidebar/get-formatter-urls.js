async function getFormatterUrls(prop) {
	const query = `
		SELECT ?form ?exp WHERE {
			{
				wd:${prop} p:P1630 ?s.
				?s ps:P1630 ?form.
			} UNION {
				wd:${prop} p:P3303 ?s.
				?s ps:P3303 ?form.
			} UNION {
				wd:${prop} p:P7250 ?s.
				?s ps:P7250 ?form.
			}
			OPTIONAL { 
				?s pq:P8460 ?exp.
			}
		}
	`;
	return await sparqlQuery(query);
} 

export { getFormatterUrls }
