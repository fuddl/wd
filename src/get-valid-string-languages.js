import { sparqlQuery } from "./sqarql-query.js";

async function getValidStringLanguages() {
	let response = await fetch('https://www.wikidata.org/w/api.php?action=query&meta=wbcontentlanguages&wbclcontext=monolingualtext&wbclprop=code%7Cautonym&format=json&origin=*', {cache: "force-cache"});
	response = await response.json();
	response = response.query.wbcontentlanguages;
	return response;
}

async function getValidTermLanguages() {
	let response = await fetch('https://www.wikidata.org/w/api.php?action=query&meta=wbcontentlanguages&wbclcontext=term&wbclprop=code&format=json&origin=*', {cache: "force-cache"});
	response = await response.json();
	response = response.query.wbcontentlanguages;
	return response;
}

async function makeLanguageValid(invalidLang, context = 'monolingualtext') {

	// all valid languages seem to be lowercased
	invalidLang = invalidLang.toLowerCase();
	let validLangs;
	if (context == 'monolingualtext') {
		validLangs = await getValidStringLanguages();
	} else {
		validLangs = await getValidTermLanguages();
	}
	// if it already is in the valid langs, just return it.
	if (Object.keys(validLangs).includes(invalidLang)) {
		return invalidLang;
	} else {
		if (Object.keys(validLangs).includes(invalidLang.substr(0,2))) {
			return invalidLang.substr(0,2);
		}
	}
	return 'und';
}

async function getLangQid(iso) {
	const query = `
		SELECT ?n WHERE {
		  ?q wdt:P218 "${iso}".
		  BIND(REPLACE(STR(?q), "http://www.wikidata.org/entity/Q", "") as ?n)
		}
	`;
	const response = await sparqlQuery(query, 0, true);
	if (response.length > 0 && response[0].n?.value) {
		return parseInt(response[0].n.value);
	} else {
		return false;
	}
}

async function getSuttonLangages() {
	const query = `
		SELECT ?code WHERE {
			?sign_language wdt:P31 wd:Q34228.
			?sign_language wdt:P282 wd:Q1497335.
			BIND(REPLACE(STR(?sign_language), "http://www.wikidata.org/entity/", "mis-x-") as ?fallbackCode).
			OPTIONAL {
				?sign_language wdt:P424 ?preferredCode.
			}
			BIND(COALESCE(?preferredCode, ?fallbackCode) as ?code)
		}

	`;
	const response = await sparqlQuery(query, 0, true);
	if (response.length > 0) {
		return response.map((value) => value.code.value);
	} else {
		return false;
	}
}

export { getValidStringLanguages, makeLanguageValid, getLangQid, getSuttonLangages }
