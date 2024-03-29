import { requreStylesheet } from '../require-styleheet.js'

const annote = (qualifiers) => { 
	let dl = document.createElement('dl');
	dl.classList.add('annote');

	for (let group of qualifiers) {
		let dt = document.createElement('dt');
		dt.classList.add('annote__verb');

		dt.appendChild(group.prop);
		dl.appendChild(dt);
		
		for (let item of group.vals) {
			let dd = document.createElement('dd');
			dd.classList.add('annote__object');
			dd.appendChild(item);
			dl.appendChild(dd);
		}
	}

	requreStylesheet("components/annote/annote.css");
	
	return dl;
}

export { annote }