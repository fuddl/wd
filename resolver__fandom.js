resolvers.fandom = {
	urlMatrch: async function(location) {
		return location.href.match(this.fandomRegex) !== null;
	},
	getEntityId: async function() {
		let parts = location.href.match(this.fandomRegex);
		let id = [
			parts[6] ? parts[6] + '.' : '',
			parts[1] + ':',
			parts[7],
		].join('');
		let domain = parts[3] ? parts[3] : parts[4];
		let entity = await this.getEntityByFandomId(domain, id);
		console.log(entity);
		if (entity[0]) {
			let entityId = entity[0].item.value.match(/https?:\/\/www\.wikidata\.org\/entity\/(Q\d+)/)[1]
			return entityId;
		}
	},
	fandomRegex: /https?:\/\/([a-z0-9\.-]+).((gamepedia)\.com|(fandom)\.com(\/([\w]+))?\/wiki)\/([^\s]+)/,
  getEntityByFandomId: async function(domain, id) {
  	let props = {
  		gamepedia: 'P6623',
  		fandom: 'P6262'
  	}
		let query = `
			SELECT ?item
			WHERE {
				?item wdt:${ props[domain] } "${ id }".
			}
		`;
		console.log(domain);
		console.log(query);
		return sparqlQuery(query);
	},
};