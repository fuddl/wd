const lang = navigator.language.substr(0,2);

if (window.location.search) {
	let currentEntity = window.location.search.replace(/^\?/, '');
	updateView(currentEntity);
}

function getValueByLang(e, key, fallback) {
	if (!fallback) {
		let fallback = '';
	}
	if (e.hasOwnProperty(key)) {
		if (e[key].hasOwnProperty(lang)) {
			if (e[key][lang].hasOwnProperty('value')) {
				return e[key][lang].value;
			} else {
				return fallback;
			}
		} else {
			return fallback;
		}
	} else {
		return fallback;
	}
}

function updateView(url) {
	let id = url.replace('http://www.wikidata.org/entity/', '');
	let content = document.getElementById('content');
	content.innerHTML = '';
	(async () => {
		let entities = await wikidataGetEntity(id);
		for (id of Object.keys(entities)) {
			let e = entities[id];
			let wrapper = document.createElement('div');
			wrapper.appendChild(templates.ensign({
				id: id,
				label: getValueByLang(e, 'labels', e.title),
				description: getValueByLang(e, 'descriptions', 'Wikidata entity'),
			}));

			let identifiers = document.createElement('div');
			let items = document.createElement('div');
			wrapper.appendChild(items);
			wrapper.appendChild(identifiers);
			content.appendChild(wrapper);

			for (prop of Object.keys(e.claims)) {

				let value = e.claims[prop];
				if (value[0].mainsnak.datatype === "wikibase-item") {	
					(async () => {
						let values = [];
						let pid = value[0].mainsnak.property;
						let label = await wikidataGetEntity(pid);
						for (delta of value) {				
							let vid = delta.mainsnak.datavalue.value.id;
							let ventiy = await wikidataGetEntity(vid);

							values.push(templates.link({
								text: getValueByLang(ventiy[vid], 'labels', vid),
								href: 'https://www.wikidata.org/wiki/' + vid,
								title: getValueByLang(ventiy[vid], 'descriptions', ''),
							}));
						}
						items.appendChild(templates.remark({
							prop: label[pid].labels[lang].value,
							propDesc: label[pid].descriptions[lang].value,
							vals: values,
						}));
					})();
				}
				
				if (value[0].mainsnak.datatype === "external-id") {	
					(async () => {
						let values = [];
						let pid = value[0].mainsnak.property;
						let label = await wikidataGetEntity(pid);
						for (delta of value) {		
							values.push(templates.code(delta.mainsnak.datavalue.value));
						}
						identifiers.appendChild(templates.remark({
							prop: label[pid].labels[lang].value,
							propDesc: label[pid].descriptions[lang].value,
							vals: values,
						}));
					})();
				}
			}
		}
	})();
}

browser.runtime.onMessage.addListener( async (data, sender) => {
	let thisTab = await browser.tabs.getCurrent();
	if (data.match || thisTab == sender.tab.id) {
		const result = await getEntityByAuthorityId(data.prop, data.id);
		updateView(result[0].item.value);
	}
})