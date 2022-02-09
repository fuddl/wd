import { sparqlQuery } from '../sqarql-query.js'
import {RegexResolver} from './types'

const wikipedia: RegexResolver = {
	id: 'wikipedia',
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
	async applicable (location){
		if(location.href.match(this.regex) !== null ) {
			const parts = location.href.match(this.regex)
			if (parts[1] === 'commons') {
				parts[1] = ''
			}
			return [{
				sitelink: `${parts[1]}${this.sites[parts[2]]}`,
				value: parts[3],
			}]
		} else {
			return false
		}
	},
	async getEntityId(location) {
		const parts = location.href.match(this.regex)
		const title = decodeURIComponent(parts[3]).replace(/_/g, ' ')
		const subdomain = parts[1]
		const language = subdomain !== 'commons' ? subdomain : 'en'
		const query = `
			SELECT ?item WHERE {
				?sitelink schema:about ?item;
					schema:isPartOf <https://${subdomain}.${parts[2]}.org/>;
					schema:name "${title}"@${language}.
			}
		`
		console.debug(query)
		const entity = await sparqlQuery(query)
		if (entity[0]) {
			const entityId = entity[0].item.value.match(/https?:\/\/www\.wikidata\.org\/entity\/(Q\d+)/)[1]
			return entityId
		} else {
			return false
		}
	},
}

export { wikipedia }
