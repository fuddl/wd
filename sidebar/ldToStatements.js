import { templates } from './components/templates.tpl.js';
import { findMatchingClass, findConnections, makeReferences } from './ld-map-wd.js';

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

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
				let check = document.createElement('input');
				check.setAttribute('name', uuidv4());
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
					let check, label, select;

					if (connection.jobs.length === 1) {
						check = document.createElement('input');
						label = templates.placeholder({
							entity: connection.jobs[0].label,
						});
						check.setAttribute('type', 'checkbox');
						check.setAttribute('name', uuidv4());
						check.setAttribute('value', JSON.stringify(connection.jobs[0].instructions));
						check.checked = true;
					} else {
						select = document.createElement('select');
						select.setAttribute('name', uuidv4());
						let emptyOption = document.createElement('option');
						select.appendChild(emptyOption);
						for (let job of connection.jobs) {
							let option = templates.placeholder({
								tag: 'option',
								entity: job.label,
								type: 'option',
							});
							option.setAttribute('value', JSON.stringify(job.instructions));

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