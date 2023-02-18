import {wikidataGetEntity} from '../wd-get-entity.js'
import {getValueByLang} from './get-value-by-lang.js'
import {templates} from './components/templates.tpl.js'
import {sparqlQuery} from '../sqarql-query.js'
import {updateStatus} from "../update-status.js"
import browser from 'webextension-polyfill'
import {PrependNav} from './prepend-nav.js'
import {Browser} from "../core/browser"
import {unlockAndWait} from "./sidebar-control"
import { initializeCache } from './cache.js'
import { getWebsiteItem } from '../list-check.js'

initializeCache()
PrependNav();

const itemTypes = [
	"wikibase-item",
	"wikibase-lexeme",
	"wikibase-property",
];

const stringTypes = [
	'string',
	'monolingualtext',
];

async function askIfStatementExists(subject, verb, object) {
	let question = `
		ASK {
			wd:${subject} p:${verb} ?stmt .
			?stmt ps:${verb} wd:${object} .
		}
	`;

	let answer = await sparqlQuery(question);
	if (answer.boolean) {
		return answer.boolean;
	} else {
		return false;
	}
}

let bouncer = templates.bouncer();
let bouncerCleared = false;
document.body.appendChild(bouncer);

function clearBouncer() {
	if (!bouncerCleared) {
		bouncerCleared = true;
		document.body.removeChild(bouncer);
	}
}

let currentEntity = window.location.search.match(/^\?(\w\d+)/, '')[1];

browser.runtime.sendMessage({
	type: 'lock_sidebar',
});

