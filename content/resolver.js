import { cache } from './resolver__cache.js';
import { commons } from './resolver__commons.js';
import { doi } from './resolver__doi.js';
import { hash } from './resolver__hash.js';
import { inventaire } from './resolver__inventaire.js';
//import { isbn } from './resolver__isbn.js';
//import { officialWebsite } from './resolver__official-website.js';
import { URL_match_pattern } from './resolver__url-match-pattern.js';
import { wikipedia } from './resolver__wikipedia.js';
import { schemaOrg } from './resolver__schema-org.js';
import { url } from './resolver__url.js';
import { googleMaps } from './resolver__google-maps.js';

const resolvers = {
	wikidata: {
		regex: /^https:\/\/[\w]+.wikidata.org\/w(?:iki\/|\/index\.php\?title=)(?:Special:WhatLinksHere\/|Talk\:)?(?:\w+\:)?([QMPL]\d+)/,
		applicable: function(location) {
			return location.href.match(this.regex) !== null;
		},
		getEntityId: function(location) {
			return location.href.match(this.regex)[1];
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
	//officialWebsite: officialWebsite,
	url: url,
	// isbn: isbn,
};

export { resolvers }