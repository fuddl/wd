import { requreStylesheet } from '../require-styleheet.js'

const symbol = (text, id) => {
	let node = document.createElement('span');
	node.innerText = text;
	node.classList.add('symbol');
	if (id) {
		node.setAttribute('data-lexeme', id);
	}

	requreStylesheet("components/symbol/symbol.css");

	return node;
}

export { symbol };