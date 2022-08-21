import { templates } from './components/templates.tpl.js';
import { findMatchingClass, findConnections, makeReferences } from './ld-map-wd.js';

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}



async function ldToStatements(ld, propform, source, existing) {

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
			(async () => {

				let matchingClasses = await findMatchingClass(d)
				if (matchingClasses?.[0]) {
					let check, select;

					if (matchingClasses.length == 1) {
						let job = {
							type: 'set_claim',
							verb: 'P31',
							object: {
								'entity-type': "item",
								'numeric-id': matchingClasses[0].match(/Q(\d+)/)[1],
							},
							references: makeReferences(source),
						}
						
						// if the job already exists, we head straigt to the next
						existing.check(job);

						check = document.createElement('input');
						check.setAttribute('name', uuidv4());
						check.setAttribute('type', 'checkbox')
						check.setAttribute('value', JSON.stringify(job))
						
						// since these tend to be wrong or unprecise
						check.checked = false;
					} else {
						select = document.createElement('select');
						select.setAttribute('name', uuidv4());
						let emptyOption = document.createElement('option');
						select.appendChild(emptyOption)

						for (let item of matchingClasses) {
							const instructions = {
								type: 'set_claim',
								verb: 'P31',
								object: {
									'entity-type': "item",
									'numeric-id': item.match(/Q(\d+)/)[1],
								},
								references: makeReferences(source),
							}

							let option = templates.placeholder({
								tag: 'option',
								entity: item,
								type: 'option',
							});
							option.setAttribute('value', JSON.stringify(instructions));

							select.appendChild(option);
						}
					}
					let instanceOfPreview = templates.remark({
						sortKey: 'P31',
						check: check ? check : document.createTextNode(''),
						prop: templates.placeholder({
							entity: 'P31',
						}),
						vals: [ templates.text([
								select ?? templates.placeholder({
									entity: matchingClasses[0],
								}),
								comment.cloneNode(true),
							]),
						],
					});
					propform.appendChild(instanceOfPreview);
				}
			})()
			let connections = await findConnections(d, source);
			for (let connection of connections) {
				if (connection.jobs) {
					let check, label, select;

					if (connection.jobs.length === 1) {
						if (existing.check(connection.jobs[0].instructions)) {
							continue;
						}
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
							if (existing.check(job.instructions)) {
								continue;
							}
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
						sortKey: connection.prop.join(),
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