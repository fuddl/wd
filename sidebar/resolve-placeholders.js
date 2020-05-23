function getLink(entityId) {
	let ns = entityId.charAt(0);
	let prefixes = {
		Q: 'https://www.wikidata.org/wiki/',
		P: 'https://www.wikidata.org/wiki/Property:',
		L: 'https://www.wikidata.org/wiki/Lexeme:',
	}
	return prefixes[ns] + entityId;
}

function resolvePlaceholders() {
	let placeholders = document.querySelectorAll('.placeholder');

	Array.from(placeholders).reduce((k, placeholder) => {
		(async () => {
			let id = placeholder.getAttribute('data-entity');
			let entity = await wikidataGetEntity(id);
			let link = document.createElement('a');
			link.setAttribute('href', getLink(id));
			link.setAttribute('title', getValueByLang(entity[id], 'descriptions'));
			link.innerText = getValueByLang(entity[id], 'labels', id);
			link.addEventListener('click', (e) => {
				e.preventDefault();
				window.location = '?' + id;
			});
			placeholder.parentNode.replaceChild(link, placeholder);
		})();
	}, 0);
}