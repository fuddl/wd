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

let babelLangs = []

async function userLanguagesWithFallbacks() {
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

	if (babelLangs.length == 0) {
		try {
			const userResponse = await fetch('https://www.wikidata.org/w/api.php?action=query&meta=userinfo&format=json');
			let userJson = JSON.parse(await userResponse.text());
			if (userJson?.query?.userinfo?.name) {

				const response = await fetch(`https://www.wikidata.org/w/api.php?action=query&meta=babel&babuser=${userJson.query.userinfo.name}&format=json`);
				let json = JSON.parse(await response.text());
				if (json?.query?.babel) {
					for (let lang of Object.keys(json.query.babel)) {
						babelLangs.push(lang)
					}
				}
			}
		} catch(error) {
			console.error('Failed fetching babel user data')
		}
	}
	return [... new Set([...langs, ...babelLangs, ...langsFallback])];
}

async function wikidataGetEntity(id, usecache = true, returnSingle = false) {

	let config = namespaceGetInstance(id);
	let wbk = WBK(config);

	let url = wbk.getEntities({
		ids: id,
		languages: await userLanguagesWithFallbacks(),
	});

	try {
		let response = await fetch(url, {
			cache: usecache ? 'default' : 'reload',
		});
		response = await response.json();
		let cached = await addToLabelCache(id, response.entities);
		return returnSingle ? response.entities[id] : response.entities;
	} catch(error) {
		throw ['Fetch Error :-S', error];
	}
}

async function commonsGetEntity(filename, usecache = true) {
	try {
		let response = await fetch(`https://commons.wikimedia.org/w/api.php?action=wbgetentities&sites=commonswiki&titles=File:${filename}&format=json`, {
			cache: usecache ? 'default' : 'reload',
		});
		response = await response.json();
		return response.entities[Object.keys(response.entities)[0]];
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

export { wikidataGetEntity, commonsGetEntity, userLanguagesWithFallbacks };
