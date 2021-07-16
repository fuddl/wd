import { collectPageLinks, clearPageLinks, getClosestID, getOldid } from './content__collect-page-links.js';
import { resolvers } from './resolver.js';
import { getElementLanguage } from './content__collect-strings.js';
import { makeLanguageValid } from '../get-valid-string-languages.js';
import { findTitles } from './pagedata__title.js';
import { findDescriptions } from './pagedata__description.js';
import { findLinkedData, enrichLinkedData } from './content__collect-ld.js';
import { findMetaData, enrichMetaData } from './content__collect-meta.js';

async function findApplicables(location, openInSidebar = true) {
	let applicables = [];
	let linkedData = findLinkedData(document)
	let metaData = findMetaData(document)

	let foundMatch = false;
	for (let id of Object.keys(resolvers)) {
		let isApplicable = await resolvers[id].applicable(location);
		if (isApplicable) {
			let entityId = await resolvers[id].getEntityId(location);

			if (entityId && !foundMatch) {
				foundMatch = true;
				browser.runtime.sendMessage({
					type: 'match_event',
					wdEntityId: entityId,
					openInSidebar: openInSidebar,
					url: location.href,
					cache: !resolvers[id].noCache,
				});
				return entityId;
			}
			applicables.push(isApplicable);
		}
	}
	if (applicables.length > 0 && !foundMatch && openInSidebar) {
		const url = location.toString();
		browser.runtime.sendMessage({
			type: 'match_proposal',
			proposals: {
				ids: applicables,
				titles: findTitles(),
				desc: findDescriptions(),
				ld: await enrichLinkedData(linkedData, applicables[0], window.location.href),
				meta: await enrichMetaData(metaData, applicables[0], window.location.href),
				source: {
					url: url,
					title: document.querySelector('title').innerText,
					lang: await makeLanguageValid(document.querySelector('html').lang),
				}
			},
		});
	}
	return false;
};

function main() {
	findApplicables(location);

	browser.runtime.onMessage.addListener(async function(msg, sender, sendResponse) {
		if (msg.action == 'find_applicables') {
			findApplicables(location);
		} else if (msg.action === 'collect_pagelinks') {
			return await collectPageLinks(msg.subject);
		} else if (msg.action === 'clear_pagelinks') {
			clearPageLinks();
		}
	});

	window.onpopstate = function(event) {
		findApplicables(window.location);
	};

	window.addEventListener('hashchange', function() {
		findApplicables(window.location);
	}, false);

	document.addEventListener('focus', function() {
		findApplicables(window.location);
	})

	let head = document.querySelector('head');

	let title = head.querySelector('title').innerText;
	let titleObserver = new MutationObserver(function() {
		let newTitle = head.querySelector('title').innerText;
		if (newTitle != title) {
			findApplicables(window.location);
			title = newTitle;
		}
	});

	titleObserver.observe(head, { characterData: true });

	document.addEventListener('selectionchange', (e) => {
		(async () => {
			let text = document.getSelection().toString().trim();
			if (text) {

				let sectionData = getClosestID(document.getSelection().focusNode);

				let hash = sectionData.hash ? '#' + sectionData.hash : ''; 

				let oldId = getOldid();

				let search = oldId ? '?oldid=' + oldId : location.search;

				let pageTitle = document.title;
				let pageLanguage = document.querySelector('html').lang;

				let url = location.protocol + '//' + location.host + location.pathname + search + hash;

				let message = {
					type: 'use_in_statement',
					dataype: 'string',
					value: text,
					valueLang: await makeLanguageValid(getElementLanguage(document.getSelection())),
					reference: {
						url: url,
						section: sectionData.section ? sectionData.section.trim().replace("\n", '␤') : null,
						title: pageTitle ? pageTitle.trim() : null,
						language: pageLanguage ? await makeLanguageValid(pageLanguage) : 'und',
					}
				}

				browser.runtime.sendMessage(message);
			}
		})()
	});
}

export { main }
