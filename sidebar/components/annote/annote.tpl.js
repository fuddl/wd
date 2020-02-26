templates.annote = (vars) => { 
	let dl = document.createElement('dl');
	dl.classList.add('annote');
	if (vars.block) {
		dl.classList.add('annote--block');
	} else {
		dl.classList.add('annote--inline');
	}

	let dt = document.createElement('dt');
	dt.classList.add('annote__verb');
	dt.appendChild(vars.prop);
	dl.appendChild(dt);
	
	for (item of vars.vals) {
		let dd = document.createElement('dd');
		dd.classList.add('annote__object');
		dd.appendChild(item);
		dl.appendChild(dd);
	}

	let style = document.createElement('link');
	style.setAttribute('rel',  "stylesheet");
	style.setAttribute('href', "components/annote/annote.css");

	dl.appendChild(style);
	return dl;
}