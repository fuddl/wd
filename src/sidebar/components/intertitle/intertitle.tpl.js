import { requreStylesheet } from '../require-styleheet.js'

const intertitle = (vars) => {
	requreStylesheet("components/intertitle/intertitle.css")

	let div = document.createElement('div');
	div.classList.add('intertitle');

	let icon = document.createElement('img');
	icon.classList.add('intertitle__icon');
	icon.setAttribute('src', vars.icon.src);
	icon.setAttribute('alt', vars.icon.alt);
	
	let text = document.createElement('div');
	text.classList.add('intertitle__text');
	text.innerText = vars.text;

	div.appendChild(icon);
	div.appendChild(text);
	return div;
}

export { intertitle }
