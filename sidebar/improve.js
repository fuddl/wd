import { wikidataGetEntity } from '../wd-get-entity.js';
import { constraintsToStatements } from './constraintsToStatements.js';
import { getFormatterUrls } from './get-formatter-urls.js';
import { findLinkedData, enrichLinkedData } from '../content/content__collect-ld.js';
import { ldToStatements } from './ldToStatements.js';

let content = document.getElementById('content');
let propform = document.createElement('form');
content.appendChild(propform);

const parser = new DOMParser();

if (window.location.search) {
	let currentEntity = window.location.search.match(/^\?(\w\d+)/, '')[1];
	if (currentEntity.match(/[QMPL]\d+/)) {
		( async()=> {
			const entities = await wikidataGetEntity(currentEntity, false);
			for (let id of Object.keys(entities)) {
				let entity = entities[id];
				for(let claim in entity.claims) {
					if (entity.claims[claim][0].mainsnak?.datatype === 'external-id') {
						let urls = await getFormatterUrls(claim, entity.claims[claim][0].mainsnak.datavalue.value);
						for (let url of urls) {
							let result = await fetch(url);
							let text = await result.text();
							if (text) {
								const doc = parser.parseFromString(text, "text/html");
								const ld = findLinkedData(doc);
								if (ld) {
									let enriched = await enrichLinkedData(ld, claim, doc);
									await ldToStatements(enriched, propform, {
										url: url,
										title: 'foo',
										lang: 'en',
									});
								}
							}
						}
					}
					const property = await wikidataGetEntity(claim, false);
					if (property[claim].claims?.P2302) {
						constraintsToStatements(claim, property[claim].claims.P2302, propform)
					}
				}
			}
		})()
	}
}