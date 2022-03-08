import {templates} from './components/templates.tpl'
import {filterNotEmpty} from '../core/collections'
import {ApplyFormatters} from './formatters'
import {localLanguage} from '../core/env'

const cache = {} //todo broken now!!

const lang = localLanguage()


function dateToString(value) {
	const wiso = value.time
	const prec = value.precision

	if (prec <= 6) {
		return false
	}

	const suffix = wiso.startsWith('-') ? ' BCE' : ''

	const pad = function (i) {
		if (i < 10) {
			return '0' + i
		}
		return i
	}

	const iso = wiso
		.replace(/^(\+|-)/, '')
		.replace(/Z$/, '')
		.replace(/^(\d+)-00/, '$1-01')
		.replace(/^(\d+)-(\d+)-00/, '$1-$2-01')
		+ 'Z'

	const date = new Date(iso)

	const output = []
	if (prec === 7) {
		const text = date.getFullYear().toString().slice(0, -2) + 'XX' + suffix
		return templates.proxy({
			query: `
				SELECT ?innerText WHERE {
					?century wdt:P31 wd:Q578.
					?century wdt:P585 "${iso}Z"^^xsd:dateTime.
					SERVICE wikibase:label
					{
						bd:serviceParam wikibase:language "[AUTO_LANGUAGE],${lang}".
						?century rdfs:label ?innerText.
					}
				}
				LIMIT 1`,
			text: text,
		})
	} else if (prec === 8) {
		const text = date.getFullYear().toString().slice(0, -1) + 'X'
		return templates.proxy({
			query: `
				SELECT ?innerText WHERE {
					?decade wdt:P31 wd:Q39911.
					?decade wdt:P585 "${iso}Z"^^xsd:dateTime.
					SERVICE wikibase:label
					{
						bd:serviceParam wikibase:language "[AUTO_LANGUAGE],${lang}".
						?decade rdfs:label ?innerText.
					}
				}
				LIMIT 1`,
			text: text,
		})
	} else {
		if (prec > 8) {
			output.push(date.getUTCFullYear())
		}
		if (prec > 9) {
			output.push(pad(date.getUTCMonth() + 1))
		}
		if (prec > 10) {
			output.push(pad(date.getUTCDate()))
		}
	}

	return document.createTextNode(output.join('-') + suffix)
}

function renderReferences(references) {
	const sup = document.createElement('sup')
	let c = 0
	for (const reference of references) {
		if (c > 0) {
			sup.appendChild(document.createTextNode('/'))
		}
		sup.appendChild(reference)
		c++
	}

	return filterNotEmpty([
		document.createTextNode('\xa0'),
		sup.hasChildNodes() ? sup : null,
	])
}

function renderQualifiers(scope, delta) {
	if (!(scope === 'statement' && typeof delta != 'undefined' && delta.hasOwnProperty('qualifiers'))) {
		return []
	}

	const qualifiers = []
	for (const prop of Object.keys(delta.qualifiers)) {
		const qvalues = []
		for (const qv of delta.qualifiers[prop]) {
			const qualvalue = new DocumentFragment()
			qualvalue.append(...renderStatements(qv, [], qv.snaktype, 'qualifier', undefined))
			qvalues.push(qualvalue)
		}

		qualifiers.push({
			prop: templates.placeholder({entity: prop}),
			vals: qvalues,
		})
	}

	return [templates.annote(qualifiers)]
}

function renderIdLinks(valueType, snak) {
	if (valueType === 'external-id' && snak.snaktype === 'value') {
		return [templates.idLinksPlaceholder(snak.property, snak.datavalue.value)]
	}

	return []
}

