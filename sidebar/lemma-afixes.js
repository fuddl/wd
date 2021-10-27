function AddLemmaAffix(inputLemma, lexeme) {
	let lemma = document.createTextNode(inputLemma);
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
	}
	let ouput = document.createDocumentFragment();
	ouput.appendChild(lemma);
	if (suffix) {
		let suffixElement = document.createElement('small')
		suffixElement.innerText = suffix;
		ouput.appendChild(suffixElement);
	}
	return ouput;
}

export { AddLemmaAffix };