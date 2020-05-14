templates.ensign = (vars) => { 
	let header = document.createElement('header');
	let title = document.createElement('h1');
	let id = document.createElement('small');
	let space = document.createTextNode(' ');
	let description = document.createElement('p');
	
	let style = document.createElement('link');
	style.setAttribute('rel',  "stylesheet");
	style.setAttribute('href', "components/ensign/ensign.css");
	
	header.classList.add('ensign');

	title.classList.add('ensign__title');
	title.innerText = vars.label;

	id.classList.add('ensign__id');
	let link = document.createElement('a');
	link.classList.add("ensign__id__link")
	link.setAttribute('href', 'https://www.wikidata.org/wiki/' + vars.id);
	link.innerText = vars.id;
	link.addEventListener('click', (e) => {
		e.preventDefault();
	});
	id.appendChild(link);

	description.classList.add('ensign__description');
	description.innerText = vars.description;

	header.appendChild(title);
	header.appendChild(space);
	header.appendChild(id);
	header.appendChild(description);
	header.appendChild(style);

	return header;
}