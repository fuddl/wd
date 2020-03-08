let proposals = JSON.parse(decodeURIComponent(window.location.search.replace(/^\?/, '')));
let content = document.getElementById('content');

let labelField = templates.motive({
  proposals: proposals.titles,
});

content.appendChild(labelField);

let field = labelField.querySelector('input');
field.focus;

(async () => {
	let suggestions = await wikidataAutocomplete(field.value, 'en');
	console.log(JSON.stringify(suggestions));
	let list = document.createElement('ol');
	for (suggestion of suggestions) {
		let item = document.createElement('li');
		let desc = document.createElement('div');
		desc.innerText = suggestion.description;
		item.innerText = suggestion.label;
		item.appendChild(desc);
		list.appendChild(item);
	}
	content.appendChild(list);

	let token = await wikidataGetEditToken();
})();