import { placeholder } from '../placeholder/placeholder.tpl.js';

const glossary = (senses) => { 
	let list = document.createElement('dl');

	let style = document.createElement('link');
	style.setAttribute('rel',	"stylesheet");
	style.setAttribute('href', "components/glossary/glossary.css");

	list.classList.add('glossary');
	list.appendChild(style);

	for (let id in senses) {
		let symbolItem = document.createElement('dt');
		symbolItem.classList.add('glossary__symbol');
		let glossItem = document.createElement('dd');
		symbolItem.innerText = `[${senses[id].symbol.join('')}]`;

		if (senses[id].field) {
			console.debug(senses[id].field);
			let field = placeholder({
				entity: senses[id].field,
			});
			let em = document.createElement('em');
			em.appendChild(field);
			glossItem.appendChild(em);
			glossItem.appendChild(document.createTextNode(': '));
		}

		if (typeof senses[id].gloss === 'string') {
			glossItem.appendChild(document.createTextNode(senses[id].gloss));
		} else if (senses[id].gloss instanceof HTMLElement) {
			glossItem.appendChild(senses[id].gloss);
		}
		glossItem.classList.add('glossary__gloss');
		list.appendChild(symbolItem);
		list.appendChild(glossItem);

		if (senses[id].item) {
			let b = document.createElement('br');
			let arrow = document.createTextNode('→' + String.fromCharCode(160));
			let link = placeholder({
				entity: senses[id].item,
			});
			glossItem.appendChild(b);
			glossItem.appendChild(arrow);
			glossItem.appendChild(link);
		}
		if (senses[id].children) {
			glossItem.appendChild(glossary(senses[id].children));
		}
	}
	return list;
}

export { glossary }
