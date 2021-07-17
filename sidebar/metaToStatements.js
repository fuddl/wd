import { templates } from './components/templates.tpl.js';
import { makeReferences } from './ld-map-wd.js';
import { usefullMetatags } from '../content/content__collect-meta.js';

async function metaToStatements(meta, propform, source) {

	let comment = templates.smallBlock(
		templates.text(
			[
				document.createTextNode('Extracted from metadata of '),
				templates.urlLink(source.url),
			]
		)
	);

	for (let k in meta) {
		let type = usefullMetatags.find(v => v.name === k);
		let check = document.createElement('input');
		check.setAttribute('name', `meta-${k}`);
		let job = {
			type: 'set_claim',
			...meta[k],
			references: makeReferences(source),
		}
		console.debug(job);
		check.setAttribute('type', 'checkbox')
		check.setAttribute('value', JSON.stringify(job))
		check.checked = type?.suggested;
		let preview = document.createDocumentFragment();
		switch (type.type) {
			case 'WikibaseItem':
				preview = templates.placeholder({
					entity: `Q${meta[k].object['numeric-id']}`,
				});
				break;
			case 'String':
			case 'ExternalId':
				preview = templates.code(meta[k].object);
				break;
			case 'Quantity':
				preview = templates.unitNumber({
					number: `+${meta[k].object.amount}`,
					unit: meta[k].object?.unit,
				});
				break;
			default:
				console.debug(type.type)
			continue;
		}


		let propertyPreview = templates.remark({
			sortKey: meta[k].verb,
			check: check,
			prop: templates.placeholder({
				entity: meta[k].verb,
			}),
			vals: [
				templates.text([
					preview,
					comment.cloneNode(true),
				]),
			],
		});
		propform.appendChild(propertyPreview);
	}
}

export { metaToStatements }