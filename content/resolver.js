import { cache } from './resolver__cache.js';
import { commons } from './resolver__commons.js';
import { doi } from './resolver__doi.js';
import { hash } from './resolver__hash.js';
import { inventaire } from './resolver__inventaire.js';
import { isbn } from './resolver__isbn.js';
import { officialWebsite } from './resolver__official-website.js';
import { URL_match_pattern } from './resolver__url-match-pattern.js';
import { wikipedia } from './resolver__wikipedia.js';

const resolvers = {
	wikidata: {
		applicable: function(location) {
			return location.href.match(/https:\/\/[\w]+.wikidata.org\/wiki\/(?:\w+\:)?[QMPL]\d+/) !== null;
		},
		getEntityId: function(location) {
			return location.href.match(/https:\/\/[\w]+.wikidata.org\/wiki\/(?:\w+\:)?([QMPL]\d+)/)[1];
		}
	},
	hash: hash,
	cache: cache,
	wikipedia: wikipedia,
	inventaire: inventaire,
	commons: commons,
	URL_match_pattern: URL_match_pattern,
	doi: doi,
	// officialWebsite: officialWebsite,
	// isbn: isbn,
};

export { resolvers }