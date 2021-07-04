import { wikidataGetEntity } from '../wd-get-entity.js';
import { constraintsToStatements } from './constraintsToStatements.js';
import { getFormatterUrls } from './get-formatter-urls.js';
import { getCurrentTab } from '../get-current-tab.js';
import { findLinkedData, enrichLinkedData } from '../content/content__collect-ld.js';
import { ldToStatements } from './ldToStatements.js';
import { getElementLanguage } from '../content/content__collect-strings.js';
import { makeLanguageValid } from '../get-valid-string-languages.js';
import { sparqlQuery } from "../sqarql-query.js"

let content = document.getElementById('content');
let propform = document.createElement('form');
content.appendChild(propform);

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

if (window.location.search) {
	let currentEntity = window.location.search.match(/^\?(\w\d+)/, '')[1];
	if (currentEntity.match(/[QMPL]\d+/)) {
		( async()=> {

			const entities = await wikidataGetEntity(currentEntity, false);
			for (let id of Object.keys(entities)) {
				let entity = entities[id];
				let classes = await getAllClasses(id);
				for(let claim in entity.claims) {
					if (entity.claims[claim][0].mainsnak?.datatype === 'external-id' && entity?.claims[claim][0].mainsnak?.datavalue?.value) {
						let urls = await getFormatterUrls(claim, entity.claims[claim][0].mainsnak.datavalue.value);
						for (let url of urls) {
							try {
								let result = await fetch(url);
								let sourceUrl = result.url;
								let text = await result.text();
								if (text) {
									const doc = parser.parseFromString(text, "text/html");
									let canonical = doc.querySelector('link[rel="canonical"][href]');
									if (canonical) {
										sourceUrl = canonical.getAttribute('href');
									}
									if (!visitedUrls.includes(sourceUrl)) {
										visitedUrls.push(sourceUrl);
										const ld = findLinkedData(doc);
										if (ld) {
											let enriched = await enrichLinkedData(ld, claim, doc);
											let title = doc.querySelector('title');
											let root = doc.querySelector('html');
											let rootLang = root.hasAttribute('lang') ? root.getAttribute('lang') : '';
											await ldToStatements(enriched, propform, {
												url: sourceUrl,
												title: title ? title.innerText.trim() : null,
												lang: await makeLanguageValid(rootLang),
											});
										}
									}
								}
							} catch (error) {
							  console.error(`Something went wrong fetching ${url}`);
							}
						}
					}
					const property = await wikidataGetEntity(claim, false);
					if (property[claim].claims?.P2302) {
						constraintsToStatements(claim, property[claim].claims.P2302, propform, classes);
					}
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
			 	}
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
	});
}