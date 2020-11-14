templates.express = (vars) => { 
	let wrapper = document.createElement('div');
	wrapper.classList.add('express');

	let main = document.createElement('div');
	main.classList.add('express__main');
	wrapper.appendChild(main);

	let autocomplete = document.createElement('ul');
	autocomplete.classList.add('express__autocomplete')

	let input = document.createElement('input');
	input.classList.add('express__pick');
	input.setAttribute('type', 'search');

	let desc = document.createElement('div');
	desc.classList.add('express__desc');

	const updateAutocomplete = async function(e) {
		let response = await fetch(`https://www.wikidata.org/w/api.php?action=wbsgetsuggestions&search=${e.target.value}&context=item&format=json&language=en&entity=${vars.entity}`);
		response = await response.json();
		autocomplete.innerText = '';
		for (let suggestion of response.search) {
			let title = document.createElement('strong');
			title.innerText = suggestion.label;
			let itemDesc = document.createElement('div');
			itemDesc.innerText = suggestion.description;
			let item = document.createElement('li');
			item.classList.add('express__autocomplete-option');
			item.appendChild(title);
			item.appendChild(itemDesc);
			if (typeof suggestion.datatype !== 'undefined' && !["wikibase-item", "wikibase-lexeme", "wikibase-property"].includes(suggestion.datatype)) {
				item.classList.add('express__autocomplete-option--unsupported');
				item.setAttribute('title', 'Data type not supported')
			} else {
				item.addEventListener('click', () => {
					input.value = suggestion.label;
					desc.innerText = suggestion.description;
					wrapper.setAttribute('data-prop', suggestion.id);

					browser.storage.local.set({
					  lastUsedProp:  {
					  	prop: suggestion.id,
					  	name: suggestion.label,
					  	desc: suggestion.description,
					  },
					});
					wrapper.dispatchEvent(new Event('change'));
					autocomplete.innerText = '';
				});
			}
			autocomplete.appendChild(item);
		}
	}

	input.addEventListener('keyup', updateAutocomplete);
	input.addEventListener('focus', updateAutocomplete);
	window.addEventListener('click', () => {
		if (event.target !== input || !autocomplete.contains(event.target)) {
			autocomplete.innerText = '';
		}
	});

	main.appendChild(input);

	let style = document.createElement('link');
	style.setAttribute('rel',  "stylesheet");
	style.setAttribute('href', "components/express/express.css");

	wrapper.appendChild(style);

	main.appendChild(autocomplete);
	main.appendChild(desc);

	(async () => {
		let storage = await browser.storage.local.get('lastUsedProp');
		if (!storage.lastUsedProp) {
			let firstPropId = 'P527';
			let firstProp = await wikidataGetEntity(firstPropId);

			browser.storage.local.set({
			  lastUsedProp:  {
			  	prop: firstPropId,
			  	name: getValueByLang(firstProp[firstPropId], 'labels', firstPropId),
			  	desc: getValueByLang(firstProp[firstPropId], 'descriptions', ''),
			  },
			});

			storage = await browser.storage.local.get('lastUsedProp');
		}
		desc.innerText = storage.lastUsedProp.desc;
		input.value = storage.lastUsedProp.name;
		wrapper.setAttribute('data-prop', storage.lastUsedProp.prop);
	})();

	let selection = document.createElement('div');
	selection.classList.add('express__selection');
	main.appendChild(selection);

	let options = document.createElement('details');
	options.classList.add('express__options');
	wrapper.appendChild(options);
	
	let summary = document.createElement('summary');
	summary.innerText = 'Links on this page';
	options.appendChild(summary);


	return {
		element: wrapper,
		selection: selection,
		options: options,
		loadingFinished: function() {
			progress.remove();
			input.focus();
		}
	}
}

templates.express__tag = (vars) => {
	let wrapper = document.createElement('label');
	wrapper.setAttribute('data-entity', vars.id);
	wrapper.classList.add('express__tag');

	let title = document.createElement('div');
	title.classList.add('express__tag__title')
	title.innerText = vars.id;
	wrapper.appendChild(title);

	let description = document.createElement('small');
	description.innerText = '███████ ██████████';
	description.classList.add('express__tag__desc')
	wrapper.appendChild(description);

	wrapper.postProcess = async function () {
		let e = await wikidataGetEntity(vars.id);
		title.innerText = getValueByLang(e[vars.id], 'labels', vars.id);
		let desc =  getValueByLang(e[vars.id], 'descriptions', false);
		if (desc) {
			description.innerText = desc;
		} else {
			description.style.opacity = .5;
			description.innerText = await getAutodesc(vars.id);
		}
	}

	wrapper.toggle = function() {
		let enabled = wrapper.classList.toggle('express__tag--selected');
		if (enabled) {
			vars.dest.appendChild(wrapper);
			wrapper.setAttribute('data-selected', true);
		} else {
			vars.src.insertBefore(wrapper, vars.src.firstChild);
			wrapper.removeAttribute('data-selected', true);
		}
		vars.refresh();
	}

	wrapper.addEventListener('click', () => {
		wrapper.toggle();
	});

	return wrapper;
}