function getValueByLang(e, key, fallback) {
	const lang = navigator.language.substr(0,2);
	
	if (!fallback) {
		let fallback = '';
	}
	if (e.hasOwnProperty(key)) {
		if (e[key].hasOwnProperty(lang)) {
			if (e[key][lang].hasOwnProperty('value')) {
				return e[key][lang].value;
			} else {
				return fallback;
			}
		} else {
			return fallback;
		}
	} else {
		return fallback;
	}
}

function getAliasesByLang(e) {
	const lang = navigator.language.substr(0,2);
	if (e.hasOwnProperty('aliases')) {
		if (e['aliases'].hasOwnProperty(lang)) {
			return e['aliases'][lang].map((o) => { return o.value });
		}
	} else {
		return [];
	}
}
