function AddLemmaAffix(inputLemma, lexeme) {
	let lemma = document.createTextNode(inputLemma);
	let prefix = '';
	let suffix = '';
	switch (lexeme.lang) {
		case 'Q188': // german
			if (lexeme.category === 'Q1084') { // noun
				switch (lexeme.gender) {
					case 'Q499327':
						suffix = ', der';
						break;
					case 'Q1775415':
						suffix = ', die';
						break;
					case 'Q1775461':
						suffix = ', das';
						break;

				}
			}
			break;
		case 'Q1860': // english
			if (lexeme.category === 'Q24905') { // noun
				prefix = 'to ';
			}
			break;
	}
	let output = document.createDocumentFragment();
	output.appendChild(lemma);
	if (suffix) {
		let suffixElement = document.createElement('small')
		suffixElement.innerText = suffix;
		output.appendChild(suffixElement);
	}
	if (prefix) {
		let prefixElement = document.createElement('small')
		prefixElement.innerText = prefix;
		output.insertBefore(prefixElement, output.firstChild);
	}
	return output;
}

export { AddLemmaAffix };