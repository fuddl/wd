import { templates } from './components/templates.tpl.js';
import { resolvePlaceholders } from './resolve-placeholders.js';
import { PrependNav } from './prepend-nav.js';
import { wikidataGetEntity } from '../wd-get-entity.js'
import { sparqlQuery } from "../sqarql-query.js";

const maxResults = 1500

PrependNav();

if (window.location.search) {
	let currentEntity = window.location.search.match(/^\?(\w\d+)/, '')[1];
	if (currentEntity.match(/[QMPL]\d+/)) {
		updateView(currentEntity, window.location.hash !== '#nocache');
	}
}

const renderTable = (container, data) => {

	const t = document.createElement('table')
	const h = document.createElement('thead')
	const ht = document.createElement('tr')
	const ht1 = document.createElement('th')
	ht1.innerText = 'Item'
	const ht2 = document.createElement('th')
	ht2.innerText = 'common statements'
	
	ht.appendChild(ht1)
	ht.appendChild(ht2)
	h.appendChild(ht)
	t.appendChild(h)

	const grouped = []
	for (const row of data) {
		if (!(row.item.value in grouped)) {
			grouped[row.item.value] = [{
				verb: row.prop.value,
				object: row.value.value,
			}]
		} else {
			grouped[row.item.value].push({
				verb: row.prop.value,
				object: row.value.value,
			})
		}
	}
	const groupedAndSorted = Object.entries(grouped).sort((a, b) => b[1].length - a[1].length)

	for (const group of groupedAndSorted) {
		if (group[1].length == 1) {
			continue
		}
		const g = document.createElement('tbody')
		const r = document.createElement('tr')
		const left = document.createElement('td')
		const right = document.createElement('td')
		right.appendChild(document.createTextNode(group[1].length))
		left.appendChild(templates.placeholder({ entity: group[0].split('/').pop() }))
		t.appendChild(g)
		g.appendChild(r)
		r.appendChild(left)
		r.appendChild(right)

		const t2 = document.createElement('tr')
		const td = document.createElement('td')
		const dl = document.createElement('dl')
		td.colSpan = 2
		g.appendChild(t2)
		t2.appendChild(td)
		td.appendChild(dl)
		// for (const statement of group[1]) {
		// 	const dt = document.createElement('dt')
		// 	dt.appendChild(templates.placeholder({ entity: statement.verb.split('/').pop() }))
		// 	const dd = document.createElement('dd')
		// 	dd.appendChild(templates.placeholder({ entity: statement.object.split('/').pop() }))
		// 	dl.appendChild(dt)	
		// 	dl.appendChild(dd)	
		// }

	}

	container.replaceChild(t, container.firstChild)
}

async function updateView(id, useCache = true) {
	let data = []
	let content = document.getElementById('content')
	content.appendChild(templates.bouncer());
	(async () => {
		let entities = await wikidataGetEntity(id, useCache)
		const claims = entities[id].claims
		const requestClaims = []
		for (const prop of Object.keys(claims)) {
			for (const value of claims[prop]) {
				if (value.mainsnak.datatype === 'wikibase-item') {
					requestClaims.push({
						verb: prop,
						object: value.mainsnak.datavalue.value.id,
					});
				}
			}
		}
		let query = `
			SELECT ?prop ?value ?count {
				${ requestClaims.map((claim) => 
				`{ 
					BIND (wdt:${ claim.verb } as ?prop)
					BIND (wd:${ claim.object } as ?value)
					{ SELECT (count(?item) as ?count) WHERE {
						?item wdt:${ claim.verb } wd:${ claim.object }.
					} }
					FILTER(?count > 1)
				}`
				).join(' UNION ') }
			} ORDER BY ?count
		`;

		const agenda = await sparqlQuery(query)

		let limitCounter = 0

		const mostObscureQuery = `
			SELECT ?item ?prop ?value {
				${ agenda.map((claim) => {
					limitCounter =+ claim.count.value
					if (limitCounter < maxResults) {
						return `
						{
							BIND (<${ claim.prop.value }> as ?prop)
							BIND (<${ claim.value.value }> as ?value)
							?item <${ claim.prop.value }> <${ claim.value.value }>.
						}`
					}
				}
				).filter(item => item !== undefined).join(' UNION ') }
			}
		`

	    data = await sparqlQuery(mostObscureQuery)

	    renderTable(content, data)
	})()

}
