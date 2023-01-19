import {getAutodesc} from './get-autodesc.js'
import {resolveBreadcrumbs, resolveIdLinksPlaceholder, resolvePlaceholders} from './resolve-placeholders.js'
import {getAliasesByLang, getValueByLang} from './get-value-by-lang.js'
import {groupClaims} from './group-claims.js'
import {templates} from './components/templates.tpl.js'
import { wikidataGetEntity, commonsGetEntity } from '../wd-get-entity.js'
import {ApplyFormatters} from './formatters.js'
import {AddLemmaAffix} from './lemma-afixes.js'
import browser from 'webextension-polyfill'
import { PrependNav } from './prepend-nav.js';
import { rubifyLemma } from './rubifyLemma.js';
import { getDeducedSenseClaims } from './deduce-sense-statements.js';
import { initializeCache } from './cache.js';

initializeCache()
PrependNav();

const lang = navigator.language.substr(0,2);
const footnoteStorage = {};
let refCounter = {};

function highlightWord(el, text) {
	if (el.childNodes.length > 1) {
		// there already is a highlight for a different
		// representation. abort.
		return
	}
  let t = el.textContent;
  el.textContent = '';
  let idx, prev = 0;
  while((idx = t.indexOf(text, prev)) !== -1){
    el.append(t.slice(prev, idx));
    const mark = document.createElement('mark');
    mark.textContent = text;
    el.appendChild(mark);
    prev = idx + text.length;
  }
  el.append(t.slice(prev));
}

function checkNested(obj, level,	...rest) {
	if (obj === undefined) return false
	if (rest.length == 0 && obj.hasOwnProperty(level)) return true
	return checkNested(obj[level], ...rest)
}

function getCurrentEntity() {
	const seachRegex = /^\?(\w\d+)/
	if (window.location.search) {
		const currentEntity = window.location.search.match(seachRegex)[1]
		if (currentEntity?.match(/[QMPL]\d+/)) {
			return window.location.search.match(seachRegex, '')[1]
		}
	} else {
		return false
	}
}


