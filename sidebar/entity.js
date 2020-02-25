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

function dateToString(value) {
	let wiso = value.time;
	let prec = value.precision;

	if (wiso.startsWith('-') || prec <= 8) {
		return false;
	}

	let pad = function (i) {
    if (i < 10) {
      return '0' + i;
    }
    return i;
  }

	let iso = wiso
		.replace(/^\+/, '')
		.replace(/Z$/, '')
		.replace(/^(\d+)-00/, '$1-01')
		.replace(/^(\d+)-(\d+)-00/, '$1-$2-01');

	let date = new Date(iso);

	let output = [];
	if (prec > 8) {
		output.push(date.getUTCFullYear());
	}
	if (prec > 9) {
		output.push(pad(date.getUTCMonth() + 1));
	}
	if (prec > 10) {
		output.push(pad(date.getUTCDate()));
	}

	return output.join('-');
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
				let type = value[0].mainsnak.datatype;
				let values = [];

				let pid = value[0].mainsnak.property;
				let label = templates.placeholder({
					entity: pid,
				});

				for (delta of value) {		
					let vid = delta.mainsnak.datavalue.value.id;

					console.log(type);
					if (type === "time") {	
						let date = dateToString(delta.mainsnak.datavalue.value)
						if (date) {
							values.push(templates.time({
								text: date,
							}));
						}
					}		
					if (type === "wikibase-item") {
						values.push(templates.placeholder({
							entity: vid,
						}));
					}
					if (type === "external-id") {
						for (delta of value) {		
							values.push(templates.code(delta.mainsnak.datavalue.value));
						}
					}
					if (type === "commonsMedia") {
						for (delta of value) {		
							//values.push(templates.code(delta.mainsnak.datavalue.value));
						}
					}
				}

				let statement = templates.remark({
					prop: templates.placeholder({
						entity: pid,
					}),
					vals: values,
				})

				if (type !== "external-id") {
					items.appendChild(statement);
				} else {
					identifiers.appendChild(statement);
				}
			}
		}
		let placeholders = content.querySelectorAll('.placeholder');

		Array.from(placeholders).reduce((k, placeholder) => {
			(async () => {
				let id = placeholder.getAttribute('data-entity');
				let entity = await wikidataGetEntity(id);
				let link = document.createElement('a');
				link.innerText = getValueByLang(entity[id], 'labels', id);
				placeholder.parentNode.replaceChild(link, placeholder);
			})();
		}, 0);
	})();
}

browser.runtime.onMessage.addListener( async (data, sender) => {
	let thisTab = await browser.tabs.getCurrent();
	if (data.match || thisTab == sender.tab.id) {
		const result = await getEntityByAuthorityId(data.prop, data.id);
		updateView(result[0].item.value);
	}
})