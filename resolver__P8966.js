resolvers.p8966 = {
	aquireRegexes: async function() {
		let query = `
			SELECT ?p ?s ?r WHERE {
			  ?stat ps:P8966 ?s.
			  OPTIONAL { ?stat pq:P8967 ?r. }
			  ?prop  p:P8966 ?stat.
			  BIND(REPLACE(STR(?prop), 'http://www.wikidata.org/entity/', '')  AS ?p ).
			} ORDER BY STRLEN(str(?s))
		`;
		let patterns = await sparqlQuery(query);
		output = [];
		for (prop of patterns) {
			let isValid = true;
			let regexp = false;
			try {
			    regexp = new RegExp(prop.s.value + '.*', 'g');
			} catch(e) {
			    isValid = false;
			    console.warn('This regex is not valid', JSON.stringify(prop, null, 2));
			}
			if (isValid) {
				output.push({
					p: prop.p.value,
					s: regexp,
					r: prop?.r?.value ? prop.r.value.replace(/\\(\d+)/g, "$$$1") : "$1",
				});
			}
		}
		return output;
	},
	applicable: async function(location) {
		this.patterns = await this.aquireRegexes();
		this.location = location;
		for (prop of this.patterns) {
			let match = location.href.match(prop.s);
			if (match) {
				console.log(prop.s.toString())
				console.log(location.href)
				console.log(JSON.stringify(match))
				console.log(prop.replace)
				console.log(location.href.replace(prop.s, prop.r))
				return [{
					prop: prop.p,
					value: location.href.replace(prop.s, prop.r),
					recommended: true,
				}];
			}
		}
		return false;
	},
	getEntityId: async function(location) {
		let applicable = await this.applicable(location);

		let prop = applicable[0].prop;
		let id = applicable[0].value;
		let entity = await this.getEntityByRegexedId(prop, id);
		if (entity[0]) {
			let entityId = entity[0].item.value.match(/https?:\/\/www\.wikidata\.org\/entity\/(\w\d+)/)[1]
			return entityId;
		} else {
			return false;
		}
	},
	getEntityByRegexedId: async function(prop, id) {
		let query = `
			SELECT ?item
			WHERE {
				?item wdt:${ prop } "${ id }".
			}
		`;
		return sparqlQuery(query);
	},
};
