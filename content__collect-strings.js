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
