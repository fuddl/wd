function getElementLanguage(element) {
	while (typeof element.closest === 'undefined') {
		element = element.parentElement;
	}
	let closest = element.closest('[lang]');
	if (closest) {
		let lang = closest.lang;
		if (lang) {
			return lang;
		}
	}
	return guessLanguage(selection.toString());
}

function guessLanguage(string) {
	// if it contains kana, let's assume its japanese
	if (string.match(/[ァアィイゥウェエォオカガキギクグケゲコゴサザシジスズセゼソゾタダチヂッツヅテデトドナニヌネノハバパヒビピフブプヘベペホボポマミムメモャヤュユョヨラリルレロヮワヰヱヲンヴヵヶヷヸヹヺ・ーヽヾヿぁあぃいぅうぇえぉおかがきぎくぐけげこごさざしじすずせぜそぞただちぢっつづてでとどなにぬねのはばぱひびぴふぶぷへべぺほぼぽまみむめもゃやゅゆょよらりるれろゎわゐゑをんゔゕゖ゛゜ゝゞゟ]/)) {
		return 'ja';
	}
	// if it contains a sharp s, let's assume its german
	if (string.match(/[ßẞ]/)) {
		return 'de';
	}
	// if it contains upside down punctuation, it's probably spanish
	if (string.match(/[¿¡]/)) {
		return 'es';
	}
	// if it contains a cyrillic Yo it might be russian
	if (string.match(/[Ёё]/)) {
		return 'ru';
	}
	// if all else fails, let's assume it is something the user can read
	return navigator.language.split("-")[0];
}

export { getElementLanguage }