let content = document.getElementById('content');
content.innerHTML = '';
(async () => {
    updateStatus([
        'Searching this website for links that can be correlated to wikidata…',
    ])
	let entities = await wikidataGetEntity(currentEntity);
	let e = entities[currentEntity];
	let currentTab = await Browser.getCurrentTabIdForAllContexts()

	let description = getValueByLang(e, 'descriptions', false);
	let hasDescription = description != false;

	content.appendChild(templates.ensign({
		revid: e.lastrevid,
		id: currentEntity,
		label: getValueByLang(e, 'labels', e.title),
		description: {
			text: description,
			provisional: !hasDescription
		},
	}));

	let direction = templates.direction({flippable: true});

	content.appendChild(direction);

	let propPicker = templates.express({entity: currentEntity});
	content.appendChild(propPicker.element);

	let receivedEntities = [];

	let saveButton = document.createElement('button');

	let checkSaveButton = function() {
		let datatype =	propPicker.element.getAttribute('data-datatype');
		let propertSelected = propPicker.element.hasAttribute('data-prop');
		let selectedEntities = propPicker.selection.querySelectorAll(`[data-selected]`);
		let formData = new FormData(statements)
		if (
			(
				selectedEntities.length > 0 &&
				propertSelected &&
			 	itemTypes.includes(datatype)
			) ||
			[...formData.entries()].length > 0
		) {
			saveButton.removeAttribute('disabled');
		} else if (
			propertSelected &&
			stringTypes.includes(datatype) &&
			propPicker.composer.value !== ''
		) {
			saveButton.removeAttribute('disabled');
		} else {
			saveButton.setAttribute('disabled', 'disabled');
		}
	};

	browser.runtime.onMessage.addListener(async (data, sender) => {
        //console.log("add-content event", data)
		if (data.type === 'entity_add') {
			clearBouncer();
			if (!receivedEntities.includes(data.id)) {
				receivedEntities.push(data.id);

				let tag = templates.express__tag({
					id: data.id,
					dest: propPicker.selection,
					src: propPicker.options,
					refresh: checkSaveButton,
				});

				propPicker.options.appendChild(tag);
				tag.postProcess();
			}
		}

		if (data.type === 'use_in_statement') {
			clearBouncer();
			let target = {};
			if (data.dataype === 'wikibase-item') {
				target = propPicker.element.querySelector(`[data-entity="${ data.wdEntityId }"]`);

				target.toggle();

				(async () => {
					let flipped = direction.hasAttribute('data-flipped');
					let prop = propPicker.element.getAttribute('data-prop');
					let exists = await askIfStatementExists(flipped ? data.wdEntityId : currentEntity, prop , flipped ? currentEntity : data.wdEntityId);

					if (exists) {
						target.setAttribute('data-statement-exists', true);
					}
				})();
			} else if (data.dataype === 'string') {
				target = propPicker.composer;
				target.innerText = data.value;

				checkSaveButton();
			}
			if (data.reference.url) {
				const wikimediaProject = await getWebsiteItem(data.reference.url)
				target.setAttribute('data-reference-url', data.reference.url);
				if (wikimediaProject) {
					target.setAttribute('data-reference-project', wikimediaProject);
				}
			}
			if (data.reference.section) {
				target.setAttribute('data-reference-section', data.reference.section);
			}
			if (data.reference.title) {
				target.setAttribute('data-reference-title', data.reference.title);
			}
			if (data.reference.language) {
				target.setAttribute('data-reference-language', data.reference.language);
			}
			if (data.valueLang) {
				propPicker.languagePicker.value = data.valueLang.toLowerCase();
			}

		} else if (data.type === 'use_as_statement') {
			const check = document.createElement('input')
			check.setAttribute('type', 'checkbox')
			check.setAttribute('name', `${data.verb}-${data.object}`)
			check.checked = true
			const job = {
				type: 'set_claim',
				verb: data.verb,
				object: data.object,
				references: [ (()=> {
					let reference = []
					if (data?.reference?.url) {
						reference.push({
							"snaktype": "value",
							"property": "P854",
							"datavalue": {
								"value": data.reference.url,
								"type": "string"
							},
							"datatype": "url"
						})
					}

					if (data?.reference?.title) {
						reference.push({
							"snaktype": "value",
							"property": "P1476",
							"datavalue": {
								"value": {
									text: data.reference.title,
									language: data.reference.language,
								},
								"type": "monolingualtext"
							},
							"datatype": "string"
						})
					}

					if (data?.reference?.section) {
						reference.push({
							"snaktype": "value",
							"property": "P958",
							"datavalue": {
								"value": data.reference.section,
								"type": "string"
							},
							"datatype": "string"
						})
					}
					return reference
				})() ]
			}

			check.setAttribute('value', JSON.stringify(job))
			check.addEventListener('change', () => {
				checkSaveButton()
			})
			statements.appendChild(templates.remark({
				prop: templates.placeholder({ entity: data.verb }),
				vals: [templates.code(data.object)],
				check: check,
			}));
			checkSaveButton()
		}
	});

	browser.runtime.sendMessage({
		type: 'collect_pagelinks',
		subject: currentEntity,
	});

	const statements = document.createElement('form')
	content.appendChild(statements);

	saveButton.setAttribute('disabled', 'disabled');
	saveButton.innerText = 'Send to Wikidata';

	document.body.appendChild(templates.footer(saveButton));

	propPicker.element.addEventListener('change', function() {
		checkSaveButton();
	});
	propPicker.composer.addEventListener('change', function() {
		checkSaveButton();
	});

	saveButton.addEventListener('click', function() {
		if (!saveButton.hasAttribute('disabled')) {
			saveButton.setAttribute('disabled', 'disabled')
			let selecteds = propPicker.selection.querySelectorAll('[data-selected]');

			let flipped = direction.hasAttribute('data-flipped');

			let now = new Date();

			let jobs = [];

			let currentEntityType = currentEntity.startsWith('L') ? 'lexeme' : 'item'
			let currentEntityNummericId = parseInt(currentEntity.replace(/\w/,''));
			if (stringTypes.includes(propPicker.element.getAttribute('data-datatype'))) {
				let reference = [];
				if (propPicker.composer.getAttribute('data-reference-url')) {
					reference.push({
						"snaktype": "value",
						"property": "P854",
						"datavalue": {
							"value": propPicker.composer.getAttribute('data-reference-url'),
							"type": "string"
						},
						"datatype": "url"
					});
				}

				if (propPicker.composer.getAttribute('data-reference-title')) {
					reference.push({
						"snaktype": "value",
						"property": "P1476",
						"datavalue": {
							"value": {
								text: propPicker.composer.getAttribute('data-reference-title'),
								language: propPicker.composer.getAttribute('data-reference-language'),
							},
							"type": "monolingualtext"
						},
						"datatype": "string"
					});
				}

				if (propPicker.composer.getAttribute('data-reference-section')) {
					reference.push({
						"snaktype": "value",
						"property": "P958",
						"datavalue": {
							"value": propPicker.composer.getAttribute('data-reference-section'),
							"type": "string"
						},
						"datatype": "string"
					});
				}

				const setClaim = {
					type: 'set_claim',
					subject: currentEntity,
					verb: propPicker.element.getAttribute('data-prop'),
					object: {},
					references: reference ? [reference] : null,
					fromTab: currentTab,
				};
				if (propPicker.element.getAttribute('data-datatype') === 'monolingualtext') {
					setClaim.object.language = propPicker.languagePicker.value;
					setClaim.object.text = propPicker.composer.value;
				}
				if (propPicker.element.getAttribute('data-datatype') === 'string') {
					setClaim.object = propPicker.composer.value;
				}

				jobs.push(setClaim);
			}

			if (itemTypes.includes(propPicker.element.getAttribute('data-datatype'))) {
				for (let selected of selecteds) {

					let selectedId = selected.getAttribute('data-entity');
					let selectedType = selectedId.startsWith('L') ? 'lexeme' : 'item'
					let selectedNummericId = parseInt(selectedId.replace(/\w/,''));

					let reference = [];
					if (selected.getAttribute('data-reference-url')) {
						const project = selected.getAttribute('data-reference-project')

						reference.push({
							"snaktype": "value",
							"property": project ? 'P4656' : 'P854',
							"datavalue": {
								"value": selected.getAttribute('data-reference-url'),
								"type": "string"
							},
							"datatype": "url"
						});

						if (project) {
							reference.push({
								"snaktype": "value",
								"property": 'P143',
								"datavalue": {
									"type": "wikibase-entityid",
									"value": {
										"entity-type": "item",
										"numeric-id": parseInt(project.replace('Q', '')),
										"id": project,
									},
								},
								"datatype": "wikibase-entityid",
							});
						}
					}

					if (selected.getAttribute('data-reference-title')) {
						reference.push({
							"snaktype": "value",
							"property": "P1476",
							"datavalue": {
								"value": {
									text: selected.getAttribute('data-reference-title'),
									language: selected.getAttribute('data-reference-language'),
								},
								"type": "monolingualtext"
							},
							"datatype": "string"
						});
					}

					if (selected.getAttribute('data-reference-section')) {
						reference.push({
							"snaktype": "value",
							"property": "P958",
							"datavalue": {
								"value": selected.getAttribute('data-reference-section'),
								"type": "string"
							},
							"datatype": "string"
						});
					}
					
					jobs.push({
						type: 'set_claim',
						subject: !flipped ? currentEntity : selectedId,
						verb: propPicker.element.getAttribute('data-prop'),
						object: {
							'entity-type': !flipped ? selectedType : currentEntityType,
							'numeric-id': !flipped ? selectedNummericId : currentEntityNummericId,
							'id': !flipped ? selectedId : currentEntity,
						},
						fromTab: currentTab,
						references: reference ? [reference] : null,
					});

				}
			}

			const formData = new FormData(statements)
			for (let pair of formData.entries()) {
				if (pair[1] != '') {
				 	let job = JSON.parse(pair[1]);
				 	if (!job.subject) {
				 		job.subject = currentEntity;
				 		job.fromTab = currentTab;
				 	}
				 	jobs.push(job);
				}
			}

			Promise.all([
				browser.runtime.sendMessage({
					type: 'send_to_wikidata',
					data: jobs,
				}),
                unlockAndWait(currentTab),
				browser.runtime.sendMessage({
					type: 'clear_pagelinks',
				})
			]).then((values) => {
                if (flipped) {
                    window.location = 'entity.html?' + currentEntity
                }
            });
		}
	});

})();

window.addEventListener('unload', (event) => {
	browser.runtime.sendMessage({
		type: 'unlock_sidebar',
	});
	browser.runtime.sendMessage({
		type: 'clear_pagelinks',
	});
});
