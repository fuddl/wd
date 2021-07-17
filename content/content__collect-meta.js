import { resolvers } from './resolver.js';
import { makeLanguageValid } from '../get-valid-string-languages.js';

const usefullMetatags = [
	{
		name: 'og:title',
		prop: 'P1476',
		type: 'Monolingualtext',
		suggested: false,
	},
	{
		name: 'og:type',
		prop: 'P31',
		type: 'WikibaseItem',
		options: {
			'books.author': 36180,
			'books.book': 571,
			'music.album': 482994,
			'music.playlist': 1569406,
			'music.radio_station': 14350,
			'music.song': 2188189,
			'video.episode': 21191270,
			'video.movie': 11424,
			'video.tv_show': 5398426,
			'wdff.edition': 3331189,
		},
		suggested: false,
	},
	{
		name: 'video:duration',
		type: 'Quantity',
		prop: 'P2047',
		unit: 'http://www.wikidata.org/entity/Q11574',
		suggested: true,
	},
	{
		name: 'video:series',
		type: 'WikibaseItem',
		prop: 'P179',
		suggested: true,
	},
	{
		name: 'books:author',
		type: 'WikibaseItem',
		prop: 'P50',
		suggested: true,
	},
	{
		name: 'books:isbn',
		prop: 'P212',
		type: 'ExternalId',
		suggested: true,
	},
	{
		name: 'books:page_count',
		prop: 'P1104',
		type: 'Quantity',
		suggested: true,
	}
];

async function enrichMetaData(tags, lang, url) {
	let enriched = {};
	for (let key in tags) {
		let type = usefullMetatags.find(v => v.name === key);
		for (let delta in tags[key]) {
			const newKey = `${key}|${delta}`;
			if (type.type === 'WikibaseItem') {
				if (type.hasOwnProperty('options')) {
					if (type.options.hasOwnProperty(tags[key])) {
						enriched[newKey] = {
							verb: type.prop,
							object: {
								'numeric-id': type.options[tags[key][delta]],
							}
						};
					}
				} else {
					for (let id of Object.keys(resolvers)) {
						let link = document.createElement('a');
						link.href = tags[key][delta];
						let isApplicable = await resolvers[id].applicable(link);
						if (isApplicable) {
							let entityId = await resolvers[id].getEntityId(link);
							if (entityId) {
								enriched[newKey] = {
									verb: type.prop,
									object: {
										'numeric-id': entityId.replace(/^Q/, ''),
									}
								};
							}
						}
					}
				}
			} else if (type.type === 'String' || type.type === 'ExternalId') {
				enriched[newKey] = {
					verb: type.prop,
					object: tags[key][delta],
				};
			} else if (type.type === 'Quantity') {
				enriched[newKey] = {
					verb: type.prop,
					object: {
						amount: tags[key][delta],
						unit: type?.unit ?? '1',
					}
				};
			} else if (type.type === 'Monolingualtext') {
				if (lang) {
					console.debug(lang);
					enriched[newKey] = {
						verb: type.prop,
						object: {
							text: tags[key][delta],
							language: lang,
						}
					};
				}
			}
		}
	}
	return enriched;
}

function findMetaData(document) {
	const tags = document.querySelectorAll('meta[name], meta[property]');

	if (tags.length < 1) {
		return []
	}

	let meta = {};
	for (let tag of tags) {
		let property = tag.getAttribute('name') || tag.getAttribute('property'); 
		if (property && usefullMetatags.find(v => v.name === property)) {
			let content = tag.getAttribute('content');
			if (content != 'null') {
				if (!meta.hasOwnProperty(property)) {
					meta[property] = [];
				}
				meta[property].push(content);
			}
		}
	}
	if (meta.hasOwnProperty('books:isbn') && meta.hasOwnProperty('og:type')) {
		// it it has an isbn number it is an edition, not a book
		meta['og:type'] = ['wdff.edition'];
	}
	return meta;
}

export { findMetaData, enrichMetaData, usefullMetatags }
