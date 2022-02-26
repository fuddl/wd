function getValueByLang(e, key, fallback) {
	const langs = navigator.languages.map(lang => lang.split('-')[0]).filter((e,i,a) => a.indexOf(e) == i)
	
	if (!fallback) {
		let fallback = ''
	}
	if (e.hasOwnProperty(key)) {
		let matches = langs.map(lang => e[key].hasOwnProperty(lang) && e[key][lang].hasOwnProperty('value') ? e[key][lang].value : null).filter(match => match !== null)
		if (matches.length >= 1) {
			return matches[0]
		} else {
			return fallback
		}
	} else {
		return fallback
	}
}

function getAliasesByLang(e) {
	const lang = navigator.language.split('-')[0]
	if (e.hasOwnProperty('aliases')) {
		if (e['aliases'].hasOwnProperty(lang)) {
			return e['aliases'][lang].map((o) => { return o.value })
		}
	} else {
		return []
	}
}

export { getValueByLang, getAliasesByLang }
