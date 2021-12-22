import { wikidataAutocomplete } from '../../wd-autocomplete.js';
import { getAutodesc } from '../../get-autodesc.js';

let joinCounter = 0;

const join = (vars) => { 
	let wrapper = document.createElement('div');
	wrapper.classList.add('join');
	
	let humanField = document.createElement('input');
	humanField.classList.add('join__field');
	humanField.setAttribute('type', 'search');
	humanField.setAttribute('id', vars.id);

	if (vars.human) {
		humanField.value = vars.human;
	}

	let idField = document.createElement('input');
	humanField.setAttribute('type', 'text');
	idField.classList.add('join__id');
	idField.placeholder = '???';
	idField.setAttribute('pattern', `(CREATE|[A-Z]\\d+)`);

	let proposalId = 'join-proposals-' + joinCounter;

	let proposals = document.createElement('div');
	proposals.classList.add('join__proposals')

	wrapper.appendChild(idField);
	wrapper.appendChild(humanField);
	wrapper.appendChild(proposals);

	let style = document.createElement('link');
	style.setAttribute('rel',	"stylesheet");
	style.setAttribute('href', "components/join/join.css");

	wrapper.appendChild(style);

	let updateList = async () => {
		const lang = navigator.language.substr(0,2);
		let suggestions = await wikidataAutocomplete(humanField.value, lang, vars.scope);
		proposals.innerHTML = '';

		if (vars.scope === 'item') {
			suggestions.push({
				label: humanField.value,
				title: 'CREATE',
				description: 'CREATE',
			});
		}

		if (suggestions) { 
			for (let suggestion of suggestions) {
				let item = document.createElement('button');
				item.setAttribute('tabindex', '0');
				item.classList.add('join__proposal');
				item.innerText = suggestion.label;
				let desc = document.createElement('div');
				item.appendChild(desc);
				desc.classList.add('join__proposal__desc');
				desc.innerText = suggestion.description ? suggestion.description : '█████ █ ██████ ████ ████';
				if (!suggestion.description) {
					desc.classList.add('join__proposal__desc--placeholder');
				}

				proposals.appendChild(item);
				item.setAttribute('data-entity', suggestion.title.replace(/^\w+\:/, ''));
				item.setAttribute('data-label', suggestion.label);
				item.addEventListener('click', async () => {
					humanField.value = item.getAttribute('data-label');
					idField.value = item.getAttribute('data-entity');
					proposals.innerHTML = '';
					wrapper.setAttribute('data-selected-entity', item.getAttribute('data-entity'))
					wrapper.setAttribute('data-selected-label', item.getAttribute('data-label'))
				});
			}
		}
		for (let placeholder of proposals.querySelectorAll('.join__proposal__desc--placeholder')) {	
			let entityWithoutDesc = placeholder.parentNode.getAttribute('data-entity');
			placeholder.innerText = await getAutodesc(entityWithoutDesc);
		}
	}

	//humanField.addEventListener('change', updateList);
	humanField.addEventListener('focus', updateList);
	humanField.addEventListener('keyup', updateList);

	joinCounter++;
	return wrapper;
}

export { join }
