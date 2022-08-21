import { templates } from './components/templates.tpl.js';
import { sparqlQuery } from "../sqarql-query.js";

function addConstraintComment(value, constraintId, propId) {
	let comment = templates.smallBlock(
		templates.text(
			[
				document.createTextNode('Deduced from '),
				templates.placeholder({
					entity: constraintId,
				}),
				document.createTextNode(' of '),
				templates.placeholder({
					entity: propId,
				}),
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



function constraintsToStatements(prop, contraints, propform, classes) {
	// this array contains a list of classes that the target item is already
	// an instance of. We don't want to propose adding more 'instance of' statement
	// that don't enrich the entity in any meaningful way. If the enity does not yet
	// exists, the array is empty.
	classes ||= [];

	for (const contraint of contraints) {
		const contraintType = contraint.mainsnak.datavalue.value.id;
		switch (contraintType) {
			case 'Q21503250': // type constraint
				const requiresInstanceOrSubclassOf = contraint?.qualifiers?.P2309?.[0]?.datavalue?.value?.id === 'Q30208840'
				let value = null;
				let check = null;

				let proposedClasses = contraint.qualifiers.P2308.map((delta) => {
					return delta.datavalue.value.id;
				});
				// if one of the proposed classes is already there, we don't need
				// to go any further.
				if (classes.filter(value => proposedClasses.includes(value)).length > 0) {
					continue;
				}

				(async () => {
					const options = []

					for (let entity of contraint?.qualifiers?.P2308) {
						options.push(entity.datavalue?.value)
					}

					if (requiresInstanceOrSubclassOf) {
						const query = `
							SELECT ?s WHERE {
								{ 	${
										options.map((option) => { return `?subclass wdt:P279 wd:${option.id}.` })
											.join('} UNION {')
									}
								}
								BIND (REPLACE(STR(?subclass), 'http://www.wikidata.org/entity/', '') AS ?s)
							}
							LIMIT 20
						`
						console.debug(query)
						let result = await sparqlQuery(query);
						console.debug(result)
						if (result[0]) {
							let more = result.map((i) => {
									return {
										id: i.s.value,
										'numeric-id': parseInt(i.s.value.replace('^\w', '')),
									}
								}
							)
							options.push(...more)
						}
					}

					if (options.length != 0) {
						if (options.length > 1) {

							value = document.createElement('select');
							value.setAttribute('name', prop + 'Q21503250');
							let emptyOption = document.createElement('option');
							value.appendChild(emptyOption);
							for (let entity of options) {
								let option = templates.placeholder({
									tag: 'option',
									entity: entity.id,
									type: 'option',
								});
								value.appendChild(option);
								let job = {
									type: 'set_claim',
									verb: 'P31',
									object: {
										'entity-type': "item",
										'numeric-id': entity['numeric-id'],
									},
								}
								option.setAttribute('value', JSON.stringify(job))
							}
						} else {
							check = document.createElement('input');
							check.setAttribute('type', 'checkbox');
							check.setAttribute('name', prop + 'Q21503250');
							let job = {
								type: 'set_claim',
								verb: 'P31',
								object: {
									'entity-type': "item",
									'numeric-id': options[0]['numeric-id'],
								},
							}
							check.setAttribute('value', JSON.stringify(job))
							check.checked = true;
							value = templates.placeholder({
								entity: options[0].id,
							})
						}
						let instanceOfPreview = templates.remark({
							sortKey: 'P31',
							check: check ? check : null,
							prop: templates.placeholder({
								entity: 'P31',
							}),
							vals: addConstraintComment(value, contraintType, prop),
						});

						propform.insertBefore(instanceOfPreview, propform.firstChild);
					}
				})()
				break;
			case 'Q21503247': // item-requires-statement constraint
				if (contraint?.qualifiers?.P2305) {
					let check = document.createElement('input');
					check.setAttribute('type', 'checkbox');
					check.setAttribute('name', prop + 'Q21503247');
					check.checked = true;
					const verb = contraint?.qualifiers?.P2306[0]?.datavalue?.value?.id;

					let job = {
						type: 'set_claim',
						verb: verb,
						object: {
							'entity-type': "item",
							'numeric-id': contraint?.qualifiers?.P2305[0]?.datavalue?.value['numeric-id'],
						},
					}

					check.setAttribute('value', JSON.stringify(job))

					let value = templates.placeholder({
						entity: contraint?.qualifiers?.P2305[0]?.datavalue?.value?.id,
					});

					let requiredStatementPreview = templates.remark({
						sortKey: verb,
						check: check,
						prop: templates.placeholder({
							entity: contraint?.qualifiers?.P2306[0]?.datavalue?.value?.id,
						}),
						vals: addConstraintComment(value, contraintType, prop)
					});

					propform.appendChild(requiredStatementPreview);
				}
				break;
		}
	}
}

export { constraintsToStatements }
