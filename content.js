(async () => {
	const results = await browser.storage.local.get();
	if (!results.authorities) {
		results.authorities = {}
		let query = 
			`
				SELECT ?item ?prefix ?regex ?suffix  ?url WHERE {
				  ?item p:P1630 [ps:P1630 ?url].
				  ?item wdt:P1793 ?regex.
				  
				  BIND( strbefore( ?url, "$1" ) as ?prefix )
				  BIND( strafter( ?url, "$1" ) as ?suffix )
				}
			`;
		const result = await sparqlQuery(query);
		for (key in result) {
			results.authorities[key] = {
				prefix: result[key].prefix.value !== '' ? result[key].prefix.value : result[key].url.value,
				regex: result[key].regex.value,
				suffix: result[key].suffix.value,
				prop: result[key].item.value.split('http://www.wikidata.org/entity/')[1]
			}
		}
	  browser.storage.local.set({ authorities: results.authorities });
	}

	let matchFound = false;
	for (const key in results.authorities) {
		const auth = results.authorities[key];
		if (location.href.startsWith(auth.prefix)) {
			if (location.href.replace(location.hash, '').split('?')[0].endsWith(auth.suffix)) {
	      let core = location.href.replace(location.hash, '').split(auth.prefix)[1];
	      if (auth.suffix != '') {
	      	core = core.split(auth.suffix)[0];
	      }
	      if (core.match(new RegExp(auth.regex))) {
	      	browser.runtime.sendMessage({
	      		"match": true,
	      		"id": core,
	      		"href": location.href,
	      		"prop": auth.prop,
	      	});
	      	matchFound = true;
	      }
			}
		}
	}
	if (!matchFound) {
		browser.runtime.sendMessage({
			"match": false,
			"href": location.href,
		})
	}
})();