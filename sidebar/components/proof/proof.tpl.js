templates.proof = (vars) => { 
	let dl = document.createElement('dl');
	dl.classList.add('proof');

	let dt = document.createElement('dt');
	dt.classList.add('proof__verb');
	dt.appendChild(vars.prop);
	dl.appendChild(dt);
	dl.appendChild(document.createTextNode(' '));
	
	for (item of vars.vals) {
		let dd = document.createElement('dd');
		dd.classList.add('proof__object');
		dd.appendChild(item);
		dl.appendChild(dd);
	}

	let style = document.createElement('link');
	style.setAttribute('rel',  "stylesheet");
	style.setAttribute('href', "components/proof/proof.css");

	dl.appendChild(style);
	return dl;
}