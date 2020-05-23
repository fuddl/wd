let joinCounter = 0;

templates.join = (vars) => { 
	let wrapper = document.createElement('div');
	wrapper.classList.add('join');
	let joinId = 'join-' + joinCounter;
	
	let humanField = document.createElement('input');
	humanField.classList.add('join__field');
	humanField.setAttribute('type', 'search');
	humanField.setAttribute('id', joinId);

	if (vars.human) {
		humanField.value = vars.human;
	}

	let idField = document.createElement('input');
	humanField.setAttribute('type', 'text');
	idField.classList.add('join__id');
	idField.placeholder = '???';
	idField.setAttribute('pattern', `[A-Z]\\d+`);

	let proposalId = 'join-proposals-' + joinCounter;

	let proposals = document.createElement('div');
	proposals.classList.add('join__proposals')

	wrapper.appendChild(idField);
	wrapper.appendChild(humanField);
	wrapper.appendChild(proposals);

	let style = document.createElement('link');
	style.setAttribute('rel',  "stylesheet");
	style.setAttribute('href', "components/join/join.css");

	wrapper.appendChild(style);

	let updateList = async () => {
		let suggestions = await wikidataAutocomplete(humanField.value, 'en');
		proposals.innerHTML = '';
		if (suggestions) { 
			for (suggestion of suggestions) {
				let item = document.createElement('button');
				item.setAttribute('tabindex', '0');
				item.classList.add('join__proposal');
				item.innerText = suggestion.label;
				if (suggestion.description) {
					let desc = document.createElement('div');
					desc.innerText = suggestion.description;
					item.appendChild(desc);
				}
				proposals.appendChild(item);
				console.log(suggestion);
				item.setAttribute('data-entity', suggestion.title);
				item.setAttribute('data-label', suggestion.label);
				item.addEventListener('click', async () => {
					humanField.value = item.getAttribute('data-label');
					idField.value = item.getAttribute('data-entity');
					proposals.innerHTML = '';
					wrapper.setAttribute('data-selected-entity', item.getAttribute('data-entity'))
				});
			}
		}
	}

	humanField.addEventListener('change', updateList);
	humanField.addEventListener('focus', updateList);
	humanField.addEventListener('keyup', updateList);

	joinCounter++;
	return wrapper;
}