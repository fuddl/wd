resolvers.externalId = {
	applicable: async function(location) {
		return await this.matchAuthorities();
	},
	getEntityId: async function() {
		let match = await this.matchAuthorities();
		if (match) {
			let entity = await this.getEntityByExternalId(match.prop, match.id);
			if (entity[0]) {
				let entityId = entity[0].item.value.match(/https?:\/\/www\.wikidata\.org\/entity\/(Q\d+)/)[1]
				return entityId;
			} else {
				return false;
			}
		}
	},
	matchAuthorities: async function() {
		const authorityList = await this.getAuthorityList();
		const output = [];
		for (const key in authorityList) {
			const auth = await authorityList[key];
			let core = location.href.replace(location.hash, '');
			if (!auth.prefix || core.startsWith(auth.prefix)) {
				if (!auth.suffix || core.endsWith(auth.suffix)) {
					if (auth.prefix) {
						core = core.split(auth.prefix)[1];
					}
					if (auth.suffix) {
						core = core.split(auth.suffix)[0];
					}
					let exp = new RegExp(auth.regex);
					if (core.match(exp)) {
						output.push({
							prop: auth.prop,
							value: core,
							recommended: true,
						});
					}
				}
			}
		}
		if (output.length === 0) {
			return false;
		} else {
			return output;
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
				SELECT ?item ?prefix ?regex ?suffix ?rank WHERE {
					{

						?item p:P1630 [ps:P1630 ?url;
														wikibase:rank ?rank;
													].
					} UNION {
						?item p:P3303 [ps:P3303 ?url;
														wikibase:rank ?rank;
													].
					} UNION {
						?item p:P7250 [ps:P7250 ?url;
														wikibase:rank ?rank;
													].
					}
					?item wdt:P1793 ?regex.
					
					FILTER(CONTAINS(?url, "$1"))
					BIND(STRBEFORE(?url, "$1") as ?prefix)
					BIND(STRAFTER(?url, "$1") as ?suffix)
				} ORDER BY DESC(strlen(str(?prefix)))
			`;
		const result = await sparqlQuery(query);
		const authorities = {};
		for (key in result) {
			authorities[key] = {
				prefix: result[key].prefix.value,
				suffix: result[key].suffix.value,
				regex: result[key].regex.value,
				prop: result[key].item.value.split('http://www.wikidata.org/entity/')[1]
			}
		}
		return authorities;
	}
};
