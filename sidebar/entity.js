const lang = navigator.language.substr(0,2);

if (window.location.search) {
	let currentEntity = window.location.search.replace(/^\?/, '');
	if (currentEntity.match(/Q\d+/)) {
		updateView(currentEntity);
	}
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

	if (prec <= 6) {
		return false;
	}

	let suffix = wiso.startsWith('-') ? ' BCE' : '';

	let pad = function (i) {
    if (i < 10) {
      return '0' + i;
    }
    return i;
  }

	let iso = wiso
		.replace(/^(\+|-)/, '')
		.replace(/Z$/, '')
		.replace(/^(\d+)-00/, '$1-01')
		.replace(/^(\d+)-(\d+)-00/, '$1-$2-01');

	let date = new Date(iso);

	let output = [];
	if (prec === 7) {
		let text = date.getFullYear().toString().slice(0, -2) + 'XX' + suffix;
		return templates.proxy({
			query: `
				SELECT ?innerText WHERE {
				  ?century wdt:P31 wd:Q578.
				  ?century wdt:P585 "${ iso }Z"^^xsd:dateTime.
				  SERVICE wikibase:label
				  { 
				    bd:serviceParam wikibase:language "[AUTO_LANGUAGE],${ lang }". 
				    ?century rdfs:label ?innerText.
				  }
				}
				LIMIT 1`,
			text: text,
		});
	} else if (prec === 8) {
		let text =  date.getFullYear().toString().slice(0, -1) + 'X';
		return templates.proxy({
			query: `
				SELECT ?innerText WHERE {
				  ?decade wdt:P31 wd:Q39911.
				  ?decade wdt:P585 "${ iso }Z"^^xsd:dateTime.
				  SERVICE wikibase:label
				  { 
				    bd:serviceParam wikibase:language "[AUTO_LANGUAGE],${ lang }". 
				    ?decade rdfs:label ?innerText.
				  }
				}
				LIMIT 1`,
			text: text,
		});
	} else {		
		if (prec > 8) {
			output.push(date.getUTCFullYear());
		}
		if (prec > 9) {
			output.push(pad(date.getUTCMonth() + 1));
		}
		if (prec > 10) {
			output.push(pad(date.getUTCDate()));
		}
	}

	return document.createTextNode(output.join('-') + suffix);
}

function insertAfter(referenceNode, newNode) {
  referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
}

function renderStatements(snak, references, type, target, scope) {
	if (type === 'value' || scope === 'reference') {
		let valueType = snak.datatype;
		if (valueType === "time") {	
			let date = dateToString(snak.datavalue.value);
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
			target.appendChild(document.createTextNode(snak.datavalue.value));
		}
		if (valueType === "url") {
			let humanReadable = snak.datavalue.value;
			target.appendChild(templates.urlLink(snak.datavalue.value));
		}
		if (valueType === 'quantity') {
			let number = document.createTextNode(parseFloat(snak.datavalue.value.amount));
			target.appendChild(number);

			if (snak.datavalue.value.unit) {
				let space = document.createTextNode(' ');
				target.appendChild(space);

				target.appendChild(templates.proxy({
					query: `
						SELECT ?innerText WHERE {
    					<${ snak.datavalue.value.unit }> wdt:P5061 ?innerText.
    					FILTER(LANG(?innerText) = "${ lang }").
						}`
				}));
			}
		}
		if (valueType === "globe-coordinate") {
			target.appendChild(templates.mercator({
				lat: snak.datavalue.value.latitude,
				lon: snak.datavalue.value.longitude,
				pre: snak.datavalue.value.precision,
				height: 500,
				width: 500,
			}));
		}
		if (valueType === "monolingualtext") {
			target.appendChild(templates.title({
				text: snak.datavalue.value.text,
				lang: snak.datavalue.value.lang
			}));
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
	if (target) {
		target.appendChild(document.createTextNode(' '));
		let sup = document.createElement('sup');
		let c = 0;
		for (reference of references) {
			if (c > 0) {
				sup.appendChild(document.createTextNode('/'));
			}
			sup.appendChild(reference);
			c++;
		}
	  if (sup.hasChildNodes()) {
			target.appendChild(sup);
	  }
	}
	if (scope === 'statement' && delta.hasOwnProperty('qualifiers')) {
		let qualifiers = [];
		for (prop of Object.keys(delta.qualifiers)) {
			let qvalues = [];
			for (qv of delta.qualifiers[prop]) {
				let qualvalue = new DocumentFragment();
				renderStatements(qv,[], qv.snaktype, qualvalue, 'qualifier');
				qvalues.push(qualvalue);
			}

			qualifiers.push({
				prop: templates.placeholder({ entity: prop }),
				vals: qvalues,
			});
		}
		target.appendChild(templates.annote(qualifiers));
	}
}

function updateView(url) {
	let id = url.replace('http://www.wikidata.org/entity/', '');
	let content = document.getElementById('content');
	content.innerHTML = '';
	(async () => {
		let entities = await wikidataGetEntity(id);

		let refCounter = {};

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
			let references = document.createElement('ol');

			wrapper.appendChild(items);
			wrapper.appendChild(identifiers);
			wrapper.appendChild(references);
			content.appendChild(wrapper);

			for (prop of Object.keys(e.claims)) {

				let value = e.claims[prop];

				let pid = value[0].mainsnak.property;
				let label = templates.placeholder({
					entity: pid,
				});

				let values = [];
				for (delta of value) {
					if (delta.rank == "deprecated") {
						delete delta;
					}
				}
				for (delta of value) {
					if (delta.hasOwnProperty('mainsnak') && delta.mainsnak) {
						let thisvalue = new DocumentFragment();
						let type = delta.mainsnak.snaktype;
						let refs = [];
						if (delta.references) {
							for (ref of delta.references) {
								let listItem;
								let refvalues = [];
								if (typeof refCounter[ref.hash] === 'undefined') {
									listItem = document.createElement('li');
									refCounter[ref.hash] = {
										index: Object.keys(refCounter).length + 1,
										item: listItem,
									}
									references.appendChild(listItem);
									for (key in ref.snaks) {
										for (refthing of ref.snaks[key]) {
											if (refthing.datavalue) {
												let refvalue = new DocumentFragment();

												renderStatements(refthing, [], refthing.datavalue.type, refvalue, 'reference');
												refvalues.push(refvalue);
											}
										}
										let refStatement = templates.proof({
											prop: templates.placeholder({
												entity: key,
											}),
											vals: refvalues,
										});
										listItem.appendChild(refStatement);
									}
								} else {
									listItem = refCounter[ref.hash].item;
								}
								refs.push(templates.footnoteRef({
									text: refCounter[ref.hash].index,
									link: '#' + ref.hash,
								}));
								listItem.setAttribute('id', ref.hash);
							}
						}
						renderStatements(delta.mainsnak, refs, type, thisvalue, 'statement');
						
						values.push(thisvalue);
						
					}
				}

				let statement = templates.remark({
					prop: templates.placeholder({
						entity: pid,
					}),
					vals: values,
				});

				if (value[0].mainsnak.snaktype === 'value' && value[0].mainsnak.datatype !== "external-id") {
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

		let proxies = content.querySelectorAll('.proxy');

		Array.from(proxies).reduce((k, proxy) => {
			(async () => {
				let result = await sparqlQuery(proxy.getAttribute('data-query'));
				if (result[0].hasOwnProperty('innerText')) {
					proxy.innerText = result[0].innerText.value;
				}
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