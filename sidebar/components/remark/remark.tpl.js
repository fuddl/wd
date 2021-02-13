templates.remark = (vars) => { 
	let dl = document.createElement('dl');
	dl.classList.add('remark');
	if (vars.block) {
		dl.classList.add('remark--block');
	} else {
		dl.classList.add('remark--inline');
	}
	if (vars.id) {
		dl.setAttribute('id', vars.id);
	}

	let dt = document.createElement('dt');
	dt.classList.add('remark__verb');
	dt.appendChild(vars.prop);
	dl.appendChild(dt);
	
	for (item of vars.vals) {
		let dd = document.createElement('dd');
		dd.classList.add('remark__object');
		dd.appendChild(item);
		dl.appendChild(dd);
	}

	if (vars.check) {
		let check = document.createElement('dd');
		check.classList.add('remark__check');
		check.appendChild(vars.check);
		dl.appendChild(check);
	}

	let style = document.createElement('link');
	style.setAttribute('rel',  "stylesheet");
	style.setAttribute('href', "components/remark/remark.css");

	dl.appendChild(style);
	return dl;
}