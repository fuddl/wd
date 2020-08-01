resolvers.fandom = {
	applicable: async function(location) {
		this.location = location;
		
		if (location.href.match(this.fandomRegex)) {
			let domain = this.getDomain();
			let id = this.makeId();
			return [{
				prop: this.props[domain],
				value: id,
				recommended: true,
			}];
		} else {
			return false;
		}
	},
	getEntityId: async function() {
		let domain = this.getDomain();
		let id = this.makeId();
		let entity = await this.getEntityByFandomId(domain, id);
		if (entity[0]) {
			let entityId = entity[0].item.value.match(/https?:\/\/www\.wikidata\.org\/entity\/(Q\d+)/)[1]
			return entityId;
		} else {
			return false;
		}
	},
	makeId: function() {
		let parts = this.getParts();
		let id = [
			parts[6] ? parts[6] + '.' : '',
			parts[1] + ':',
			decodeURIComponent(parts[7]),
		].join('');
		return id;
	},
	getDomain: function() {
		let parts = this.getParts();
		return parts[3] ? parts[3] : parts[4];
	},
	getParts: function() {
		return this.location.href.match(this.fandomRegex);
	},
	props: {
		gamepedia: 'P6623',
		fandom: 'P6262'
	},
	fandomRegex: /https?:\/\/([a-z0-9\.-]+).((gamepedia)\.com|(fandom)\.com(\/([\w]+))?\/wiki)\/([^\s#\?]+)/,
  getEntityByFandomId: async function(domain, id) {
		let query = `
			SELECT ?item
			WHERE {
				?item wdt:${ this.props[domain] } "${ id }".
			}
		`;
		return sparqlQuery(query);
	},
};