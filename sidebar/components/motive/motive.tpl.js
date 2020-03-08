let motiveCounter = 0;

templates.motive = (vars) => { 
	let wrapper = document.createElement('div');
	wrapper.classList.add('motive');
	let motiveId = 'motive-' + motiveCounter;
	
	let field = document.createElement('input');
	field.classList.add('motive__field');
	field.setAttribute('type', 'search');
	field.setAttribute('id', motiveId);

	let magnifier = document.createElement('label');
	magnifier.classList.add('motive__magnifier');
	magnifier.setAttribute('for', motiveId);
	magnifier.innerText = "🔍";

	let proposalId = 'motive-proposals-' + motiveCounter;

	if (vars.proposals[0]) {
	  field.value = vars.proposals[0];
		field.setAttribute('list', proposalId);
	}

	let proposals = document.createElement('datalist');
	proposals.setAttribute('id', proposalId);


	for (text of vars.proposals) {
	  let option = document.createElement('option');
	  option.setAttribute('value', text);
	  proposals.appendChild(option);
	}

	wrapper.appendChild(field);
	wrapper.appendChild(magnifier);
	wrapper.appendChild(proposals);

	let style = document.createElement('link');
	style.setAttribute('rel',  "stylesheet");
	style.setAttribute('href', "components/motive/motive.css");

	wrapper.appendChild(style);

	motiveCounter++;
	return wrapper;
}