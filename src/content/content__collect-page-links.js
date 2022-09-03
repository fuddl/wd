import {displayMetadata} from './content__display-metadata.js'
import {findFirstMatchingResolver} from '../resolver'
import {updateStatus} from '../update-status'
import { getLangQid, makeLanguageValid} from '../get-valid-string-languages.js';
import browser from 'webextension-polyfill'

const styleSheet = `
	.entity-selector {
		-moz-appearance: button;
		background-color: #6F6F6F;
		border-radius: 1em;
		border: 1px solid;
		color: white;
		cursor: pointer;
		font-family: sans-serif;
		font-size: .75em;
		line-height: 1.2;
		margin: 0 .5em .5em 0; 
		padding: .25em 1em;
		text-decoration: none;
		transition: background .5s;
		user-select: none;
		white-space: nowrap;
	}

	.entity-selector--selectable {
		background-color: #339966;
	}

	.entity-selector--unconnected {
		background-color: #6F6F6F;
	}

	.entity-selector--selected {
		background-color: #006699;
	}


	.entity-selector--queued {
		min-width: 3em;
		min-height: 1em;
		display: inline-block;
		background-image: linear-gradient( 135deg, 
			#339966 0%,
			#339966 25%,
			#006699 25%,
			#006699 50%,
			#339966 50%,
			#339966 75%,
			#006699 75%,
			#006699 100%
		) !important;
		background-size: 2em 2em;
		animation: working 3s linear infinite;
	}

	@keyframes working {
		from {
			background-position: 0 0;
		}
		to {
			background-position: 200% 0;
		}
	}
`

function getClosestID(element) {
	let subject = element;
	let referenceHeadlineQuery = 'h1[id],h1 [id],h2[id],h2 [id],h3[id],h3 [id],h4[id],h4 [id],h5[id],h5 [id],h6[id],h6 [id]';
	let headlineQuery = 'h1, h2, h3, h4, h5, h6';

	while (element.parentElement != null && !element.parentElement.querySelector(referenceHeadlineQuery)) {
		element = element.parentNode;
	}
	while (element.previousElementSibling && !element.matches('h1, h2, h3, h4, h5, h6')) {
		element = element.previousElementSibling;
	}

	if (element.matches(headlineQuery) && (element.getAttribute('id') || element.querySelector('[id]'))) {
			let thisId = element.getAttribute('id');
			if (thisId === null) {
			thisId = element.querySelector('[id]').getAttribute('id');
			}

			let cleanElement = element.cloneNode(true);

			// removing the edit section link from mediawiki articles
			let editSectionLink = cleanElement.querySelector('.mw-editsection');
			if (editSectionLink) {
				editSectionLink.remove();
			}

		return {
			section: cleanElement.innerText,
			hash: thisId,
		};
	}

	if (subject.closest) {
			let IDwrapper = subject.closest('[id]');
			if (IDwrapper) {
					return {
						section: null,
						hash: IDwrapper.getAttribute('id'),
					};
			}
	}

	return {
			section: null,
			hash: null
	};
}

