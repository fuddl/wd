import { wikidataGetEntity } from '../wd-get-entity.js';
import { getCurrentTab } from '../get-current-tab.js';
import { getAutodesc } from './get-autodesc.js';
import { resolvePlaceholders } from './resolve-placeholders.js';
import { getTokens } from './wd-get-token.js';
import { findMatchingClass, findConnections } from './ld-map-wd.js';
import { templates } from './components/templates.tpl.js';

function getPropertyScope(property) {
	let scopes = {
		'Q54254515': 'lexeme',
	};
	if (property.claims.P31) {
		for (let instanceOf of property.claims.P31) {
			if (instanceOf.mainsnak.datavalue.value.id) {
				if (scopes[instanceOf.mainsnak.datavalue.value.id]) {
					return scopes[instanceOf.mainsnak.datavalue.value.id];
				}
			}
		}
	}
	return 'item';
}

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

(async () => {
	let proposals = JSON.parse(decodeURIComponent(window.location.search.replace(/^\?/, '')));
	let content = document.getElementById('content');
	let propform = document.createElement('form');
	content.appendChild(propform);

	let currentTab = await getCurrentTab()

	let property = await wikidataGetEntity(proposals.ids[0][0].prop);

	let preview = templates.remark({
		prop: templates.placeholder({
			entity: proposals.ids[0][0].prop,
		}),
		vals: [templates.code(proposals.ids[0][0].value)],
	});


	let counter = 0;

	propform.appendChild(preview);

	if (proposals.ld) {
		let comment = templates.smallBlock(
			templates.text(
				[
					document.createTextNode('Extracted from metadata of '),
					templates.urlLink(proposals.source.url),
				]
			)
		);
		for (let d of proposals.ld) {
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
				let connections = await findConnections(d, proposals?.source);
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
						propform.appendChild(preview);					
					}
				}
			}
		}
	}

	if(property[proposals.ids[0][0].prop]?.claims?.P2302) {
		
		const contraints = property[proposals.ids[0][0].prop].claims.P2302;
		for (const contraint of contraints) {
			const contraintType = contraint.mainsnak.datavalue.value.id;
			switch (contraintType) {
				case 'Q21503250':
					if (contraint?.qualifiers?.P2309[0]?.datavalue?.value?.id === 'Q21503252') {
						let value = null;
						let check = null;
						if(contraint?.qualifiers?.P2308.length > 1) {
							value = document.createElement('select');
							value.setAttribute('name', counter);
							let emptyOption = document.createElement('option');
							value.appendChild(emptyOption);
							for (let entity of contraint?.qualifiers?.P2308) {
								let option = document.createElement('option');
								option.innerText = entity.datavalue?.value?.id;
								option.classList.add('placeholder');
								option.setAttribute('data-entity', entity.datavalue?.value?.id);
								option.setAttribute('data-type', 'option');
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
							check.setAttribute('name', counter);
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
							vals: addConstraintComment(value, contraintType, proposals.ids[0][0].prop),
						});

						propform.appendChild(instanceOfPreview);
					}
					break;
				case 'Q21503247':
					if (contraint?.qualifiers?.P2305) {
						let check = document.createElement('input');
						check.setAttribute('type', 'checkbox');
						check.setAttribute('name', counter);
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
							vals: addConstraintComment(value, contraintType, proposals.ids[0][0].prop)
						});

						propform.appendChild(requiredStatementPreview);
					}
					break;
			}
			counter++;
		}
	}


	resolvePlaceholders();

	let labelField = templates.join({
		human: proposals.titles[0],
		scope: getPropertyScope(property[proposals.ids[0][0].prop]),
		id: 'joiner',
	});
	let direction = templates.direction();

	content.appendChild(direction);

	content.appendChild(labelField);

	let saveButton = document.createElement('button');
	saveButton.setAttribute('disabled', 'disabled');
	saveButton.innerText = 'Connect to Wikidata';


	let form = document.createElement('div');
	form.classList.add('submit-actions');
	form.appendChild(saveButton);
	content.appendChild(form);

	let selectedEntity = '';

	var observer = new MutationObserver(function(mutations) {
		mutations.forEach(function(mutation) {
			if (mutation.type == "attributes") {
				if (labelField.hasAttribute('data-selected-entity')) {
					saveButton.removeAttribute('disabled');
					selectedEntity = labelField.getAttribute('data-selected-entity');
				}
			}
		});
	});

	observer.observe(labelField, {
		attributes: true,
	});

	saveButton.addEventListener('click', async function() {
		if (selectedEntity && !saveButton.hasAttribute('disabled')) {
			saveButton.setAttribute('disabled', 'disabled');

			let jobs = [];

			if (selectedEntity === 'CREATE') {
				let lang = navigator.language.substr(0,2);;
				jobs.push({
					type: 'create',
					label: labelField.getAttribute('data-selected-label'),
					lang: lang,
					fromTab: proposals.fromTab,
					fromUrl: proposals.source.url,
				});
				selectedEntity = 'LAST'; 
			}

			let now = new Date();

			jobs.push({
				type: 'set_claim',
				subject: selectedEntity,
				verb: proposals.ids[0][0].prop,
				object: proposals.ids[0][0].value,
				fromTab: currentTab,
				references: [{
					"P854": [{
						"snaktype": "value",
						"property": "P854",
						"datavalue": {
							"value": proposals.source.url,
							"type": "string"
						},
						"datatype": "url"
					}],
					"P1476": [{
						"snaktype": "value",
						"property": "P1476",
						"datavalue": {
							"value": {
								"text": proposals.source.title.trim(),
								"language": proposals.source.lang ? proposals.source.lang : 'zxx',
							},
							"type": "monolingualtext"
						},
						"datatype": "string"
					}],
					"P813": [{
						"snaktype": "value",
						"property": "P813",
						"datavalue": {
							"type": "time",
							"value": {
								"after": 0,
								"before": 0,
								"calendarmodel": "http://www.wikidata.org/entity/Q1985727",
								"precision": 11,
								"time": `+${ now.toISOString().substr(0,10) }T00:00:00Z`,
								"timezone": 0
							}
						}
					}]
				}],
			});


			const formData = new FormData(propform)
			for (let pair of formData.entries()) {
				if (pair[1] != '') {
				 	let job = JSON.parse(pair[1]);
				 	if (!job.subject) {
				 		job.subject = selectedEntity;
				 	}
			 		job.fromTab = currentTab;
				 	jobs.push(job);
				}
			}

			browser.runtime.sendMessage({
				type: 'send_to_wikidata',
				data: jobs,
			});

			browser.runtime.sendMessage({
				type: 'wait',
				tid: currentTab,
			});
		}
	});
	let token = await getTokens();
	if (token === "+\\") {
		let warning = document.createElement('p');

		warning.style['background-color'] = '#ffe5e5';
		warning.style['color'] = 'red';
		warning.style['padding'] = '1em';

		let text1 = document.createTextNode(`
			It appears that you are not logged into a wikidata account. Please note 
			that some of your edits might fail, because of wikidata's spam protection. 
			Also note that your public IP address will be publicly visible in the edit
			history. It is strongly advised that you `);
		warning.appendChild(text1);

		let loginLink = document.createElement('a');
		loginLink.innerText = ' log in ';
		loginLink.setAttribute('href', 'https://www.wikidata.org/wiki/Special:UserLogin');
		warning.appendChild(loginLink);
		
		let text2 = document.createTextNode(' or ');
		warning.appendChild(text2);

		let createAccountLink = document.createElement('a');
		createAccountLink.innerText = ' create an account ';
		createAccountLink.setAttribute('href', 'https://www.wikidata.org/wiki/Special:CreateAccount');
		warning.appendChild(createAccountLink);
		
		let text3 = document.createTextNode(`
			. Among other benefits, your edits will be attributed to a user name.
		`);
		warning.appendChild(text3);
		
		content.insertBefore(warning, labelField);
	}
})()
