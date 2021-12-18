import { placeholder } from '../placeholder/placeholder.tpl.js';

const rosetta = (translations, mainLanguage) => { 
	let div = document.createElement('div');
	div.classList.add('rosetta');

	const mainOnly = Object.keys(translations).length === 1 && translations.hasOwnProperty(mainLanguage);

	for (let language in translations) {
		let dl = document.createElement(mainOnly ? 'div' : 'dl');
		dl.classList.add('rosetta__group');
		div.appendChild(dl);
		if (!mainOnly) {
			let dt = document.createElement('dt');
			dt.appendChild(placeholder({entity: language }));
			dt.classList.add('rosetta__lang');
			dl.appendChild(dt);
		}
		for (let sense in translations[language]) {
			let d = document.createElement(mainOnly ? 'div' : 'dd');
			d.classList.add('rosetta__words');
			if (translations[language][sense].symbol) {
				let symbolWrapper = document.createElement('span');
				symbolWrapper.appendChild(translations[language][sense].symbol);
				d.appendChild(symbolWrapper);
			}
			let s = document.createElement('span');
			d.appendChild(s);
			let first = true;
			for (let tsense of translations[language][sense].senses) {
				if (!first) {
					s.appendChild(document.createTextNode(', '));
				} else {
					s.appendChild(document.createTextNode(' '));
				}
				first = false;
				s.appendChild(placeholder({
					entity: tsense,
					displayGloss: false,
				}));
			}
			dl.appendChild(d);
		}
	}

	let style = document.createElement('link');
	style.setAttribute('rel',	"stylesheet");
	style.setAttribute('href', "components/rosetta/rosetta.css");

	div.appendChild(style);
	return div;
}

export { rosetta };
