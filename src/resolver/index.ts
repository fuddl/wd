import { cache } from './cache'
import { commons } from './commons'
import { doi } from './doi'
import { hash } from './hash'
import { inventaire } from './inventaire'
import { URL_match_pattern } from './url-match-pattern'
import { wikipedia } from './wikipedia'
import { schemaOrg } from './schema-org'
import { url } from './url'
import { googleMaps } from './google-maps'

const resolvers = {
	wikidata: {
		regex: /^https:\/\/[\w]+.wikidata.org\/w(?:iki\/|\/index\.php\?title=)(?:Special:WhatLinksHere\/|Talk\:)?(?:\w+\:)?([QMPL]\d+)/,
		applicable: function(location) {
			return location.href.match(this.regex) !== null
		},
		getEntityId: function(location) {
			return location.href.match(this.regex)[1]
		}
	},
	hash: hash,
	cache: cache,
	wikipedia: wikipedia,
	inventaire: inventaire,
	commons: commons,
	URL_match_pattern: URL_match_pattern,
	doi: doi,
	schemaOrg: schemaOrg,
	googleMaps: googleMaps,
	url: url,
}

export { resolvers }