function renderStatementCore(snak, type, scope, valueType) {
	if (type === 'preformatted') {
		return [snak.datavalue.value]
	}
	if (type === 'value' || scope === 'reference') {
		if (valueType === 'time') {
			const date = dateToString(snak.datavalue.value)
			if (date) {
				return [templates.time({
					text: date,
				})]
			}
		}
		if (valueType === 'wikibase-item' || valueType === 'wikibase-entityid' || valueType === 'wikibase-lexeme' || valueType === 'wikibase-form' || valueType === 'wikibase-sense') {
			const vid = snak.datavalue.value.id
			return filterNotEmpty([
				snak.datavalue.parents ? templates.breadcrumbsPlaceholder(snak.datavalue.parents) : null,
				templates.placeholder({entity: vid}, cache),
			])
		}
		if (valueType === 'external-id') {
			return [templates.code(snak.datavalue.value)]
		}
		if (valueType === 'string') {
			return [document.createTextNode(snak.datavalue.value)]
		}
		if (valueType === 'url') {
			return [templates.urlLink(snak.datavalue.value)]
		}
		if (valueType === 'quantity') {
			return [templates.unitNumber({
				number: snak.datavalue.value.amount,
				unit: snak?.datavalue?.value?.unit,
			})]
		}
		if (valueType === 'globe-coordinate' || valueType === 'globecoordinate') {
			return [templates.mercator({
				lat: snak.datavalue.value.latitude,
				lon: snak.datavalue.value.longitude,
				pre: snak.datavalue.value.precision,
				height: 500,
				width: 500,
			})]
		}
		if (valueType === 'monolingualtext') {
			return [templates.title({
				text: snak.datavalue.value.text,
				lang: snak.datavalue.value.language,
			})]
		}
		if (valueType === 'commonsMedia') {
			const name = encodeURIComponent(snak.datavalue.value)
			if (name.match(/\.svg$/i)) {
				return [templates.image({
					src: `https://commons.wikimedia.org/wiki/Special:FilePath/${name}`,
				})]
			} else if (name.match(/\.(jpe?g|png|gif|tiff?|stl)$/i)) {
				return [templates.picture({
					srcSet: {
						250: `https://commons.wikimedia.org/wiki/Special:FilePath/${name}?width=250px`,
						501: `https://commons.wikimedia.org/wiki/Special:FilePath/${name}?width=501px`,
						801: `https://commons.wikimedia.org/wiki/Special:FilePath/${name}?width=801px`,
						1068: `https://commons.wikimedia.org/wiki/Special:FilePath/${name}?width=1068px`,
					},
				})]
			} else if (name.match(/\.(wav|og[ga])$/i)) {
				return [templates.audio({
					src: `https://commons.wikimedia.org/wiki/Special:FilePath/${name}`,
				})]
			} else if (name.match(/\.webm$/i)) {
				return [templates.video({
					poster: `https://commons.wikimedia.org/wiki/Special:FilePath/${name}?width=801px`,
					src: `https://commons.wikimedia.org/wiki/Special:FilePath/${name}`,
				})]
			}
		}
	} else if (type === 'novalue') {
		return [document.createTextNode('—')]
	} else if (type === 'somevalue') {
		return [document.createTextNode('?')]
	}
	return []
}

export function renderStatements(snak, references, type, scope, delta) {
	const valueType = snak.datatype ? snak.datatype : snak.datavalue.type
	return [
		...renderStatementCore(snak, type, scope, valueType),
		...renderReferences(references),
		...renderIdLinks(valueType, snak),
		...renderQualifiers(scope, delta),
	]
}



export interface Claim {
	rank: 'deprecated' | 'normal' | 'preferred'
	mainsnak: any
	references: any
	type: string
	// todo improve
}

export function renderStatement(claims: Claim[]) {
	if (!claims[0]?.mainsnak) return

	const pid = claims[0].mainsnak.property
	const values = []
	for (const delta of claims) {
		if (delta?.mainsnak) {
			const thisvalue = new DocumentFragment()
			const type = delta.mainsnak.snaktype
			const refs = []
			if (delta.references) {
				for (const ref of delta.references) {
					refs.push(templates.footnoteRef({
						text: '▐',
						link: '#' + ref.hash,
					}))
				}
			}

			thisvalue.append(...renderStatements(delta.mainsnak, refs, type, 'statement', delta))
			values.push(thisvalue)

		}
	}
	const statement = templates.remark({
		prop: templates.placeholder({
			entity: pid,
		}, cache),
		vals: values,
		id: pid,
	})
	const firstValue = claims.find(x => x !== undefined)
	if (firstValue) {
		return {
			rendered: statement,
			type: firstValue.mainsnak.snaktype,
		}
	}
}
