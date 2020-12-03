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
  return 'zxx';
}

document.addEventListener('selectionchange', (e) => {
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
			valueLang: getElementLanguage(document.getSelection().focusNode),
			reference: {
				url: url,
				section: sectionData.section ? sectionData.section.trim().replace("\n", '␤') : null,
				title: pageTitle ? pageTitle.trim() : null,
				language: pageLanguage ? pageLanguage : 'zxx',
			}
		}

		browser.runtime.sendMessage(message);
	}
});