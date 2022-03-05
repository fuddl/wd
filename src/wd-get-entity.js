import browser from 'webextension-polyfill'

import wikiBaseConfig from './wikibase.config.yml';
import { getValueByLang } from './sidebar/get-value-by-lang.js';
import WBK from 'wikibase-sdk';

function namespaceGetInstance(id) {
	let ns = id.charAt(0);
	for (let name in wikiBaseConfig) {
		if (wikiBaseConfig[name].namespaces.includes(ns)) {
			return wikiBaseConfig[name].config;
		}
	}
}

function userLanguagesWithFallbacks() {
	let langs = navigator.languages;
	let langsFallback = [];
	for (let lang of langs) {
		if (lang.includes('-')) {
			let parentLanguage = lang.split("-")[0];
			if (!langs.includes(parentLanguage)) {
				langsFallback.push(parentLanguage);
			}
		}
	}
	return [...langs, ...langsFallback];
}

async function wikidataGetEntity(id, usecache = true, returnSingle = false) {

	let config = namespaceGetInstance(id);
	let wbk = WBK(config);

	let url = wbk.getEntities({
		ids: id,
		languages: userLanguagesWithFallbacks(),
	});

	try {
		let response = await fetch(url, {
			cache: usecache ? 'default' : 'reload',
		});
		response = await response.json();
		await addToLabelCache(id, response.entities);
		return returnSingle ? response.entities[id] : response.entities;
	} catch(error) {
		throw ['Fetch Error :-S', error];
	}
}

async function addToLabelCache(id, entity) {
	const label = getValueByLang(entity[id], 'labels', false);
	const description = getValueByLang(entity[id], 'descriptions', false);

	if (label || description) {
		const cache = await browser.storage.local.get();
		if (label) {
			if (!('labels' in cache)) {
				cache.labels = {};
			}
			cache.labels[id] = label;
		}
		if (description) {
			if (!('descriptions' in cache)) {
				cache.descriptions = {};
			}
			cache.descriptions[id] = description;
		}
		browser.storage.local.set(cache);
		return true;
	} else {
		return false;
	}
}

export { wikidataGetEntity };
