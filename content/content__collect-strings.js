function getElementLanguage(selection) {
	element = selection.focusNode;
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
	// if all else fails, let's assume it is something the user can read
	return navigator.language.split("-")[0];
}
