async function getFormatterUrls(prop) {
	const query = `
		SELECT ?form WHERE {
		  {
		    wd:${prop} wdt:P1630 ?form.
		  } UNION {
		    wd:${prop} wdt:P3303 ?form.
		  } UNION {
		    wd:${prop} wdt:P7250 ?form.
		  }
		}
	`;
	return await sparqlQuery(query);
} 