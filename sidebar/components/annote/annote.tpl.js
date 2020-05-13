templates.annote = (qualifiers) => { 
	let dl = document.createElement('dl');
	dl.classList.add('annote');

	for (group of qualifiers) {
		let dt = document.createElement('dt');
		dt.classList.add('annote__verb');

		console.log(typeof group);
		dt.appendChild(group.prop);
		dl.appendChild(dt);
		
		for (item of group.vals) {
			let dd = document.createElement('dd');
			dd.classList.add('annote__object');
			dd.appendChild(item);
			dl.appendChild(dd);
		}
	}

	let style = document.createElement('link');
	style.setAttribute('rel',  "stylesheet");
	style.setAttribute('href', "components/annote/annote.css");

	dl.appendChild(style);
	console.log(dl.outerHTML);
	return dl;
}