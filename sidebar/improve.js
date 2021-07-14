import { wikidataGetEntity } from '../wd-get-entity.js';
import { constraintsToStatements } from './constraintsToStatements.js';
import { getFormatterUrls } from './get-formatter-urls.js';
import { getCurrentTab } from '../get-current-tab.js';
import { findLinkedData, enrichLinkedData } from '../content/content__collect-ld.js';
import { ldToStatements } from './ldToStatements.js';
import { getElementLanguage } from '../content/content__collect-strings.js';
import { makeLanguageValid } from '../get-valid-string-languages.js';
import { sparqlQuery } from "../sqarql-query.js"
import { templates } from "./components/templates.tpl.js"
import { updateStatusInternal } from "../update-status.js"
import { findMediaWikiData } from "./mw-data.js"

let content = document.getElementById('content');
let propform = document.createElement('form');

content.appendChild(propform);
let numberOfProposals = 0;
const observer = new MutationObserver((change) => {
	if (numberOfProposals < propform.children.length) {
		[...propform.children]
		  .sort((a,b) => a.getAttribute('data-sortkey') > b.getAttribute('data-sortkey') ? 1 : -1)
		  .forEach(node => propform.appendChild(node));
		 numberOfProposals = propform.children.length;
	}
});
observer.observe(propform, {childList: true});

const parser = new DOMParser();

let visitedUrls = [];

async function getAllClasses(instance) {
	const query = `
	SELECT ?c WHERE {
	  { wd:${instance} wdt:P31 ?class. }
	  UNION
	  { 
	    wd:${instance} wdt:P31 ?childClass.
	    ?childClass wdt:P279* ?class.
	  }
		BIND (replace(str(?class), 'http://www.wikidata.org/entity/', '') AS ?c)
	}
	`
	let classes = await sparqlQuery(query);
	let output = [];
	for(let cl of classes) {
		output.push(cl.c.value);
	}
	return output;
}

let bouncer = templates.bouncer();
let message = templates.intertitle({
	icon: {
		src: 'https://upload.wikimedia.org/wikipedia/commons/a/a5/OpenMoji-color_1F44C.svg',
		alt: '👌',
	},
	text: 'Could not find possible improvements. Add external identifers and try again.',
});

if (window.location.search) {
	let currentEntity = window.location.search.match(/^\?(\w\d+)/, '')[1];
	if (currentEntity.match(/[QMPL]\d+/)) {
		( async()=> {

			document.body.appendChild(bouncer);

			browser.runtime.sendMessage({
				type: 'lock_sidebar',
			});

			const entities = await wikidataGetEntity(currentEntity, false);
			for (let id of Object.keys(entities)) {
				let entity = entities[id];
				let classes = await getAllClasses(id);
				for(let claim in entity.claims) {
					if (entity.claims[claim][0].mainsnak?.datatype === 'external-id' && entity?.claims[claim][0].mainsnak?.datavalue?.value) {
						let urls = await getFormatterUrls(claim, entity.claims[claim][0].mainsnak.datavalue.value);
						for (let url of urls) {
							updateStatusInternal([
								'Searching ',
								{urlLink: url},
								' for metadata…',
							]);
							try {
								let result = await fetch(url);
								let sourceUrl = result.url;
								let text = await result.text();
								if (text) {
									const doc = parser.parseFromString(text, "text/html");
									let canonical = doc.querySelector('link[rel="canonical"][href]');
									if (canonical) {
										sourceUrl = canonical.getAttribute('href');
										updateStatusInternal([
											'Searching ',
											{urlLink: sourceUrl},
											' for metadata…',
										]);
									}

									if (!visitedUrls.includes(sourceUrl)) {
										visitedUrls.push(sourceUrl);
										const ld = findLinkedData(doc);
										if (ld) {
											updateStatusInternal([
												'Found metadata in ',
													{urlLink: url},
												'!',
											]);
											let enriched = await enrichLinkedData(ld, claim, url);
											let title = doc.querySelector('title');
											let root = doc.querySelector('html');
											let rootLang = root.hasAttribute('lang') ? root.getAttribute('lang') : '';
											await ldToStatements(enriched, propform, {
												url: sourceUrl,
												title: title ? title.innerText.trim() : null,
												lang: await makeLanguageValid(rootLang),
											});
										}
										const mwData = await findMediaWikiData(doc, propform, sourceUrl ?? url);

									}
								}
							} catch (error) {
							  console.error(`Something went wrong fetching ${url}`);
							}
						}
					}
					const property = await wikidataGetEntity(claim, false);
					if (property[claim].claims?.P2302) {
						updateStatusInternal([
							'Checking constraints for ',
							{placeholder: {entity: claim}},
						]);
						constraintsToStatements(claim, property[claim].claims.P2302, propform, classes);
					}
				}
				document.body.removeChild(bouncer);
				if (propform.children.length < 1) {
					document.body.innerText = '';
					document.body.appendChild(message);
					browser.runtime.sendMessage({
						type: 'unlock_sidebar',
					});
				}
			}
		})()
	}

	let form = document.createElement('div');
	form.classList.add('submit-actions');
	content.appendChild(form);

	let saveButton = document.createElement('button');
	form.appendChild(saveButton);
	saveButton.innerText = 'Send to Wikidata';
	
	saveButton.addEventListener('click', async function() {
		let currentTab = await getCurrentTab();
		let jobs = [];
		const formData = new FormData(propform)
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
			browser.runtime.sendMessage({
				type: 'unlock_sidebar',
			}),
		]).then((values) => {
			browser.runtime.sendMessage({
				type: 'wait',
				tid: currentTab,
			});
		});
	});
}