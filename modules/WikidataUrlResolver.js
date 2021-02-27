const wbk = require('wikibase-sdk')({
  instance: 'https://www.wikidata.org',
  sparqlEndpoint: 'https://query.wikidata.org/sparql'
})

class WikidataUrlResolver {
	resolvers() {
		let parent = this;
		return [
			{
				name: 'wikidata',
				applicable: () => {
					return this.location.href.match(/^https?:\/\/[\w]+.wikidata.org\/wiki\/(?:\w+\:)?[QMPL]\d+/) !== null;
				},
				getEntityId: () => {
					return this.location.href.match(/^https?:\/\/[\w]+.wikidata.org\/wiki\/(?:\w+\:)?([QMPL]\d+)/)[1];
				}
			},
			{
				name: 'P8966',
				applicable: async function () {
					if (!parent.P8966) {
						await this.prepare();
					}
					console.debug(parent.P8966);
					for (let prop of parent.P8966) {
						let match = location.href.match(prop.s);
						if (match) {
							return true;
						}
					}
				},
				getEntityId: () => {
					return this.location.href.match(/^https?:\/\/[\w]+.wikidata.org\/wiki\/(?:\w+\:)?([QMPL]\d+)/)[1];
				},
				prepare: () => {
					let answer = await fetch(wbk.sparqlQuery(`
						SELECT ?p ?s ?r WHERE {
							?stat ps:P8966 ?s.
							OPTIONAL { ?stat pq:P8967 ?r. }
							?prop	p:P8966 ?stat.
							BIND(REPLACE(STR(?prop), 'http://www.wikidata.org/entity/', '')	AS ?p ).
						} ORDER BY STRLEN(str(?s))
					`));
					this.P8966 = [];
					for (let prop of answer) {
						let isValid = true;
						let regexp = false;
						try {
								regexp = new RegExp(prop.s.value + '.*', 'g');
						} catch(e) {
								isValid = false;
								console.warn('This regex is not valid', JSON.stringify(prop, null, 2));
						}
						if (isValid) {
							this.P8966.push({
								p: prop.p.value,
								s: regexp,
								r: prop?.r?.value ? prop.r.value.replace(/\\(\d+)/g, "$$$1") : "$1",
							});
						}
					}
				}
			}
		]
	}
	getId(location) {
		this.location = location;

		for (let resolver of this.resolvers()) {
			if (resolver.applicable()) {
				return resolver.getEntityId();
			}
		}
		return false;
	}
}

export { WikidataUrlResolver }
