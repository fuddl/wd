async function getValidStringLanguages() {
	let response = await fetch('https://www.wikidata.org/w/api.php?action=query&meta=wbcontentlanguages&wbclcontext=monolingualtext&wbclprop=code%7Cautonym&format=json&origin=*', {cache: 'force-cache'})
	response = await response.json()
	response = response.query.wbcontentlanguages
	return response
}

async function makeLanguageValid(invalidLang) {

	// all valid languages seem to be lowercased
	invalidLang = invalidLang.toLowerCase()
	let validLangs = await getValidStringLanguages()
	// if it already is in the valid langs, just return it.
	if (Object.keys(validLangs).includes(invalidLang)) {
		return invalidLang
	} else {
		if (Object.keys(validLangs).includes(invalidLang.substr(0,2))) {
			return invalidLang.substr(0,2)
		}
	}
	return 'und'
}

export { getValidStringLanguages, makeLanguageValid }
