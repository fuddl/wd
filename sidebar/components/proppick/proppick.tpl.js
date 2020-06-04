templates.proppick = (vars) => { 
	let wrapper = document.createElement('div');
	wrapper.classList.add('proppick');

	let input = document.createElement('input');
	input.classList.add('proppick__pick');
	input.setAttribute('type', 'search');
	input.setAttribute('list', 'all-properties');
	input.setAttribute('placeholder', vars.placeholder);
	wrapper.appendChild(input);

	let style = document.createElement('link');
	style.setAttribute('rel',  "stylesheet");
	style.setAttribute('href', "components/proppick/proppick.css");

	wrapper.appendChild(style);

	let desc = document.createElement('div');
	desc.classList.add('proppick__desc')
	wrapper.appendChild(desc);

	input.addEventListener('change', () => {
		let list = document.querySelector('datalist#all-properties');
		for (let item of list.childNodes) {
			if (item.innerText === input.value) {
				desc.innerText = item.getAttribute('data-description');
				wrapper.setAttribute('data-prop', 'P' + item.getAttribute('data-prop'));
				wrapper.dispatchEvent('change');
				continue;
			}
		}
	});

	return wrapper;
}