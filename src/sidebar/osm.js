import { templates } from './components/templates.tpl.js';

function addOsmComment(value, source) {
	let comment = templates.smallBlock(
		templates.text(
			[
				document.createTextNode('Found on '),
				templates.urlLink(source.url),
			]
		)
	)
	return [
		templates.text([
			value,
			comment,
		])
	];
}

const tagsAndKeys = [
	{
		tag: 'tourism=attraction',
		statement: {
			prop: 'P31',
			value: 'Q570116',
		}
	},
	{
		tag: 'amenity=restaurant',
		statement: {
			prop: 'P31',
			value: 'Q11707',
		}
	},
	{
		tag: 'amenity=cafe',
		statement: {
			prop: 'P31',
			value: 'Q30022',
		}
	},
	{
		tag: 'wheelchair=*',
		statement: {
			prop: 'P2846',
			value: (value) => {
				switch (value) {
					case 'no':
						return 'Q24192069';
					case 'yes':
						return 'Q24192067';
					default:
						return false;
				}
			},
		}
	},
	{
		tag: 'cuisine=chinese',
		statement: {
			prop: 'P2012',
			value: 'Q27477249',
		}
	},
	{
		tag: 'cuisine=regional',
		statement: {
			prop: 'P2012',
			value: 'Q94951',
		}
	},
	{
		tag: 'cuisine=indian',
		statement: {
			prop: 'P2012',
			value: 'Q192087',
		}
	},
	{
		tag: 'phone=*',
		statement: {
			prop: 'P1329',
			type: 'String',
		}
	},
	{
		tag: 'website=*',
		statement: {
			prop: 'P856',
			type: 'String',
		}
	},
	{
		tag: 'contact:email=*',
		statement: {
			prop: 'P968',
			type: 'String',
			value: (value) => {
				return `mailto:${value}`;
			},
		}
	},
];

async function wdGetOSMElements(qid) {
	const query = `
		[out:json][timeout:25];
		(
			node["wikidata"="${qid}"];
			way["wikidata"="${qid}"];
			relation["wikidata"="${qid}"];
		);
		out body;
		out meta;
		>;
		out skel qt;
	`
	const params = encodeURIComponent(query);
	let answer = await fetch(
		`https://overpass-api.de/api/interpreter?data=${params}`, 
		{
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json'
			} 
		}
	);
	let json = await answer.json();
	let relevantElements = [];

	for (const element of json.elements) {
		if (element?.tags?.wikidata === qid && element.version) {
			const Type = element.type.charAt(0).toUpperCase() + element.type.slice(1);
			relevantElements.push({
				sourceUrl: `https://www.openstreetmap.org/${element.type}/${element.id}/history#sidebar_content`,
				title: element?.tags?.name ? `${Type}: ${element.tags.name} (${element.id})` : `${Type}: ${element.id}`,
				element: element,
			});
		}
	}
	return relevantElements;
}

function OSMToSatements(data, propform, source) {
	if (data?.element?.tags) {		
		for (let key in data.element.tags) {
			for (let item of tagsAndKeys) {
				const keyValue = item.tag.split('=');
				if (data.element.tags.hasOwnProperty(keyValue[0]) && keyValue[0] === key) {
					if (data.element.tags[keyValue[0]] === keyValue[1] || keyValue[1] === '*') {

						const type = item?.statement?.type ?? 'Item';
						let value;
						if (item.statement.value) {
							value = typeof item.statement.value === 'function' ? item.statement.value(data.element.tags[keyValue[0]]) : item.statement.value;
						} else {
							value = data.element.tags[keyValue[0]];
						}

						if (!value) {
							continue;
						}

						let check = document.createElement('input');
						check.setAttribute('type', 'checkbox');
						check.setAttribute('name', item.prop + '[' + item.tag + ']' + data.element.id);
						let job = {
							type: 'set_claim',
							verb: item.statement.prop,
							references: [
								[
									{
										"snaktype": "value",
										"property": "P854",
										"datavalue": {
											"value": source.url,
											"type": "string"
										},
										"datatype": "url"
									},
									{
										"snaktype": "value",
										"property": "P1476",
										"datavalue": {
											"value": {
												text: source.title,
												language: 'en',
											},
											"type": "monolingualtext"
										},
										"datatype": "string"
									},
									{
										"snaktype": "value",
										"property": "P1282",
										"datavalue": {
											"type":"string",
											"value":`Tag:${keyValue[0]}=${data.element.tags[keyValue[0]]}`,
										},
										"datatype": "string"
									}
								]
							]
						};
						if (item?.statement?.type === 'String') {
							job.object = value;
						} else {
							job.object = {
								'entity-type': "item",
								'numeric-id': value.replace(/^Q/, ''),
							};
						}
						check.setAttribute('value', JSON.stringify(job))
						check.checked = true;
						let valueTpl;
						if (item?.statement?.type === 'String') {
							valueTpl = templates.code(value);
						} else {
							valueTpl = templates.placeholder({
								entity: value,
							});
						}
						let requiredStatementPreview = templates.remark({
							sortKey: item.statement.prop,
							check: check,
							prop: templates.placeholder({
								entity: item.statement.prop,
							}),
							vals: addOsmComment(valueTpl, source),
						});

						propform.appendChild(requiredStatementPreview);
					}
				}
			}
		}
	}
}

export { wdGetOSMElements, OSMToSatements }