const currentEntity = getCurrentEntity()
if (currentEntity) {
	updateView(currentEntity, window.location.hash !== '#nocache');
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
		.replace(/^(\d+)-(\d+)-00/, '$1-$2-01')
		+ 'Z';

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
		let text =	date.getFullYear().toString().slice(0, -1) + 'X';
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

function renderStatements(snak, references, type, target, scope, delta) {
	let valueType = snak?.datatype ? snak.datatype : snak?.datavalue?.type ;
	if (type === 'preformatted') {
		target.appendChild(snak.datavalue.value);
	}
	if (type === 'value' || scope === 'reference') {
		if (valueType === "time") {
			let date = dateToString(snak.datavalue.value);
			if (date) {
				target.appendChild(templates.time({
					text: date,
				}));
			}
		}
		if (valueType === "wikibase-item" || valueType === "wikibase-entityid" || valueType === "wikibase-lexeme" || valueType === "wikibase-form"	|| valueType === "wikibase-sense") {
			let vid = snak.datavalue.value.id;
			if (snak.datavalue.parents) {
				target.appendChild(templates.breadcrumbsPlaceholder(snak.datavalue.parents));
			}
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
			target.appendChild(templates.unitNumber({
				number: snak.datavalue.value.amount,
				unit: snak?.datavalue?.value?.unit,
			}));
		}
		if (valueType === "globe-coordinate" || valueType ===	'globecoordinate') {
			target.appendChild(templates.mercator({
				lat: snak.datavalue.value.latitude,
				lon: snak.datavalue.value.longitude,
				pre: snak.datavalue.value.precision,
				height: 500,
				width: 500,
				entity: getCurrentEntity(),
			}));
		}
		if (valueType === "monolingualtext") {
			target.appendChild(templates.title({
				text: snak.datavalue.value.text,
				lang: snak.datavalue.value.language
			}));
		}
		if (valueType === "commonsMedia") {
			let name = encodeURIComponent(snak.datavalue.value);
			if (name.match(/\.svg$/i)) {
				target.appendChild(templates.image({
					link: `https://commons.wikimedia.org/wiki/File:${ name }`,
					src: `https://commons.wikimedia.org/wiki/Special:FilePath/${ name }`
				}));
			} else if (name.match(/\.(jpe?g|png|gif|tiff?|stl)$/i)) {
				target.appendChild(templates.picture({
					link: `https://commons.wikimedia.org/wiki/File:${ name }`,
					srcSet: {
						250: `https://commons.wikimedia.org/wiki/Special:FilePath/${ name }?width=250px`,
						501: `https://commons.wikimedia.org/wiki/Special:FilePath/${ name }?width=501px`,
						801: `https://commons.wikimedia.org/wiki/Special:FilePath/${ name }?width=801px`,
						1068: `https://commons.wikimedia.org/wiki/Special:FilePath/${ name }?width=1068px`,
					}
				}));
			} else if (name.match(/\.(wav|og[ga])$/i)) {
				target.appendChild(templates.audio({
					src: `https://commons.wikimedia.org/wiki/Special:FilePath/${ name }`
				}));
			} else if (name.match(/\.webm$/i)) {
				target.appendChild(templates.video({
					poster: `https://commons.wikimedia.org/wiki/Special:FilePath/${ name }?width=801px`,
					src: `https://commons.wikimedia.org/wiki/Special:FilePath/${ name }`
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
		for (let reference of references) {
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
	if (valueType === "external-id" && snak.snaktype === "value") {
		target.appendChild(templates.idLinksPlaceholder(snak.property, snak.datavalue.value));
	}
	if (scope === 'statement' && typeof delta != 'undefined' && delta.hasOwnProperty('qualifiers')) {
		let qualifiers = [];
		for (let prop of Object.keys(delta.qualifiers)) {
			let qvalues = [];
			for (let qv of delta.qualifiers[prop]) {
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
		for (let delta of value) {
			if (delta.rank == "preferred") {
				hasPreferred = true;
			}
		}
		for (const [key, delta] of Object.entries(value)) {
			if (delta.rank == "deprecated" || (delta.rank == "normal" && hasPreferred)) {
				delete value[key];
			}
		}
		for (let delta of value) {
			if (delta && delta.hasOwnProperty('mainsnak') && delta.mainsnak) {
				let thisvalue = new DocumentFragment();
				let type = delta.mainsnak.snaktype;
				let refs = [];
				if (delta.references) {
					for (let ref of delta.references) {
						let listItem;
						let refvalues = [];
						if (typeof refCounter[ref.hash] === 'undefined') {
							listItem = document.createElement('li');
							refCounter[ref.hash] = {
								item: listItem,
							}

							let formatted = ApplyFormatters(ref.snaks, 'reference')


							for (let key in formatted) {
								for (let refthing of formatted[key]) {
									if (refthing.datavalue) {
										let refvalue = new DocumentFragment();

										renderStatements(refthing, [], refthing.datavalue.type, refvalue, 'reference');
										refvalues.push(refvalue);
									}
								}
								if (key.match(/^P\d+/)) {
									let refStatement = templates.proof({
										prop: templates.placeholder({
											entity: key,
										}),
										vals: refvalues,
									});
									listItem.appendChild(refStatement);
								} else {
									for (let refvalue of refvalues) {
										listItem.appendChild(refvalue)
									}
								}
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

				renderStatements(delta.mainsnak, refs, type, thisvalue, 'statement', delta);

				values.push(thisvalue);

			}
		}

		let statement = templates.remark({
			prop: templates.placeholder({
				entity: pid,
			}),
			vals: values,
			id: pid,
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

	let footer = document.getElementById('footer');
	content.innerHTML = '';
	(async () => {
		let entities = await wikidataGetEntity(id, useCache)

		for (let id of Object.keys(entities)) {
			let e = entities[id];

			let wrapper = document.createElement('div');

			if (e.lemmas) {
				let labels = document.createDocumentFragment();

				const ruby = rubifyLemma(e.lemmas)

				if (ruby.rubified) {
					labels.appendChild(ruby.rubified);
				}
				for (let lang in ruby.unrubified) {
					let lemma = AddLemmaAffix(e.lemmas[lang].value, {
						category: e.lexicalCategory,
						lang: e.language,
						gender: typeof e.claims?.P5185 === 'object' ? e.claims?.P5185[0]?.mainsnak?.datavalue?.value?.id : null,
					});

					if (labels.childNodes.length !== 0) {
						labels.appendChild(document.createTextNode(' ‧ '));
					}
					labels.appendChild(lemma);
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
					label: labels,
					description: { text: lexemeDescription },
				}));
			}


			let metaCanon = document.createElement('meta');
			metaCanon.setAttribute('name', 'canonical');
			metaCanon.setAttribute('content', 'https://www.wikidata.org/wiki/' + id);
			document.head.appendChild(metaCanon);

			const isMedia = e?.title?.startsWith('File:')
			
			if (isMedia) {
				const fileName = e.title.match(/^File:(.*)$/)[1].replace(/ /g, '_')
				if (fileName.match(/\.svg$/i)) {
					content.appendChild(templates.image({
						src: `https://commons.wikimedia.org/wiki/Special:FilePath/${ fileName }`
					}));
				} else if (fileName.match(/\.(jpe?g|png|gif|tiff?)$/i)) {
					const pictureVars = {
						srcSet: {
							140: `https://commons.wikimedia.org/wiki/Special:FilePath/${ fileName }?width=140px`,
							250: `https://commons.wikimedia.org/wiki/Special:FilePath/${ fileName }?width=250px`,
							280: `https://commons.wikimedia.org/wiki/Special:FilePath/${ fileName }?width=280px`,
							404: `https://commons.wikimedia.org/wiki/Special:FilePath/${ fileName }?width=404px`,
							501: `https://commons.wikimedia.org/wiki/Special:FilePath/${ fileName }?width=501px`,
							801: `https://commons.wikimedia.org/wiki/Special:FilePath/${ fileName }?width=801px`,
							1068: `https://commons.wikimedia.org/wiki/Special:FilePath/${ fileName }?width=1068px`,
						},
					}
					let picture = templates.picture(pictureVars)
					content.parentNode.insertBefore(picture, content)
				}
			}

			if (e.labels || e.descriptions) {

				document.title = getValueByLang(e, 'labels', e.title);
				let description = getValueByLang(e, 'descriptions', false);

				let hasDescription = description != false;
				let titleFragment = document.createElement('div');
				wrapper.appendChild(titleFragment);

				if (!description) {
					description = '???';
				} else {
					let metaDesc = document.createElement('meta');
					metaDesc.setAttribute('name', 'description');
					metaDesc.setAttribute('content', description);
					document.head.appendChild(metaDesc);
				}

				const setTitle = (description) => {
					if (titleFragment.firstChild) {
						titleFragment.removeChild(titleFragment.firstChild);
					}
					titleFragment.appendChild(templates.ensign({
						revid: e.lastrevid,
						id: id,
						label: getValueByLang(e, 'labels', e.title),
						description: !isMedia ? {
							text: description,
							provisional: !hasDescription
						} : {},
					}));
				}

				setTitle(description);

				if (!hasDescription && 'claims' in e && 'P31' in e.claims) {
					(async () => {
						description = await getAutodesc(id);
						setTitle(description);
					})()
				}
			}

			let aliases = getAliasesByLang(e);
			if (aliases) {
				let metaKeys = document.createElement('meta');
				metaKeys.setAttribute('name', 'keywords');
				metaKeys.setAttribute('content', aliases.join(', '));
				document.head.appendChild(metaKeys);
			}

			footer.appendChild(templates.actions('Actions', [
				{
					link: 'add.html?' + id,
					moji: './icons/u270Eu002B-addStatement.svg',
					title: 'Add a statement',
					desc: 'Extract data from this website',
					callback: (e) => {
						browser.runtime.sendMessage({
							type: 'open_adder',
							entity: id,
						});
					}
				},
				{
					link: '#nocache',
					moji: './icons/u2B6E-refresh.svg',
					title: 'Reload data',
					desc: 'Display an uncached version',
					callback: (e) => {
						location.hash = '#nocache';
						location.reload();
					},
				},
				{
					link: 'links.html?' + id,
					moji: './icons/u2BA9u1F4C4uFE0E-articleRedirect.svg',
					title: 'What links here',
					desc: 'A list of item that link to this',
				},
				{
					link: 'improve.html?' + id,
					moji: './icons/u2728-specialPages.svg',
					title: 'Improve',
					desc: 'Automatic suggestions on how to improve this item',
				},
				{
					link: `https://query.wikidata.org/embed.html#${encodeURIComponent(`
						#defaultView:Map
						SELECT ?item ?itemLabel ?property ?propertyLabel ?coord
						WHERE 
						{ 
							VALUES ?item { wd:${ id } }
							?item ?pred1 ?stat1 .
							?property wikibase:claim ?pred1 .
							?stat1 ?pred2 ?stat2 .
							?property wikibase:statementValue ?pred2 .
							?stat2 a wikibase:GlobecoordinateValue.
							?stat1 ?pred3 ?coord. 
							?property wikibase:statementProperty ?pred3 . 
							SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en". } 
						}
					`)}#wd:${ id }`,
					moji: './icons/u2728-specialPages.svg',
					title: 'Show on map',
					desc: 'Summerise geo coordinates in this item',
				},
			]));

			let identifiers = document.createElement('div');
			let items = document.createElement('div');
			let glosses = document.createElement('div');

			wrapper.appendChild(glosses);
			wrapper.appendChild(items);
			wrapper.appendChild(identifiers);
			content.appendChild(wrapper);

			if (e.claims || e.statements) {
				let statements = await enrichStatements(e.claims ? e.claims : e.statements);
				for (let prop of groupClaims(statements)) {
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
			if (e['senses']) {
				let senseTree = {};
				let senseFlat = {};
				let senseProps = {};
				for (let sense of e['senses']) {
					let id = sense.id;
					let newSense = {
						sense: sense,
						children: {},
						symbol: '',
						field: null,
						gloss: getValueByLang(sense, 'glosses', false),
					}
					senseTree[id] = newSense;
					senseFlat[id] = newSense;
					if (!senseTree[id].gloss && senseTree[id].sense?.claims?.P5137?.[0].mainsnak?.datavalue?.value?.id) {
						senseTree[id].gloss = templates.placeholder({
							tag: 'span',
							entity: senseTree[id].sense.claims.P5137[0].mainsnak.datavalue.value.id,
							desiredInner: 'descriptions',
						});
					}

					if (senseTree[id].sense?.claims?.P5137?.[0].mainsnak?.datavalue?.value?.id) {
						senseTree[id].item = senseTree[id].sense.claims.P5137[0].mainsnak.datavalue.value.id;
					} else if (senseTree[id].sense?.claims?.P9970?.[0].mainsnak?.datavalue?.value?.id) {
						senseTree[id].item = senseTree[id].sense.claims.P9970[0].mainsnak.datavalue.value.id;
					} else if (senseTree[id].sense?.claims?.P6271?.[0].mainsnak?.datavalue?.value?.id) {
						senseTree[id].item = senseTree[id].sense.claims.P6271[0].mainsnak.datavalue.value.id;
					}

					if (senseTree[id].sense?.claims?.P9488?.[0].mainsnak?.datavalue?.value?.id) {
						senseTree[id].field = senseTree[id].sense.claims.P9488[0].mainsnak.datavalue.value.id;
					}

					if (sense?.claims) {
						for (let cid in sense.claims) {
							if (!senseProps.hasOwnProperty(cid)) {
								senseProps[cid] = {
									datatype: sense.claims[cid][0].mainsnak.datatype,
									claims: {},
								};
							}
							senseProps[cid].claims[id] = {
								claim: sense.claims[cid],
								sense: senseTree[id],
							}
						}
					}
					senseProps = await getDeducedSenseClaims(senseProps, id, e.language, newSense);
				}

				for (let id in senseTree) {
					if (senseTree[id].sense?.claims?.P6593?.[0].mainsnak?.datavalue?.value?.id) {
						let parentSense = senseTree[id].sense.claims.P6593[0].mainsnak.datavalue.value.id;
						if (senseTree.hasOwnProperty(parentSense) && parentSense !== id) {
							senseTree[parentSense].children[id] = senseTree[id];
							delete senseTree[id]
						}
					}
				}

				const number2Letter = (i) => {
					const previousLetters = (i-1 >= 26 ? getColumnName(Math.floor(i-1 / 26) -1 ) : '');
					const lastLetter = 'abcdefghijklmnopqrstuvwxyz'[(i-1) % 26];
					return previousLetters + lastLetter;
				}

				let assignSymbols = (tree, parent = '') => {
					let counter = 0;
					for (let id in tree) {
						if (id === 'seeAlso') {
							tree[id].symbol = templates.symbol('⋮'); 
							continue;
						}
						counter++;
						let child = counter.toString();
						if (parent.length > 0) {
							child = number2Letter(counter);
						}
						let thisSymbol = `${parent}${child}`;
						tree[id].symbol = templates.symbol(thisSymbol, id);
						if (tree[id].children) {
							tree[id].children = assignSymbols(tree[id].children, thisSymbol);
						}
					}
					return tree;
				}

				if (e?.claims?.P5402) {
					const homographes = []
					for (const p of e.claims.P5402) {
						if (p?.mainsnak?.datavalue?.value?.id) {
							homographes.push(templates.placeholder({
								entity: p.mainsnak.datavalue.value.id,
							}))
						}
					}
					if (homographes.length > 0) {
						senseTree.seeAlso = {
							label: templates.placeholder({
								entity: 'P5402',
							}),
							lexemes: homographes,
						}
					}
				}

				if (Object.entries(senseTree).length > 1) {
					senseTree = assignSymbols(senseTree);
				}

				let root = templates.glossary(senseTree);
				glosses.appendChild(root);
				for (let pid in senseProps) {
					if (senseProps[pid].datatype === 'commonsMedia') {

						let section = document.createElement('section');
						let heading = document.createElement('h2');
						let headingText = templates.placeholder({
							entity: pid,
							tag: 'span',
						});
						heading.appendChild(headingText);
						section.appendChild(heading);

						for (let sid in senseProps[pid].claims) {
							for (let stid in senseProps[pid].claims[sid].claim) {
								let claim = senseProps[pid].claims[sid].claim[stid];
								if (claim?.mainsnak?.datavalue?.value) {
									let fileName = encodeURIComponent(claim?.mainsnak?.datavalue?.value);
										if (fileName.match(/\.(jpe?g|png|gif|tiff?)$/i)) {
										let senseSymbol = false;
										if (senseProps[pid].claims[sid].sense?.symbol) {
											senseSymbol = senseProps[pid].claims[sid].sense.symbol.cloneNode(true);
										}
										let caption = ''
										for (const captionQual of claim?.qualifiers?.P2096 ?? []) {
											if (captionQual?.datavalue?.value?.language == lang) {
												caption = captionQual.datavalue.value.text
											}
										}
										const pictureVars = {
											link: `https://commons.wikimedia.org/wiki/File:${ fileName }`,
											srcSet: {
												140: `https://commons.wikimedia.org/wiki/Special:FilePath/${ fileName }?width=140px`,
												250: `https://commons.wikimedia.org/wiki/Special:FilePath/${ fileName }?width=250px`,
												280: `https://commons.wikimedia.org/wiki/Special:FilePath/${ fileName }?width=280px`,
												404: `https://commons.wikimedia.org/wiki/Special:FilePath/${ fileName }?width=404px`,
												501: `https://commons.wikimedia.org/wiki/Special:FilePath/${ fileName }?width=501px`,
												801: `https://commons.wikimedia.org/wiki/Special:FilePath/${ fileName }?width=801px`,
												1068: `https://commons.wikimedia.org/wiki/Special:FilePath/${ fileName }?width=1068px`,
											},
											tag: senseSymbol,
											caption: caption,
										}
										let picture = templates.picture(pictureVars)
										section.appendChild(picture);
										
										(async () => {
											let media = await commonsGetEntity(fileName)
											if (media?.labels?.[lang]?.value && pictureVars.caption == '') {
												pictureVars.caption = media.labels[lang].value
											}
											
											const creators = document.createDocumentFragment()
											if (media?.statements?.P170) {
												for (const creator of media?.statements?.P170) {
													if (creators.childNodes.length > 0) {
														creators.appendChild(document.createTextNode(', '))
													}
													if (creator?.mainsnak?.datavalue?.value?.id) {
														creators.appendChild(templates.placeholder({entity: creator.mainsnak.datavalue.value.id}))
													} else {
														if (creator?.qualifiers?.P2699?.[0]?.datavalue?.value && creator?.qualifiers?.P2093?.[0]?.datavalue?.value) {
															const link = document.createElement('a')
															link.setAttribute('href', creator.qualifiers.P2699?.[0].datavalue.value)
															link.innerText = creator.qualifiers.P2093?.[0].datavalue.value
															creators.appendChild(link)
														}
													}
												}
											}
											if (creators.childNodes.length > 0) {
												pictureVars.creators = creators
											}

											if (media?.statements?.P275?.[0]?.mainsnak?.datavalue?.value) {
												const mediaId = media.statements.P275[0].mainsnak.datavalue.value.id
												pictureVars.licence = templates.proxy({
													query: `
														SELECT ?innerText WHERE {
															wd:${ mediaId } wdt:P1813 ?innerText.
														} order by asc(strlen(?innerText))`
												})
											}

											let improvedPicture = templates.picture(pictureVars)
											section.replaceChild(improvedPicture, picture)
										})()

									}

								}

							}
						}

						glosses.appendChild(section);
					} else if (senseProps[pid].datatype === 'wikibase-sense') {
						if (pid == 'P8471') {
							continue
						}
						let section = document.createElement('section');
						let heading = document.createElement('h2');
						let headingText = templates.placeholder({
							entity: pid,
							tag: 'span',
						});
						heading.appendChild(headingText);
						section.appendChild(heading);

						let translations = {};
						for (let sid in senseProps[pid].claims) {
							for (let stid in senseProps[pid].claims[sid].claim) {
								let claim = senseProps[pid].claims[sid].claim[stid];
								if (claim?.mainsnak?.datavalue?.value) {
									const senseId = claim.mainsnak.datavalue.value.id;
									const sense = {
										id: senseId,
									}
									const lexemeId = senseId.split('-')[0];
									const lexeme = await wikidataGetEntity(lexemeId);
									const lexemeLanguage = lexeme[lexemeId].language;
									const senseInfos = {
										'P10339': 'gender',
									}
									for (const name in senseInfos) {
										if (claim?.qualifiers?.[name]) {
											sense[senseInfos[name]] = [];
											for (const qualItem of claim.qualifiers[name]) {
												if (qualItem?.datavalue?.value?.id) {
													sense[senseInfos[name]].push(qualItem.datavalue.value.id)
												}
											}
										}
									}
									if (!translations.hasOwnProperty(lexemeLanguage)) {
										translations[lexemeLanguage] = {};
									}
									if (!translations[lexemeLanguage].hasOwnProperty(sid)) {
										translations[lexemeLanguage][sid] = {
											symbol: senseProps[pid].claims[sid].sense?.symbol ?  senseProps[pid].claims[sid].sense.symbol.cloneNode(true) : false,
											senses: [],
										};
									}
									// don't add the sense if it is already present in the statements
									// of this sence.
									if (translations?.[lexemeLanguage]?.[sid]?.senses?.find((element) => {
										return element.id == sense.id;
									})) {
										continue
									}
									translations[lexemeLanguage][sid].senses.push(sense);
								}
							}
						}

						section.appendChild(templates.rosetta(translations, e.language));

						glosses.appendChild(section);
					}
				}
				if (e.claims) {
					for (let cid in e.claims) {
						if(e.claims[cid]?.[0]?.mainsnak?.datatype === 'monolingualtext') {
							let section = document.createElement('section');
							let heading = document.createElement('h2');
							let headingText = templates.placeholder({
								entity: cid,
								tag: 'span',
							});
							heading.appendChild(headingText);
							section.appendChild(heading);
							for (let claim of e.claims[cid]) {
								if(claim?.mainsnak?.datavalue?.value?.text) {
									let quote = claim.mainsnak.datavalue.value.text;
									let lang = claim.mainsnak.datavalue.value.language;
									let bq = templates.blockquote(quote, lang);
									if (claim?.qualifiers?.P5830?.[0]?.datavalue?.value?.id) {
										for (let form of claim.qualifiers.P5830) {
											let subjectForm = form.datavalue.value.id;
											for (let fid in e.forms) {
												if (e.forms[fid]?.id === subjectForm) {
													for (let rep in e.forms[fid].representations) {
														if (e.forms[fid].representations[rep]) {
															let repString = e.forms[fid].representations[rep].value;
															highlightWord(bq, repString);

														}
													}
												}
											}
										}
									}
									if (claim?.qualifiers?.P6072?.[0]?.datavalue?.value?.id) {
										let subjectSense = claim.qualifiers.P6072;
										for (let sense of claim.qualifiers.P6072) {
											if(senseFlat.hasOwnProperty(sense.datavalue.value.id)) {
												if (senseFlat[sense.datavalue.value.id].symbol) {
													let symbol = senseFlat[sense.datavalue.value.id].symbol.cloneNode(true);
													bq.insertBefore(symbol, bq.firstChild);
													bq.insertBefore(document.createTextNode(' '), symbol.nextSibling);
												}
											}
										}
									}
									section.appendChild(bq);
								}
							}
							glosses.appendChild(section);
						}
						if (['P5238', 'P5191'].includes(cid)) {
							const parts = [];
							for (let part of e.claims[cid]) {
								if (part?.mainsnak?.datavalue?.value?.id) {
									let sortkey = part.qualifiers?.P1545?.[0]?.datavalue?.value ?? '';
									parts.push({
										element: templates.placeholder({ entity: part?.mainsnak?.datavalue?.value?.id }),
										order: sortkey, 
									})
								}
							}
							parts.sort((a,b) => a.order - b.order)

							let section = document.createElement('section');
							let heading = document.createElement('h2');
							let headingText = templates.placeholder({
								entity: cid,
								tag: 'span',
							});
							heading.appendChild(headingText);
							section.appendChild(heading);
							section.appendChild(templates.blender(parts, templates.placeholder({entity: id, tag: 'span'})));
							glosses.appendChild(section);
						}
					}
				}
			}

			if (e?.forms?.length > 0) {
				let section = document.createElement('section');
				let heading = document.createElement('h2');
				let headingText = templates.placeholder({
					json: `https://www.wikidata.org/w/api.php?action=parse&page=Translations:Help:Data_type/87/${lang}&disableeditsection=true&format=json`,
					tag: 'span',
					extractor: (input) => {
						if (input?.parse?.text?.['*']) {
							return input.parse.text['*'].replace(/<\/?[^>]+(>|$)/g, "").trim();
						} else {
							headingText.parentNode.removeChild(headingText);
						}
					}
				});
				heading.appendChild(headingText);
				section.appendChild(heading);

				const flex = templates.flex({
					forms: e.forms,
					category: e.lexicalCategory,
					lang: e.language,
					gender: typeof e.claims?.P5185 === 'object' ? e.claims?.P5185[0]?.mainsnak?.datavalue?.value?.id : null,
					auxVerb: typeof e.claims?.P5401 === 'object' ? e.claims?.P5401[0]?.mainsnak?.datavalue?.value?.id : null,
				});

				if (flex) {
					section.appendChild(flex);
				} else {
					let counter = 0;
					for (let form of e.forms) {
						if (counter > 0) {
							section.appendChild(
								document.createTextNode(', ')
							);
						}
						counter++;
						section.appendChild(
							templates.placeholder({
								entity: form.id,
							})
						);
					}
				}

				glosses.appendChild(section);
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

		resolvePlaceholders();
		resolveBreadcrumbs();

		resolveIdLinksPlaceholder();
	})();
}

browser.runtime.onMessage.addListener( async (data, sender) => {
	let thisTab = await browser.tabs.getCurrent();
	if (data.match || thisTab == sender.tab.id) {
		const result = await getEntityByAuthorityId(data.prop, data.id);
		updateView(result[0].item.value);
	}
});

let breadcrumbProperties = ['P31', 'P279', 'P1647', 'P171', 'P1074', 'P1889', 'P5137', 'P136'];

async function enrichStatements(statements) {
	for (let prop in statements) {
		for (let value of statements[prop]) {
			if (breadcrumbProperties.includes(prop)) {
			  if (value?.mainsnak?.datavalue?.value?.id) {
					let vid = value.mainsnak.datavalue.value.id;
					value.mainsnak.datavalue.parents = vid;
			  }
			}
		}
	}
	return statements;
}