function getOldid() {
	for (let script of document.querySelectorAll('script')) {
		if(script.innerText.match(/wgCurRevisionId"\s*:\s*(\d+)/)) {
			return script.innerText.match(/wgCurRevisionId"\s*:\s*(\d+)/)[1];
		}
	}
	return null;
}

let selectedEntities = [];
let uniqueLinks = [];

function highlightSelected(id, add = true) {
	for (let uLink of uniqueLinks) {
		if (uLink.entityId === id) {
			for (let selector of uLink.selectors) {
				if (add) {
					selector.classList.add('entity-selector--selected');
				} else {
					selector.classList.remove('entity-selector--selected');
				}
			}
		}
	}
}

function toggleSelectedEntities(id) {
	if(selectedEntities.includes(id)) {
		selectedEntities.splice(selectedEntities.indexOf(id), 1);
		highlightSelected(id, false);
	} else {
		selectedEntities.push(id)
		highlightSelected(id);
	}
}

async function collectPageLinks(subject) {
	updateStatus([
		'Searching ',
		{urlLink: window.location.href},
		' for links…',
	]);
	displayMetadata();

	for (let link of document.links) {

		if (link.href.startsWith('javascript:')) {
			continue;
		}

		if (!uniqueLinks.some((e) => { return e.location === link.href })) {
			uniqueLinks.push({
				location: link.href,
				links: [link],
			});
		} else {
			uniqueLinks
				.find(e => e.location === link.href)
				.links.push(link)
		}
	}

	// sort linksets on whether if they are visible or not
	// visible links should go first
	uniqueLinks.sort((a, b) => {
		let aVisible = false;
		let bVisible = false;
		for (let link of a.links) {
			const aRect = link.getBoundingClientRect();
			if (aRect.top >= 0) {
				aVisible = true;
			}
		}
		for (let link of b.links) {
			const bRect = link.getBoundingClientRect();
			if (bRect.top >= 0 && bRect.bottom <= window.innerHeight) {
				bVisible = true;
			}
		}
		if (aVisible && !bVisible) {
			return -1;
		}
		if (!aVisible && bVisible) {
			return 1;
		}
	 	return 0;
	});

    updateStatus([
		`Checking ${uniqueLinks.length} unique links in `,
		{urlLink: window.location.href},
	]);

	// mark	links that are not applicable to wikidata as not-applicable
	for (let key in uniqueLinks) {
		uniqueLinks[key].resolver = await findFirstMatchingResolver(uniqueLinks[key].links[0])
		uniqueLinks[key].setup = async function() {
			this.selectors = [];
			for (let link of this.links) {
				let wrapper = document.createElement('wd-selector');
				let shadow = wrapper.attachShadow({ mode: 'closed' });
				let selector = document.createElement('a')
				shadow.appendChild(selector)
				let style = document.createElement('style')
				shadow.appendChild(style)
				style.innerText = styleSheet
				selector.classList.add('entity-selector', 'entity-selector--queued');
				link.parentNode.insertBefore(wrapper, link.nextSibling);
				this.selectors.push(selector);
			}
		}
		uniqueLinks[key].init = async function() {
			this.entityId = await this.resolver.getEntityId(this.links[0]);

	 		if (this.entityId) {
	 			if (this.entityId === subject) {
	 				 for (let selector of this.selectors) {
	 					selector.remove();
	 				}
	 			}
				let existing = uniqueLinks.findIndex((item) => item.entityId === this.entityId)
				let selectors = null;
				if (existing != key) {
					uniqueLinks[existing].selectors = [
						...uniqueLinks[existing].selectors,
						...this.selectors
					 ];
					uniqueLinks[key] = [];

					Object.assign(uniqueLinks[existing], uniqueLinks[key])
				} else {
					await browser.runtime.sendMessage({
	                    type: 'match_event',
	                    wdEntityId: this.entityId,
	                    openInSidebar: false,
	                    url: this.links[0].href,
	                    cache: !this.resolver.noCache,
	                });

					await browser.runtime.sendMessage({
	                    type: 'add_url_cache',
	                    url: this.links[0].href,
	                    id: this.entityId,
	                });
				}
			}

			for (let selector of this.selectors) {
				let statement
				if (this.entityId) {
					selector.setAttribute('href', 'https://www.wikidata.org/wiki/' + this.entityId);
					selector.innerText = this.entityId;
					if (selectedEntities.includes(this.entityId)) {
						selector.classList.add('entity-selector--selected');
					}
				}

				if (!this.entityId) {
					statement = await this.resolver.applicable(this.links[0])
					selector.innerText = `${statement[0].prop}: `;
					const code = document.createElement('code')
					code.innerText = statement[0].value
					selector.appendChild(code)
					selector.classList.add('entity-selector--unconnected')
				}
				
				selector.classList.remove('entity-selector--queued');
				selector.classList.add('entity-selector--selectable');
				selector.addEventListener('click', async (e) => {
					if (this.entityId) {
						toggleSelectedEntities(this.entityId);
					}
					e.preventDefault();

					let sectionData = getClosestID(e.target);

					let hash = sectionData.hash ? '#' + sectionData.hash : '';

					let oldId = getOldid();

					let search = oldId ? '?oldid=' + oldId : location.search;

					let pageTitle = document.title;
					let pageLanguage = document.querySelector('html').lang;
					
					let message = {
						type: this.entityId ? 'use_in_statement' : 'use_as_statement',
						dataype: 'wikibase-item',
						verb: statement?.[0].prop ?? null,
						object: statement?.[0].value ?? null,
						wdEntityId: this.entityId ?? null,
						reference: {
							url: location.protocol + '//' + location.host + location.pathname + search + hash,
							section: sectionData.section ? sectionData.section.trim().replace("\n", '␤') : null,
							title: pageTitle ? pageTitle.trim() : null,
							language: pageLanguage ? await makeLanguageValid(pageLanguage) : 'und',
						}
					};

					browser.runtime.sendMessage(message);
				});
			}

		}

	}

	const linksWithMatches = uniqueLinks.filter(it => it.resolver)

    updateStatus([
        `There are ${linksWithMatches.length} links in `,
        {urlLink: window.location.href},
        ' which could be associated to wikidata items. Checking now.',
    ])

    linksWithMatches.forEach(it => it.setup().then(() => it.init()).catch(console.error))
}


function clearPageLinks() {
	for (let selector of document.querySelectorAll('.entity-selector')) {
		selector.parentNode.removeChild(selector);
	}
}

export { collectPageLinks, clearPageLinks, getClosestID, getOldid }
