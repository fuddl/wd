import { requreStylesheet } from '../require-styleheet.js'

const direction = (vars) => { 
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

	requreStylesheet("components/direction/direction.css");

	return wrapper;
}

export { direction }
