import {displayMetadata} from './content__display-metadata.js'
import {resolvers} from './resolver.js'
import {updateStatus} from "../update-status.js"
import browser from 'webextension-polyfill'

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

			// removing the edit section link from mediawiki articles
			let editSectionLink = element.querySelector('.mw-editsection');
			if (editSectionLink) {
				editSectionLink.remove();
			}

		return {
			section: element.innerText,
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
	let foundEntities = [];

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
		let applicableTo = null;
		for (let id of Object.keys(resolvers)) {
			if (!applicableTo) {
				let resolverApplicable = await resolvers[id].applicable(uniqueLinks[key].links[0]);
				if (resolverApplicable) {
					applicableTo = id;
				}
			}
		}
		uniqueLinks[key].applicable = applicableTo;
		uniqueLinks[key].setup = async function() {
			this.selectors = [];
			for (let link of this.links) {
				let selector = document.createElement('a');
				selector.classList.add('entity-selector', 'entity-selector--queued');
				link.parentNode.insertBefore(selector, link.nextSibling);
				this.selectors.push(selector);
			}
		}
		uniqueLinks[key].init = async function() {
			this.resolver = resolvers[this.applicable];
			this.selected = false;
			this.entityId = await this.resolver.getEntityId(this.links[0]);
	 		if (this.entityId && this.entityId !== subject) {

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

				for (let selector of this.selectors) {

					selector.setAttribute('href', 'https://www.wikidata.org/wiki/' + this.entityId);
					selector.innerText = this.entityId;
					selector.classList.remove('entity-selector--queued');
					selector.classList.add('entity-selector--selectable');
					if (selectedEntities.includes(this.entityId)) {
						selector.classList.add('entity-selector--selected');
					}
					selector.addEventListener('click', (e) => {
						toggleSelectedEntities(this.entityId);
						e.preventDefault();

						let sectionData = getClosestID(e.target);

						let hash = sectionData.hash ? '#' + sectionData.hash : '';

						let oldId = getOldid();

						let search = oldId ? '?oldid=' + oldId : location.search;

						let pageTitle = document.title;
						let pageLanguage = document.querySelector('html').lang;

						let message = {
							type: 'use_in_statement',
							dataype: 'wikibase-item',
							wdEntityId: this.entityId,
							reference: {
								url: location.protocol + '//' + location.host + location.pathname + search + hash,
								section: sectionData.section ? sectionData.section.trim().replace("\n", '␤') : null,
								title: pageTitle ? pageTitle.trim() : null,
								language: pageLanguage ? pageLanguage : 'und',
							}
						};

						browser.runtime.sendMessage(message);
					});
				}

			// if there is no qid clean up the selectors
	 		} else {
	 			for (let selector of this.selectors) {
	 				selector.remove();
	 			}
	 		}
		}

	}


    let linkNumber = 0
    for (let key in uniqueLinks) {
        linkNumber++
        if (uniqueLinks[key].applicable) {
            await uniqueLinks[key].setup()
        }
    }

    updateStatus([
        `There are ${linkNumber} links in `,
        {urlLink: window.location.href},
        ' which could be associated to wikidata items. Checking now.',
    ])

    for (let key in uniqueLinks) {
        if (uniqueLinks[key].applicable) {
            await uniqueLinks[key].init()
        }
    }
}


function clearPageLinks() {
	for (let selector of document.querySelectorAll('.entity-selector')) {
		selector.parentNode.removeChild(selector);
	}
}

export { collectPageLinks, clearPageLinks, getClosestID, getOldid }
