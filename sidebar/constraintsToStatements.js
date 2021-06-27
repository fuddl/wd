import { templates } from './components/templates.tpl.js';

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

function constraintsToStatements(prop, contraints, propform) {
	for (const contraint of contraints) {
		const contraintType = contraint.mainsnak.datavalue.value.id;
		switch (contraintType) {
			case 'Q21503250':
				if (contraint?.qualifiers?.P2309[0]?.datavalue?.value?.id === 'Q21503252') {
					let value = null;
					let check = null;
					if(contraint?.qualifiers?.P2308.length > 1) {
						value = document.createElement('select');
						value.setAttribute('name', prop + 'Q21503250');
						let emptyOption = document.createElement('option');
						value.appendChild(emptyOption);
						for (let entity of contraint?.qualifiers?.P2308) {
							let option = templates.placeholder({
								tag: 'option',
								entity: entity.datavalue?.value?.id,
								type: 'option',
							});
							value.appendChild(option);
							let job = {
								type: 'set_claim',
								verb: 'P31',
								object: {
									'entity-type': "item",
									'numeric-id': entity.datavalue?.value['numeric-id'],
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
								'numeric-id': contraint?.qualifiers?.P2308[0]?.datavalue?.value['numeric-id'],
							},
						}
						check.setAttribute('value', JSON.stringify(job))
						check.checked = true;
						value = templates.placeholder({
							entity: contraint?.qualifiers?.P2308[0]?.datavalue?.value?.id,
						})
					}
					let instanceOfPreview = templates.remark({
						check: check ? check : null,
						prop: templates.placeholder({
							entity: 'P31',
						}),
						vals: addConstraintComment(value, contraintType, prop),
					});

					propform.appendChild(instanceOfPreview);
				}
				break;
			case 'Q21503247':
				if (contraint?.qualifiers?.P2305) {
					let check = document.createElement('input');
					check.setAttribute('type', 'checkbox');
					check.setAttribute('name', prop + 'Q21503247');
					check.checked = true;

					let job = {
						type: 'set_claim',
						verb: contraint?.qualifiers?.P2306[0]?.datavalue?.value?.id,
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