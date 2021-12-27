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
import { findMetaData, enrichMetaData } from '../content/content__collect-meta.js';
import { metaToStatements } from './metaToStatements.js';
import { wdGetOSMElements, OSMToSatements } from './osm.js';
import { URL_match_pattern } from "../content/resolver__url-match-pattern.js";
import { PrependNav } from './prepend-nav.js';

PrependNav();

async function checkRedirectForIds(url, propform, originalUrl, claims) {
	let comment = templates.smallBlock(
		templates.text(
			[
				document.createTextNode('Found behind redirect of '),
				templates.urlLink(originalUrl),
				document.createTextNode(' to '),
				templates.urlLink(url),
			]
		)
	);
	const location = {
		href: url
	};
	let isApplicable = await URL_match_pattern.applicable(location);
	if (isApplicable) {
		let entityId = await URL_match_pattern.getEntityId(location);
		if (!entityId) {
			let label = templates.placeholder({
				entity: isApplicable[0].prop,
			});

			if (claims.hasOwnProperty(isApplicable[0].prop)) {
				return false;
			}

			let check = document.createElement('input');
			check.setAttribute('type', 'checkbox');
			check.setAttribute('name', isApplicable[0].value);
			check.setAttribute('value', JSON.stringify({
				type: 'set_claim',
				verb: isApplicable[0].prop,
				object: isApplicable[0].value,
			}));

			// these need to be checked
			check.checked = false;
			let preview = templates.remark({
				sortKey: isApplicable[0].prop,
				check: check,
				prop: label,
				vals: [
					templates.text([
						templates.code(isApplicable[0].value),
						comment,
					]),
				],
			});
			propform.appendChild(preview);		
		}
	}
}

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
			
			updateStatusInternal([
				'Searching OpenStreetMap for relevant data…',
			]);
			let osmElements = await wdGetOSMElements(currentEntity);
			
			if (osmElements.length > 0) {
				for (let element of osmElements) {
					OSMToSatements(element, propform, {
						url: element.sourceUrl,
						title: element.title,
					});
				}
			}

			for (let id of Object.keys(entities)) {
				let entity = entities[id];
				let classes = await getAllClasses(id);
				for(let claim in entity.claims) {
					if (['url', 'external-id'].includes(entity.claims[claim][0].mainsnak?.datatype) && entity?.claims[claim][0].mainsnak?.datavalue?.value) {
						let urls = []; 
						switch (entity.claims[claim][0].mainsnak.datatype) {
							case 'external-id':
							  for (let key in entity.claims[claim]) {
							  	let moreUrls = await getFormatterUrls(claim, entity.claims[claim][key].mainsnak.datavalue.value);
									urls = [...urls, ...moreUrls];
							  }
							  break;
							case 'url':
								for (let key in entity.claims[claim]) {
									if(entity.claims[claim][key].mainsnak?.datavalue?.value) {
										urls.push(entity.claims[claim][key].mainsnak.datavalue.value);	
									}
								}
								break;
						}

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

								if (result.redirected) {
									await checkRedirectForIds(result.url, propform, url, entity.claims);
								}

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

										let title = doc.querySelector('title');
										let root = doc.querySelector('html');
										let rootLang = root.hasAttribute('lang') ? root.getAttribute('lang') : '';
										let validRootLang = await makeLanguageValid(rootLang);

										const meta = findMetaData(doc);
										if (meta) {
											updateStatusInternal([
												'Found metadata in ',
													{urlLink: url},
												'!',
											]);
											let enrichedMeta = await enrichMetaData(meta, rootLang, url);
											await metaToStatements(enrichedMeta, propform, {
												url: sourceUrl,
												title: title ? title.innerText.trim() : null,
												lang: validRootLang,
											});
										}


										const ld = findLinkedData(doc);
										if (ld) {
											updateStatusInternal([
												'Found structured data in ',
													{urlLink: url},
												'!',
											]);
											let enriched = await enrichLinkedData(ld, claim, url);
											await ldToStatements(enriched, propform, {
												url: sourceUrl,
												title: title ? title.innerText.trim() : null,
												lang: validRootLang,
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