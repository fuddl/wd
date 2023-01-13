import { requreStylesheet } from '../require-styleheet.js';

const proof = (vars) => { 
	let dl = document.createElement('dl');
	dl.classList.add('proof');

	let dt = document.createElement('dt');
	dt.classList.add('proof__verb');
	dt.appendChild(vars.prop);
	dl.appendChild(dt);
	dl.appendChild(document.createTextNode(' '));
	
	for (let item of vars.vals) {
		let dd = document.createElement('dd');
		dd.classList.add('proof__object');
		dd.appendChild(item);
		dl.appendChild(dd);
	}

	requreStylesheet("components/proof/proof.css");
	
	return dl;
}

export { proof };
