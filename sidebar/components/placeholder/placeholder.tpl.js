let cache = {}

templates.placeholder = (vars) => {

	// don't create a placeholder if the label is already in cache
	if (vars.entity && cache.labels[vars.entity] && !vars.type) {
		let link = document.createElement('a')
		link.innerText = cache.labels[vars.entity];
		if (cache.descriptions[vars.entity]) {
			link.setAttribute('title', cache.descriptions[vars.entity]);
		}
		link.setAttribute('href', getLink(vars.entity));
		link.addEventListener('click', (e) => {
			e.preventDefault();
			window.location = 'entity.html?' + vars.entity;
		});
		return link;
	}

	let rand = (min, max) => {
	  min = Math.ceil(min);
	  max = Math.floor(max);
	  return Math.floor(Math.random() * (max - min)) + min;
	}
	let tag = document.createElement('span');
	tag.classList.add('placeholder');
	if (vars.entity) {
		tag.setAttribute('data-entity', vars.entity);
	}
	if (vars.type) {
		tag.setAttribute('data-type', vars.type);
	}
	let words = [];
	if (vars.lazy) {
		tag.setAttribute('data-lazy', true);
	}
	for (var i = 0; i <= rand(1,2); i++) {
		words.push("█".repeat(rand(5,10)))
	}

	tag.innerText = words.join(' ');
	return tag;
}

(async () => {
	cache = await browser.storage.local.get();
})();
