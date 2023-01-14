import { placeholder } from '../placeholder/placeholder.tpl.js';
import { requreStylesheet } from '../require-styleheet.js'

const glossary = (senses) => { 
	let list = document.createElement('dl');
	list.classList.add('glossary');

	requreStylesheet("components/glossary/glossary.css");


	for (let id in senses) {
		let symbolItem = document.createElement('dt');
		symbolItem.classList.add('glossary__symbol');
		let glossItem = document.createElement('dd');
		if (senses[id].symbol) {
			symbolItem.appendChild(senses[id].symbol.cloneNode(true));
		}

		if (senses[id].field) {
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

		if (senses[id]?.lexemes) {
			if (senses[id].label) {
				const label = document.createElement('span')
				label.classList.add('glossary__see-also-label')
				label.appendChild(senses[id].label);
				label.appendChild(document.createTextNode(': '))
				glossItem.appendChild(label);
			}
			const value = document.createElement('span')
			value.classList.add('glossary__see-also')
			glossItem.appendChild(value);
			for (let lexeme of senses[id].lexemes) {
				if (value.childNodes.length > 0) {
					value.appendChild(document.createTextNode(', '))
				}
				value.appendChild(lexeme);
			}
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
		if (senses[id]?.children && JSON.stringify(senses[id].children) != '{}') {
			glossItem.appendChild(glossary(senses[id].children));
		}
	}
	return list;
}

export { glossary }
