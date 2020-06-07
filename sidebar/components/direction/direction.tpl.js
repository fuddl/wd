templates.direction = (vars) => { 
	let wrapper = document.createElement('div');
	wrapper.classList.add('direction');
	let arrow = document.createElement('span');
	arrow.innerText = '⬇';
	wrapper.appendChild(arrow);

	if (vars && vars.flippable) {
		wrapper.classList.add('direction--flippable');
		wrapper.addEventListener('click', () => {
			wrapper.toggleAttribute("data-flipped");
			arrow.innerText = arrow.innerText === '⬇' ? '⬆' : '⬇';
		});
	}

	let style = document.createElement('link');
	style.setAttribute('rel',  "stylesheet");
	style.setAttribute('href', "components/direction/direction.css");

	wrapper.appendChild(style);

	return wrapper;
}