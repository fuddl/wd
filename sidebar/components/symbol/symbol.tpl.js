const symbol = (text, id) => {
	let node = document.createElement('span');
	node.innerText = text;
	node.classList.add('symbol');
	node.setAttribute('data-lexeme', id);

	let style = document.createElement('link');
	style.setAttribute('rel',	"stylesheet");
	style.setAttribute('href', "components/symbol/symbol.css");

	node.appendChild(style);

	return node;
}

export { symbol };