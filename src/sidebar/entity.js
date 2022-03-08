import {getAutodesc} from './get-autodesc.js'
import {resolveBreadcrumbs, resolveIdLinksPlaceholder} from './resolve-placeholders.js'
import {getAliasesByLang, getValueByLang} from './get-value-by-lang.js'
import {templates} from './components/templates.tpl.js'
import {wikidataGetEntity} from '../wd-get-entity.js'
import {AddLemmaAffix} from './lemma-afixes.js'
import browser from 'webextension-polyfill'
import {PrependNav} from './prepend-nav.js'
import {getDeducedSenseClaims} from './deduce-sense-statements.js'
import * as ReactDOM from 'react-dom'
import {Claims} from './components/claims'
import {localLanguage} from '../core/env'
import {groupClaims} from "./group-claims"
import {ApplyFormatters} from "./formatters"
import {renderStatements} from "./render-claims"
import {delay} from "../core/async"

if (history.length > 1 || window != window.top) {
	PrependNav();
}

let cache = {}

function highlightWord(el, text) {
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

if (window.location.search) {
	let currentEntity = window.location.search.match(/^\?(\w\d+)/, '')[1];
	if (currentEntity.match(/[QMPL]\d+/)) {
		updateView(currentEntity, window.location.hash !== '#nocache');
	}
}

function createLemmaEnsign(entity) {
	let labels = document.createDocumentFragment()
	for (let lang in entity.lemmas) {
		let lemma = AddLemmaAffix(entity.lemmas[lang].value, {
			category: entity.lexicalCategory,
			lang: entity.language,
			gender: typeof entity.claims?.P5185 === 'object' ? entity.claims?.P5185[0]?.mainsnak?.datavalue?.value?.id : null,
		})

		if (labels.childNodes.length !== 0) {
			labels.appendChild(document.createTextNode(' ‧ '))
		}
		labels.appendChild(lemma)
	}

	let lexemeDescription = document.createDocumentFragment()

	lexemeDescription.appendChild(templates.placeholder({
		entity: entity.language,
	}, cache))

	lexemeDescription.appendChild(document.createTextNode(', '))

	lexemeDescription.appendChild(templates.placeholder({
		entity: entity.lexicalCategory,
	}, cache))

	return templates.ensign({
		revid: entity.lastrevid,
		id: entity.id,
		label: labels,
		description: {text: lexemeDescription},
	})
}

function createCanonicalMeta(id) {
	let metaCanon = document.createElement('meta')
	metaCanon.setAttribute('name', 'canonical')
	metaCanon.setAttribute('content', 'https://www.wikidata.org/wiki/' + id)
	return metaCanon
}

function createDescriptionMeta(description) {
	let metaDesc = document.createElement('meta')
	metaDesc.setAttribute('name', 'description')
	metaDesc.setAttribute('content', description)
	return metaDesc
}

function createKeywordsMeta(aliases) {
	let metaKeys = document.createElement('meta')
	metaKeys.setAttribute('name', 'keywords')
	metaKeys.setAttribute('content', aliases.join(', '))
	return metaKeys
}

function createTitleFragment(entity, initialDescription) {
	let titleFragment = document.createElement('div')
	let hasDescription = initialDescription !== false

	const setTitle = (description) => {
		if (titleFragment.firstChild) {
			titleFragment.removeChild(titleFragment.firstChild)
		}
		titleFragment.appendChild(templates.ensign({
			revid: entity.lastrevid,
			id: entity.id,
			label: getValueByLang(entity, 'labels', entity.title),
			description: {
				text: description,
				provisional: !hasDescription,
			},
		}))
	}

	setTitle(initialDescription)

	if (!hasDescription && 'claims' in entity && 'P31' in entity.claims) {
		(async () => {
			setTitle(await getAutodesc(entity.id))
		})()
	}
	return titleFragment
}

const createActionElements = id =>
	templates.actions('Actions', [
		{
			link: 'add.html?' + id,
			moji: './icons/u270Eu002B-addStatement.svg',
			title: 'Add a statement',
			desc: 'Extract data from this website',
			callback: (e) => {
				browser.runtime.sendMessage({
					type: 'open_adder',
					entity: id,
				})
			},
		},
		{
			link: '#nocache',
			moji: './icons/u2B6E-refresh.svg',
			title: 'Reload data',
			desc: 'Display an uncached version',
			callback: (e) => {
				location.hash = '#nocache'
				location.reload()
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
	])

const refCounter = {}

function createReferenceItem(ref) {
	let listItem
	const refvalues = []
	if (typeof refCounter[ref.hash] === 'undefined') {
		listItem = document.createElement('li')
		refCounter[ref.hash] = {
			item: listItem,
		}

		const formatted = ApplyFormatters(ref.snaks, 'reference')

		for (const key in formatted) {
			for (const refthing of formatted[key]) {
				if (refthing.datavalue) {
					const refvalue = new DocumentFragment()

					refvalue.append(...renderStatements(refthing, [], refthing.datavalue.type, 'reference', undefined, cache))
					refvalues.push(refvalue)
				}
			}
			if (key.match(/^P\d+/)) {
				const refStatement = templates.proof({
					prop: templates.placeholder({
						entity: key,
					}, cache),
					vals: refvalues,
				})
				listItem.appendChild(refStatement)
			} else {
				for (const refvalue of refvalues) {
					listItem.appendChild(refvalue)
				}
			}
		}
	} else {
		listItem = refCounter[ref.hash].item
	}
	listItem.setAttribute('id', ref.hash)
	return listItem
}

function collectFootnotes(statements) {
	const footnotes = statements
		.flatMap(it => it.claims)
		.filter(it => it?.mainsnak && it?.references)
		.flatMap(it => it.references)
		.map(ref =>
			[ref.hash, {content: createReferenceItem(ref)}],
		)
	return Object.fromEntries(footnotes)
}

function getHigherPriorityClaims(claims) {
	const hasPreferred = claims.find(it => it.rank == 'preferred')
	const highPriority = (it) => !hasPreferred && it.rank == 'normal' || it.rank == 'preferred'

	return claims.filter(highPriority)
}


const getStatementsToRender = statements =>
	groupClaims(statements).map(it => ({
		id: it.id,
		claims: getHigherPriorityClaims(it.claims),
	}))

async function renderFootnotes(content, footnoteStorage) {
	/**
	 * todo a better way
	 * the issue right now is that things are rendered asynchronously in React (via useEffect)
	 * and as footnote rendering relies on elements existing in the DOM,
	 * it'll fail to render
	 *
	 * delay(0) pushes this back to async queue, but this is likely not reliable
	 *
	 * one potential way to deal with this is to send event whe main claims are rendered
	 * another to have these both under react management
	 */
	await delay(0)
	let footnotes = content.querySelectorAll('.footnote')

	let references = document.createElement('ol')

	let footnoteNumber = 1
	Array.from(footnotes).reduce((k, footnote) => {
		let footnoteId = footnote.getAttribute('href').substr(1)
		let referenceItem = footnoteStorage[footnoteId].content
		if (!footnoteStorage[footnoteId].number) {
			references.appendChild(referenceItem)
			footnoteStorage[footnoteId].number = footnoteNumber
			footnoteNumber++
		}
		footnote.innerText = footnoteStorage[footnoteId].number
		content.appendChild(references)
		footnote.addEventListener('mouseover', () => {
			footnote.setAttribute('title', referenceItem.innerText)
		})
	}, 0)
}

function updateView(id, useCache = true) {
	let content = document.getElementById('content');

	let footer = document.getElementById('footer');
	content.innerHTML = '';
	(async () => {
		let entities = await wikidataGetEntity(id, useCache);
		cache = await browser.storage.local.get();

		for (let id of Object.keys(entities)) {
			let e = entities[id];

			let wrapper = document.createElement('div');

			if (e.lemmas) {
				wrapper.appendChild(createLemmaEnsign(e))
			}
			document.head.appendChild(createCanonicalMeta(id))

			if (e.labels || e.descriptions) {

				document.title = getValueByLang(e, 'labels', e.title)

				let description = getValueByLang(e, 'descriptions', false)

				if (!description) {
					description = '???';
				} else {
					document.head.appendChild(createDescriptionMeta(description))
				}
				let titleFragment = createTitleFragment(e, description)

				wrapper.appendChild(titleFragment);
			}

			let aliases = getAliasesByLang(e);
			if (aliases) {
				document.head.appendChild(createKeywordsMeta(aliases))
			}

			footer.appendChild(createActionElements(id))

			let identifiers = document.createElement('div');
			identifiers.className = 'identifiers'
			let items = document.createElement('div');
			items.className = 'items'
			let glosses = document.createElement('div');

			wrapper.appendChild(glosses);
			wrapper.appendChild(items);
			wrapper.appendChild(identifiers);
			content.appendChild(wrapper);

			if (e.claims || e.statements) {
				const statements = await enrichStatements(e.claims ? e.claims : e.statements);

				const statementsToRender = getStatementsToRender(statements)

				ReactDOM.render(<Claims statements={statementsToRender} renderingCache={cache}/>, items, )
				renderFootnotes(content, collectFootnotes(statementsToRender))
			}
			if (e['senses']) {
				const singleSense = e['senses'].length === 1;
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
							type: 'span',
							entity: senseTree[id].sense.claims.P5137[0].mainsnak.datavalue.value.id,
							desiredInner: 'descriptions',
						});
					}

					if (senseTree[id].sense?.claims?.P5137?.[0].mainsnak?.datavalue?.value?.id) {
						senseTree[id].item = senseTree[id].sense.claims.P5137[0].mainsnak.datavalue.value.id;
					} else if (senseTree[id].sense?.claims?.P9970?.[0].mainsnak?.datavalue?.value?.id) {
						senseTree[id].item = senseTree[id].sense.claims.P9970[0].mainsnak.datavalue.value.id;
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
							delete senseTree[id];
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

				if (!singleSense) {
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
							type: 'span',
						});
						heading.appendChild(headingText);
						section.appendChild(heading);

						for (let sid in senseProps[pid].claims) {
							for (let stid in senseProps[pid].claims[sid].claim) {
								let claim = senseProps[pid].claims[sid].claim[stid];
								if (claim?.mainsnak?.datavalue?.value) {
									let fileName = encodeURIComponent(claim?.mainsnak?.datavalue?.value);
									let senseSymbol = false;
									if (senseProps[pid].claims[sid].sense?.symbol) {
										senseSymbol = senseProps[pid].claims[sid].sense.symbol.cloneNode(true);
									}
									if (fileName.match(/\.(jpe?g|png|gif|tiff?)$/i)) {
										section.appendChild(templates.picture({
											srcSet: {
												250: `https://commons.wikimedia.org/wiki/Special:FilePath/${ fileName }?width=250px`,
												501: `https://commons.wikimedia.org/wiki/Special:FilePath/${ fileName }?width=501px`,
												801: `https://commons.wikimedia.org/wiki/Special:FilePath/${ fileName }?width=801px`,
												1068: `https://commons.wikimedia.org/wiki/Special:FilePath/${ fileName }?width=1068px`,
											},
											tag: senseSymbol,
										}));
									}

								}

							}
						}

						glosses.appendChild(section);
					} else if (senseProps[pid].datatype === 'wikibase-sense') {
						let section = document.createElement('section');
						let heading = document.createElement('h2');
						let headingText = templates.placeholder({
							entity: pid,
							type: 'span',
						});
						heading.appendChild(headingText);
						section.appendChild(heading);

						let translations = {};
						for (let sid in senseProps[pid].claims) {
							for (let stid in senseProps[pid].claims[sid].claim) {
								let claim = senseProps[pid].claims[sid].claim[stid];
								if (claim?.mainsnak?.datavalue?.value) {
									const senseId = claim.mainsnak.datavalue.value.id;
									const lexemeId = senseId.split('-')[0];
									const lexeme = await wikidataGetEntity(lexemeId);
									const lexemeLanguage = lexeme[lexemeId].language;
									if (!translations.hasOwnProperty(lexemeLanguage)) {
										translations[lexemeLanguage] = {};
									}
									if (!translations[lexemeLanguage].hasOwnProperty(sid)) {
										translations[lexemeLanguage][sid] = {
											symbol: senseProps[pid].claims[sid].sense?.symbol ?  senseProps[pid].claims[sid].sense.symbol.cloneNode(true) : false,
											senses: [],
										};
									}
									translations[lexemeLanguage][sid].senses.push(senseId);
								}
							}
						}

						section.appendChild(templates.rosetta(translations, e.language));

						glosses.appendChild(section);
					}
				}
				if (e.claims) {
					for (let cid in e.claims) {
						if(e.claims[cid]?.[0].mainsnak?.datatype === 'monolingualtext') {
							let section = document.createElement('section');
							let heading = document.createElement('h2');
							let headingText = templates.placeholder({
								entity: cid,
								type: 'span',
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
					}
				}
			}


			if (e.forms) {
				let section = document.createElement('section');
				let heading = document.createElement('h2');
				let headingText = templates.placeholder({
					json: `https://www.wikidata.org/w/api.php?action=parse&page=Translations:Help:Data_type/87/${(localLanguage())}&disableeditsection=true&format=json`,
					type: 'span',
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

				section.appendChild(templates.flex({
					forms: e.forms,
					category: e.lexicalCategory,
					lang: e.language,
					gender: typeof e.claims?.P5185 === 'object' ? e.claims?.P5185[0]?.mainsnak?.datavalue?.value?.id : null,
					auxVerb: typeof e.claims?.P5401 === 'object' ? e.claims?.P5401[0]?.mainsnak?.datavalue?.value?.id : null,
				}));

				glosses.appendChild(section);
			}
		}

		// Let react render main set of claims first
		await delay(0)

		resolveBreadcrumbs(cache)

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

