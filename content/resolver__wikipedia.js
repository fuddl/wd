import { sparqlQuery } from "../sqarql-query.js";

const wikipedia = {
	regex: /^https?:\/\/([\w]+)(?:\.m)?\.(wikipedia|wikibooks|wikiversity|wikivoyage|wikisource|wikiquote|wikinews|wikimedia)\.org\/wiki\/([^?#]+)/,
	sites: {
		wikipedia: 'wiki',
		wikibooks: 'wikibooks',
		wikinews: 'wikinews',
		wikiquote: 'wikiquote',
		wikisource: 'wikisource',
		wikiversity: 'wikiversity',
		wikivoyage: 'wikivoyage',
		wikimedia: 'commonswiki',
	},
	applicable: function(location) {
		if(location.href.match(this.regex) !== null ) {
			let parts = location.href.match(this.regex);
			if (parts[1] === 'commons') {
				parts[1] = '';
			}
			return [{
				sitelink: `${parts[1]}${this.sites[parts[2]]}`,
				value: parts[3],
			}];
		} else {
			return false;
		}
	},
	getEntityId: async function(location) {
		let parts = location.href.match(this.regex);
		let title = decodeURIComponent(parts[3]).replace(/_/g, ' ');
		let subdomain = parts[1];
		let language = subdomain !== 'commons' ? subdomain : 'en';
		let query = `
			SELECT ?item WHERE {
				?sitelink schema:about ?item;
					schema:isPartOf <https://${ subdomain }.${parts[2]}.org/>;
					schema:name "${ title }"@${ language }.
			}
		`;
		console.debug(query);
		let entity = await sparqlQuery(query);
		if (entity[0]) {
			let entityId = entity[0].item.value.match(/https?:\/\/www\.wikidata\.org\/entity\/(Q\d+)/)[1]
			return entityId;
		} else {
			return false;
		}
	}
};

export { wikipedia }
