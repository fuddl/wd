const lang = navigator.language.substr(0,2);

if (window.location.search) {
	let currentEntity = window.location.search.replace(/^\?/, '');
	updateView(currentEntity);
}

function getLink(entityId) {
	let ns = entityId.charAt(0);
	let prefixes = {
		Q: 'https://www.wikidata.org/wiki/',
		P: 'https://www.wikidata.org/wiki/Property:',
		L: 'https://www.wikidata.org/wiki/Lexeme:',
	}
	return prefixes[ns] + entityId;
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

function insertAfter(referenceNode, newNode) {
  referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
}

function renderStatements(snak, type, target, qualifiers) {
	if (type === 'value') {
		let valueType = snak.datatype;
		if (valueType === "time") {	
			let date = dateToString(snak.datavalue.value)
			if (date) {
				target.appendChild(templates.time({
					text: date,
				}));
			}
		}		
		if (valueType === "wikibase-item") {
			let vid = snak.datavalue.value.id;
			target.appendChild(templates.placeholder({
				entity: vid,
			}));
		}
		if (valueType === "external-id") {
			target.appendChild(templates.code(snak.datavalue.value));
		}
		if (valueType === "string") {
			target.appendChild(templates.title(snak.datavalue.value));
		}
		if (valueType === "commonsMedia") {
			let name = encodeURIComponent(snak.datavalue.value);
			target.appendChild(templates.picture({
				srcSet: {
					250: `http://commons.wikimedia.org/wiki/Special:FilePath/${ name }?width=250px`,
					501: `http://commons.wikimedia.org/wiki/Special:FilePath/${ name }?width=501px`,
					801: `http://commons.wikimedia.org/wiki/Special:FilePath/${ name }?width=801px`,
					1068: `http://commons.wikimedia.org/wiki/Special:FilePath/${ name }?width=1068px`,
				}
			}));
		}
	} else if(type === 'novalue') {
		target.appendChild(document.createTextNode('—'));
	} else if(type === 'somevalue') {
		target.appendChild(document.createTextNode('?'));
	}
	if (qualifiers && delta.hasOwnProperty('qualifiers')) {
		for (prop of Object.keys(delta.qualifiers)) {
			let qvalues = [];
			if (delta.qualifiers) {
				for (qv of delta.qualifiers[prop]) {
					let qualvalue = new DocumentFragment();
					renderStatements(qv, qv.snaktype, qualvalue, false);
					qvalues.push(qualvalue);
				}
			}
			target.appendChild(templates.remark({
				prop: templates.placeholder({
					entity: prop,
				}),
				vals: qvalues,
			}));
		}
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

				let pid = value[0].mainsnak.property;
				let label = templates.placeholder({
					entity: pid,
				});

				let values = [];
				for (delta of value) {
					if (delta.hasOwnProperty('mainsnak') && delta.mainsnak) {
						let thisvalue = new DocumentFragment();
						let type = delta.mainsnak.snaktype;
						renderStatements(delta.mainsnak, type, thisvalue, true);
						values.push(thisvalue);
					}
				}

				let statement = templates.remark({
					prop: templates.placeholder({
						entity: pid,
					}),
					vals: values,
				});


				if (value[0].type === 'value' && value[0].mainsnak.datavalue.type !== "external-id") {
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
				link.setAttribute('href', getLink(id));
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