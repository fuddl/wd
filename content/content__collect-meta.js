import { resolvers } from './resolver.js';

const usefullMetatags = [
	{
		name: 'og:title',
		prop: 'P1476',
		type: 'Monolingualtext',
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
			'video.movie': 11424610,
			'video.tv_show': 5398426,
			'wdff.edition': 3331189,
		}
	},
	{
		name: 'video:duration',
		type: 'Quantity',
		prop: 'P2047',
		unit: 'http://www.wikidata.org/entity/Q11574',
	},
	{
		name: 'video:series',
		type: 'WikibaseItem',
		prop: 'P179',
	},
	{
		name: 'books:author',
		type: 'WikibaseItem',
		prop: 'P50',
	},
	{
		name: 'books:isbn',
		prop: 'P212',
		type: 'ExternalId',
	},
	{
		name: 'books:page_count',
		prop: 'P1104',
		type: 'Quantity',
	}
];

async function enrichMetaData(tags, ids, url) {
	let enriched = {};
	for (let key in tags) {
		let type = usefullMetatags.find(v => v.name === key);
		if (type.type === 'WikibaseItem') {
			if (type.hasOwnProperty('options')) {
				if (type.options.hasOwnProperty(tags[key])) {
					enriched[key] = {
						verb: type.prop,
						object: {
							'numeric-id': type.options[tags[key]],
						}
					};
				}
			} else {
				for (let id of Object.keys(resolvers)) {
					let link = document.createElement('a');
					link.href = tags[key];
					let isApplicable = await resolvers[id].applicable(link);
					if (isApplicable) {
						let entityId = await resolvers[id].getEntityId(link);
						if (entityId) {
							enriched[key] = {
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
			enriched[key] = {
				verb: type.prop,
				object: tags[key],
			};
		} else if (type.type === 'Quantity') {
			enriched[key] = {
				verb: type.prop,
				object: {
					amount: tags[key],
					unit: type?.unit ?? '1',
				}
			};
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
				meta[property] = content;
			}
		}
	}
	if (meta.hasOwnProperty('books:isbn') && meta.hasOwnProperty('og:type')) {
		// it it has an isbn number it is an edition, not a book
		meta['og:type'] = 'wdff.edition';
	}

	return meta;
}

export { findMetaData, enrichMetaData, usefullMetatags }
