templates.express = (vars) => { 
	let wrapper = document.createElement('div');
	wrapper.classList.add('express');

	let progress = document.createElement('progress');
	progress.classList.add('express__progress');

	let main = document.createElement('div');
	main.classList.add('express__main');
	wrapper.appendChild(main);

	let input = document.createElement('input');
	input.classList.add('express__pick');
	input.setAttribute('type', 'search');
	input.setAttribute('list', 'all-properties');
	main.appendChild(input);
	main.appendChild(progress);

	let style = document.createElement('link');
	style.setAttribute('rel',  "stylesheet");
	style.setAttribute('href', "components/express/express.css");

	wrapper.appendChild(style);

	let desc = document.createElement('div');
	desc.classList.add('express__desc');
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
		wrapper.setAttribute('data-prop', 'P' + storage.lastUsedProp.prop);
	})();

	let aqureDescription = () => {
		let list = document.querySelector('datalist#all-properties');
		for (let item of list.childNodes) {
			if (item.innerText === input.value) {
				let propId = item.getAttribute('data-prop');
				let propDesc = item.getAttribute('data-description');
				desc.innerText = propDesc;
				wrapper.setAttribute('data-prop', 'P' + propId);
				wrapper.dispatchEvent(new Event('change'));

				browser.storage.local.set({
				  lastUsedProp:  {
				  	prop: propId,
				  	name: input.value,
				  	desc: propDesc,
				  },
				});
				continue;
			}
		}
	}	

	let selection = document.createElement('div');
	selection.classList.add('express__selection');
	main.appendChild(selection);

	let options = document.createElement('details');
	options.classList.add('express__options');
	wrapper.appendChild(options);

	input.addEventListener('change', aqureDescription);
	input.addEventListener('keyup', aqureDescription);

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