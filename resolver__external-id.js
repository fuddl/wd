resolvers.externalId = {
	urlMatrch: async function(location) {
		return await this.matchAuthorities !== false;
	},
	getEntityId: async function() {
		let match = await this.matchAuthorities();
		let entity = await this.getEntityByExternalId(match.prop, match.id);
		let entityId = entity[0].item.value.match(/https?:\/\/www\.wikidata\.org\/entity\/(Q\d+)/)[1]
		return entityId;
	},
	matchAuthorities: async function() {
		const authorityList = await this.getAuthorityList();
		for (const key in authorityList) {
			const auth = await authorityList[key];
			if (location.href.startsWith(auth.prefix)) {
				if (location.href.replace(location.hash, '').split('?')[0].endsWith(auth.suffix)) {
					let core = location.href.replace(location.hash, '').split(auth.prefix)[1];
					if (auth.suffix != '') {
						core = core.split(auth.suffix)[0];
					}
					if (core.match(new RegExp(auth.regex))) {
						return {
							id: core,
							prop: auth.prop,
						}
					}
				}
			}
		}
	},
  getEntityByExternalId: async function(prop, id) {
		let query = `
			SELECT ?item
			WHERE {
				?item wdt:${ prop } "${ id }".
			}
		`;
		return sparqlQuery(query);
	},
	getAuthorityList: async function() {
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
		const authorities = {};
		for (key in result) {
			authorities[key] = {
				prefix: result[key].prefix.value !== '' ? result[key].prefix.value : result[key].url.value,
				regex: result[key].regex.value,
				suffix: result[key].suffix.value,
				prop: result[key].item.value.split('http://www.wikidata.org/entity/')[1]
			}
		}
		return authorities;
	}
};