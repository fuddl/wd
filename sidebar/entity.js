const lang = navigator.language.substr(0,2);
const footnoteStorage = {};
let refCounter = {};

function checkNested(obj, level,  ...rest) {
  if (obj === undefined) return false
  if (rest.length == 0 && obj.hasOwnProperty(level)) return true
  return checkNested(obj[level], ...rest)
}

if (window.location.search) {
	let currentEntity = window.location.search.match(/^\?(\w\d+)/, '')[1];
	if (currentEntity.match(/[QMPL]\d+/)) {
		updateView(currentEntity, window.location.hash !== '#nocache');
	}
}

async function getTokens() {
	let response = await fetch('https://www.wikidata.org/w/api.php?action=query&meta=tokens&type=csrf&format=json');
	let json = JSON.parse(await response.text());
	return json.query.tokens.csrftoken;
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
		let valueType = snak.datatype ? snak.datatype : snak.datavalue.type ;
		if (valueType === "time") {	
			let date = dateToString(snak.datavalue.value);
			if (date) {		
				target.appendChild(templates.time({
					text: date,
				}));
			}
		}
		if (valueType === "wikibase-item" || valueType === "wikibase-entityid" || valueType === "wikibase-lexeme" || valueType === "wikibase-form"  || valueType === "wikibase-sense") {
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
		if (valueType === "globe-coordinate" || valueType ===  'globecoordinate') {
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
			if (name.match(/\.svg$/i)) {
				target.appendChild(templates.image({
					src: `http://commons.wikimedia.org/wiki/Special:FilePath/${ name }`
				}));
			} else if (name.match(/\.(jpe?g|png|gif|tiff?|stl)$/i)) {
				target.appendChild(templates.picture({
					srcSet: {
						250: `http://commons.wikimedia.org/wiki/Special:FilePath/${ name }?width=250px`,
						501: `http://commons.wikimedia.org/wiki/Special:FilePath/${ name }?width=501px`,
						801: `http://commons.wikimedia.org/wiki/Special:FilePath/${ name }?width=801px`,
						1068: `http://commons.wikimedia.org/wiki/Special:FilePath/${ name }?width=1068px`,
					}
				}));
			} else if (name.match(/\.(wav|og[ga])$/i)) {
				target.appendChild(templates.audio({
					src: `http://commons.wikimedia.org/wiki/Special:FilePath/${ name }`
				}));
			} else if (name.match(/\.webm$/i)) {
				target.appendChild(templates.video({
					poster: `http://commons.wikimedia.org/wiki/Special:FilePath/${ name }?width=801px`,
					src: `http://commons.wikimedia.org/wiki/Special:FilePath/${ name }`
				}));
			}
		}
	} else if(type === 'novalue') {
		target.appendChild(document.createTextNode('—'));
	} else if(type === 'somevalue') {
		target.appendChild(document.createTextNode('?'));
	}
	if (target) {
		target.appendChild(document.createTextNode('\xa0'));
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

function renderStatement(value) {
	if (value[0].mainsnak) {
		let pid = value[0].mainsnak.property;
		let label = templates.placeholder({
			entity: pid,
		});

		let values = [];
		let hasPreferred = false;
		for (delta of value) {
			if (delta.rank == "preferred") {
				hasPreferred = true;
			}
		}
		for (const [key, delta] of Object.entries(value)) {
			if (delta.rank == "deprecated" || (delta.rank == "normal" && hasPreferred)) {
				delete value[key];
			}
		}
		for (delta of value) {
			if (delta && delta.hasOwnProperty('mainsnak') && delta.mainsnak) {
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
								item: listItem,
							}
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
						listItem.setAttribute('id', ref.hash);
						refs.push(templates.footnoteRef({
							text: '▐',
							link: '#' + ref.hash,
							title: listItem.innerText,
						}));
						footnoteStorage[ref.hash] = {
							content: listItem,
						};
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

		let firstValue = value.find(x=>x!==undefined);
		
		if (firstValue) {
			return {
				rendered: statement,
				type: firstValue.mainsnak.snaktype,
			};
		}
	}
}

function updateView(id, useCache = true) {
	let content = document.getElementById('content');
	content.innerHTML = '';
	(async () => {
		let entities = await wikidataGetEntity(id, useCache);

		for (id of Object.keys(entities)) {
			let e = entities[id];

			let wrapper = document.createElement('div');
			
			if (e.lemmas) {
				let labels = [];
				for (let lang in e.lemmas) {
					labels.push(e.lemmas[lang].value)
				}

				let lexemeDescription = document.createDocumentFragment();

				lexemeDescription.appendChild(templates.placeholder({
					entity: e.language
				}));

				lexemeDescription.appendChild(document.createTextNode(', '));

				lexemeDescription.appendChild(templates.placeholder({
					entity: e.lexicalCategory
				}));

				wrapper.appendChild(templates.ensign({
					revid: e.lastrevid,
					id: id,
					label: labels.join(' ‧ '),
					description: { text: lexemeDescription },
				}));
			}

			if (e.forms) {
				wrapper.appendChild(templates.flex({
					forms: e.forms,
				}));
			}
			if (e.labels || e.descriptions) {
				
				document.querySelector('title').innerText = getValueByLang(e, 'labels', e.title);
				let description = getValueByLang(e, 'descriptions', false);
				let hasDescription = description != false;
				if (!description) {
					description = await getAutodesc(id);
				}

				wrapper.appendChild(templates.ensign({
					revid: e.lastrevid,
					id: id,
					label: getValueByLang(e, 'labels', e.title),
					description: {
						text: description,
						provisional: !hasDescription
					},
				}));
			}

			wrapper.appendChild(templates.mojination([
				{
					link: 'add.html?' + id,
					moji: '➕',
					callback: (e) => {
						browser.runtime.sendMessage({
							type: 'open_adder',
							entity: id,
						});
					}
				},
				{
					link: '#nocache',
					moji: '🔄',
					callback: (e) => {
						location.hash = '#nocache';
						location.reload();
					}
				},
			]));

			let identifiers = document.createElement('div');
			let items = document.createElement('div');

			wrapper.appendChild(items);
			wrapper.appendChild(identifiers);
			content.appendChild(wrapper);

			if (e.claims || e.statements) {
				let statements = e.claims ? e.claims : e.statements;
				for (prop of groupClaims(statements)) {
					let statement = renderStatement(statements[prop]);
					if (statement) {
						if (statement.type !== "external-id") {
							items.appendChild(statement.rendered);
						} else {
							identifiers.appendChild(statement.rendered);
						}
					}
				}
			}
			for (let set of ['senses', 'forms']) {
				if (e[set]) {

					for (let thisSet of e[set]) {
						let setWrapper = document.createElement('div');
						setWrapper.setAttribute('id', thisSet.id);
						content.appendChild(setWrapper);
				    
				    let isPlaceholder = false;
				    for (let titleType of ['glosses', 'representations']) {
				    	let title = false;
				    	if (titleType === 'representations' && thisSet.representations) {
				    		let titleParts = [];
				    		for (let lang in thisSet.representations) {
				    			titleParts.push(thisSet.representations[lang].value);
				    			title = titleParts.join('/');
				    		}
				    	} else {
								title = getValueByLang(thisSet, titleType, false);
								if (!title && titleType === 'glosses' && thisSet.claims.P5137) {
									let descriptions = [];
								  for (item of thisSet.claims.P5137) {
								  	if (checkNested(item, 'mainsnak', 'datavalue', 'value', 'id')) {
								  		let itemId = item.mainsnak.datavalue.value.id;
								  		let itemEntity = await wikidataGetEntity(itemId);
								  		let description = getValueByLang(itemEntity[itemId], 'descriptions', false);
								  		if (description) {
								  			descriptions.push(description)
								  		}
								  	}
								  	title = descriptions.join(', ');
								  	isPlaceholder = true;
								  }
								}
				    	}
							if (title) {
								let headline = document.createElement('h2');
								headline.innerText = title;
								setWrapper.appendChild(headline);
								if (isPlaceholder) {
									headline.style.opacity = .75;
								}
							}
				    }

						let setEntity = await wikidataGetEntity(thisSet.id);

						for (let prop of groupClaims(setEntity[thisSet.id].claims)) {
							let statement = renderStatement(setEntity[thisSet.id].claims[prop]);
							setWrapper.appendChild(statement.rendered);
							
						}
					}
				}
			}
		}


		let footnotes = content.querySelectorAll('.footnote');

		let references = document.createElement('ol');

		let footnoteNumber = 1;
		Array.from(footnotes).reduce((k, footnote) => {
			let footnoteId = footnote.getAttribute('href').substr(1);
			let referenceItem = footnoteStorage[footnoteId].content;
			if (!footnoteStorage[footnoteId].number) {
				references.appendChild(referenceItem);
				footnoteStorage[footnoteId].number = footnoteNumber;
				footnoteNumber++;
			}
			footnote.innerText = footnoteStorage[footnoteId].number;
			content.appendChild(references);
			footnote.addEventListener('mouseover', () => {
				footnote.setAttribute('title', referenceItem.innerText);
			});
		}, 0);

		let whatLinksHere = document.createElement('div');
		content.appendChild(whatLinksHere);

		let referrers = await getRelatedItems(id);

		let reverseProps = {};
		for (let referrer of referrers) {
			let prop = referrer.prop.value.replace('http://www.wikidata.org/entity/', '');

			if (!reverseProps[prop]) {
				reverseProps[prop] = {
					more: 0,
				};
				let label = document.createDocumentFragment();
	
				label.appendChild(templates.placeholder({
					entity: referrer.prop.value.replace('http://www.wikidata.org/entity/', ''),
				}));
				label.appendChild(document.createElement('br'));
				label.appendChild(templates.placeholder({
					entity: id,
					type: 'em',
				}));
				reverseProps[prop].label = label;
				reverseProps[prop].values = [];
			}

			if (reverseProps[prop].values.length < 20) {
				reverseProps[prop].values.push(templates.placeholder({
					entity: referrer.item.value.replace('http://www.wikidata.org/entity/', ''),
				}));
			} else {
				reverseProps[prop].more++;
			}
		}

		for (let prop of Object.keys(reverseProps)) {
			if (reverseProps[prop].more > 0) {
				let queryMore = document.createElement('a');
				let query = `SELECT ?item ?itemLabel WHERE {
				  SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en". }
				  ?item wdt:${prop} wd:${id}.
				}`
				queryMore.setAttribute('href', 'https://query.wikidata.org/embed.html');
				queryMore.hash = encodeURIComponent(query);
				queryMore.innerText = '⋯';
				reverseProps[prop].values.push(queryMore);
			}
			let statement = templates.remark({
				prop: reverseProps[prop].label,
				vals: reverseProps[prop].values,
			});
			whatLinksHere.appendChild(statement);
		}

		resolvePlaceholders();

		let proxies = content.querySelectorAll('.proxy');

		Array.from(proxies).reduce((k, proxy) => {
			(async () => {
				let result = await sparqlQuery(proxy.getAttribute('data-query'));
				if (result[0] && result[0].hasOwnProperty('innerText')) {
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