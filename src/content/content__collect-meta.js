import {resolveAll} from '../resolver'

import ISBN from 'isbn3' 

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
			'books.author': 5,
			'books.book': 3331189,
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
		name: 'music:duration',
		type: 'Quantity',
		prop: 'P2047',
		suggested: true,
		hasTimeUnit: true,
	},	{
		name: 'video:duration',
		type: 'Quantity',
		prop: 'P2047',
		suggested: true,
		hasTimeUnit: true,
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
		process: (input) => {
			const isbnProperties = {
				P212: {
					test: 'isIsbn13',
					format: 'isbn13h',
				},
				P957: {
					test: 'isIsbn10',
					format: 'isbn10h',
				},
			}

			const parsed = ISBN.parse(input)

			for (const key in isbnProperties) {
				if (parsed[isbnProperties[key].test]) {
					return {
						prop: key,
						id: parsed[isbnProperties[key].format],
					}
				}
			}
		},
		suggested: true,
	},
	{
		name: 'books:page_count',
		prop: 'P1104',
		type: 'Quantity',
		suggested: true,
	}
];

const durations = [
	{
		name: 'year',
		wd: 'Q577',
		seconds: 31557600,
	},
	{
		name: 'week',
		wd: 'Q23387',
		seconds: 604800,
	},
	{
		name: 'day',
		wd: 'Q573',
		seconds: 86400,
	},
	{
		name: 'hour',
		wd: 'Q25235',
		seconds: 3600,
	},
	{
		name: 'minute',
		wd: 'Q7727',
		seconds: 60,
	},
	{
		name: 'second',
		wd: 'Q11574',
		seconds: 1,
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
								'entity-type': "item",
								'numeric-id': type.options[tags[key][delta]].toString(),
							}
						};
					}
				} else {
					let link = document.createElement('a')
					link.href = tags[key][delta]

					const resolutions = await resolveAll(link)
					resolutions.forEach(resolution => {
						enriched[newKey] = {
							verb: type.prop,
							object: {
								'entity-type': 'item',
								'numeric-id': resolution.entityId.replace(/^Q/, ''),
							}
						}
					})
				}
			} else if (type.type === 'String' || type.type === 'ExternalId') {
				let object = tags[key][delta]
				let verb = type.prop
				if ('process' in type) {
					const result = type.process(object)
					if (result) {
						object = result.id
						verb = result.verb
					}
				}
				enriched[newKey] = {
					verb: type.prop,
					object: object,
				};
			} else if (type.type === 'Quantity') {
				let amount = tags[key][delta];
				let unit = '1';

				if (type?.hasTimeUnit) {
					for (const interval of durations) {
						let divided = amount / interval.seconds;
						if (divided > 1 && divided % 1 === 0 && amount !== divided) {
							amount = divided;
							unit = `http://www.wikidata.org/entity/${interval.wd}`;
						}
					}
				}

				enriched[newKey] = {
					verb: type.prop,
					object: {
						amount: amount,
						unit: unit,
					}
				};
			} else if (type.type === 'Monolingualtext') {
				if (lang) {
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
