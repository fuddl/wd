import {clearPageLinks, collectPageLinks, getClosestID, getOldid} from './content__collect-page-links.js'
import {getMatchSuggestions, resolve} from '../resolver'
import {getElementLanguage} from './content__collect-strings.js'
import {makeLanguageValid} from '../get-valid-string-languages.js'
import {findTitles} from './pagedata__title.js'
import {findDescriptions} from './pagedata__description.js'
import {enrichLinkedData, findLinkedData} from './content__collect-ld.js'
import {enrichMetaData, findMetaData} from './content__collect-meta.js'
import {setupSidebar} from "./sidebar"

async function initializeBrowser() {
  if (typeof browser === 'undefined') {
    const something = await import('webextension-polyfill');
    window.browser = something;
  }
}

async function findDirectMatch(location) {
	const resolution = await resolve(location)
	if (!resolution) return null

	await browser.runtime.sendMessage({
		type: 'match_event',
		wdEntityId: resolution.entityId,
		openInSidebar: true,
		url: location.href,
		cache: !resolution.doNotCache,
	})

	return resolution.entityId
}

async function detectPotentialMatches(location) {
	let matchSuggestions = await getMatchSuggestions(location)
	if (matchSuggestions.length === 0) return

	let linkedData = findLinkedData(document)
	let metaData = findMetaData(document)
	const lang = await makeLanguageValid(document.querySelector('html').lang)

	await browser.runtime.sendMessage({
		type: 'match_proposal',
		proposals: {
			ids: matchSuggestions,
			titles: findTitles(),
			desc: findDescriptions(),
			ld: await enrichLinkedData(linkedData, matchSuggestions[0], window.location.href),
			meta: await enrichMetaData(metaData, lang, window.location.href),
			source: {
				url: location.toString(),
				title: document?.title,
				lang,
			},
		},
	})
}

async function findApplicables(location) {
	if (await findDirectMatch(location)) return

	await detectPotentialMatches(location)
}

async function main() {

	await initializeBrowser()

	await setupSidebar()

	await findApplicables(location)

	browser.runtime.onMessage.addListener(async msg => {
		if (msg.action === 'find_applicables') {
			return findApplicables(location)
		} else if (msg.action === 'collect_pagelinks') {
			return collectPageLinks(msg.subject)		
		} else if (msg.action === 'highlight_pagelinks') {
			return collectPageLinks(msg.subject, true)
		} else if (msg.action === 'clear_pagelinks') {
			clearPageLinks()
		}
	})

	window.onpopstate = () => findApplicables(window.location)

	window.addEventListener('hashchange', function() {
		findApplicables(window.location);
	}, false);

    // todo likely redundant in the inline-sidebar case
	document.addEventListener('focus', function() {
		findApplicables(window.location);
	})

	let head = document.querySelector('head');

	let title = head.querySelector('title').innerText;
	let titleObserver = new MutationObserver(function() {
		let newTitle = head.querySelector('title').innerText;
		if (newTitle !== title) {
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

				await browser.runtime.sendMessage(message);
			}
		})()
	});
}

export { main }
