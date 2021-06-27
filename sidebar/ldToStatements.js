import { templates } from './components/templates.tpl.js';
import { findMatchingClass, findConnections, makeReferences } from './ld-map-wd.js';

async function ldToStatements(ld, propform, source) {

	let comment = templates.smallBlock(
		templates.text(
			[
				document.createTextNode('Extracted from metadata of '),
				templates.urlLink(source.url),
			]
		)
	);

	for (let d of ld) {
		if (d.hasOwnProperty('isNeedle') && d.isNeedle) {
			let matchingClass = await findMatchingClass(d);
			if (matchingClass) {
				counter++;
				let check = document.createElement('input');
				check.setAttribute('name', counter);
				let job = {
					type: 'set_claim',
					verb: 'P31',
					object: {
						'entity-type': "item",
						'numeric-id': matchingClass.match(/Q(\d+)/)[1],
					},
					references: makeReferences(source),
				}
				check.setAttribute('type', 'checkbox')
				check.setAttribute('value', JSON.stringify(job))
				check.checked = true;

				let instanceOfPreview = templates.remark({
					check: check,
					prop: templates.placeholder({
						entity: 'P31',
					}),
					vals: [
						templates.text([
							templates.placeholder({
								entity: matchingClass,
							}),
							comment.cloneNode(true),
						]),
					],
				});
				propform.appendChild(instanceOfPreview);
			}
			let connections = await findConnections(d, source);
			for (let connection of connections) {
				if (connection.jobs) {
					counter++;
					let check, label, select;

					if (connection.jobs.length === 1) {
						check = document.createElement('input');
						label = templates.placeholder({
							entity: connection.jobs[0].label,
						});
						check.setAttribute('type', 'checkbox');
						check.setAttribute('name', counter);
						check.setAttribute('value', JSON.stringify(connection.jobs[0].instructions));
						check.checked = true;
					} else {
						select = document.createElement('select');
						select.setAttribute('name', counter);
						let emptyOption = document.createElement('option');
						select.appendChild(emptyOption);
						for (let job of connection.jobs) {
							let option = document.createElement('option');
							option.innerText = job.label;
							option.classList.add('placeholder');
							option.setAttribute('data-entity', job.label);
							option.setAttribute('data-type', 'option');
							option.setAttribute('value', JSON.stringify(job.instructions))
							select.appendChild(option);
						}
					}
					let valuePreview;
					switch (connection?.value?.type) {
						case 'WikibaseItem':
							valuePreview = templates.placeholder({
								entity: connection.value.value,
							});
							break;
						case 'Monolingualtext':
							valuePreview = templates.title({text: connection.value.value});
							break;
						case 'String':
							valuePreview = templates.code(connection.value.value);
							break;
						case 'Time':
							valuePreview = templates.time({text: document.createTextNode(connection.value.value)});
							break;
						case 'Quantity':
							valuePreview = templates.unitNumber({
								number: connection.value.value.amount,
								unit: connection?.value.value?.unit,
							});
							break;
					}
					let preview = templates.remark({
						check: check ? check : document.createTextNode(''),
						prop: label ? label : select,
						vals: [
							templates.text([
								valuePreview,
								comment.cloneNode(true),
							]),
						],
					});
					propform.appendChild(preview, propform);					
				}
			}
		}
	}
}

export { ldToStatements }