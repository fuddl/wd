const lang = navigator.language.substr(0,2);

if (window.location.search) {
	let currentEntity = window.location.search.replace(/^\?/, '');
	updateView(currentEntity);
}

function updateView(url) {
	let id = url.replace('http://www.wikidata.org/entity/', '');
	let content = document.getElementById('content');
	content.innerHTML = '';
	(async () => {
		entities = await wikidataGetEntity(id);
		for (id of Object.keys(entities)) {
			let e = entities[id];
			let wrapper = document.createElement('div');
			wrapper.insertAdjacentHTML('beforeend', templates.ensign({
				id: id,
				label: e.labels[lang].value ?? e.title,
				description: e.descriptions[lang].value ?? 'Wikidata entity',
			}));

			for (prop of Object.keys(e.claims)) {
				let items = document.createElement('div');
				let identifiers = document.createElement('div');
				wrapper.appendChild(items);
				wrapper.appendChild(identifiers);

				let value = e.claims[prop];
				if (value[0].mainsnak.datatype === "wikibase-item") {	
					(async () => {
						let values = [];
						let pid = value[0].mainsnak.property;
						let label = await wikidataGetEntity(pid);
						for (delta of value) {				
							let ventiy;
								let vid = delta.mainsnak.datavalue.value.id;
								ventiy = await wikidataGetEntity(vid);

								values.push(templates.link({
									text: ventiy[vid].labels[lang].value,
									href: 'https://www.wikidata.org/wiki/' + vid,
									title: ventiy[vid].descriptions[lang].value,
								}));
						}
						items.insertAdjacentHTML('beforeend', templates.claim({
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
						wrapper.insertAdjacentHTML('beforeend', templates.claim({
							prop: label[pid].labels[lang].value,
							propDesc: label[pid].descriptions[lang].value,
							vals: values,
						}));
					})();
				}
				wrapper.appendChild(identifiers);
			}

			content.appendChild(wrapper);
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