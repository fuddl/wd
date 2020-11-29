document.addEventListener('selectionchange', (e) => {
	let text = document.getSelection().toString();
	if (text) {

		let sectionData = getClosestID(document.getSelection().focusNode.parentElement);


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