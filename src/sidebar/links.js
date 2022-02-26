import { getRelatedItems } from './get-related-items.js'
import { templates } from './components/templates.tpl.js'
import { resolvePlaceholders } from './resolve-placeholders.js'
import { PrependNav } from './prepend-nav.js'

PrependNav()

if (window.location.search) {
	let currentEntity = window.location.search.match(/^\?(\w\d+)/, '')[1]
	if (currentEntity.match(/[QMPL]\d+/)) {
		updateView(currentEntity, window.location.hash !== '#nocache')
	}
}


async function updateView(id, useCache = true) {
	let content = document.getElementById('content')
	let footer = document.getElementById('footer')

	let whatLinksHere = document.createElement('div')
	content.appendChild(whatLinksHere)

	let referrers = await getRelatedItems(id)

	let reverseProps = {}
	for (let referrer of referrers) {
		let prop = referrer.prop.value.replace('http://www.wikidata.org/entity/', '')

		if (!reverseProps[prop]) {
			reverseProps[prop] = {
				more: 0,
			}
			let label = document.createDocumentFragment()

			label.appendChild(templates.placeholder({
				entity: referrer.prop.value.replace('http://www.wikidata.org/entity/', ''),
			}))
			label.appendChild(document.createElement('br'))
			label.appendChild(templates.placeholder({
				entity: id,
				type: 'em',
			}))
			reverseProps[prop].label = label
			reverseProps[prop].values = []
		}

		if (reverseProps[prop].values.length < 20) {
			reverseProps[prop].values.push(templates.placeholder({
				entity: referrer.item.value.replace('http://www.wikidata.org/entity/', ''),
			}))
		} else {
			reverseProps[prop].more++
		}
	}
	for (let prop of Object.keys(reverseProps)) {
		if (reverseProps[prop].more > 0) {
			let queryMore = document.createElement('a')
			let query = `SELECT ?item ?itemLabel WHERE {
				SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en". }
				?item wdt:${prop} wd:${id}.
			}`
			queryMore.setAttribute('href', 'https://query.wikidata.org/embed.html')
			queryMore.hash = encodeURIComponent(query)
			queryMore.innerText = '⋯'
			reverseProps[prop].values.push(queryMore)
		}
		let statement = templates.remark({
			prop: reverseProps[prop].label,
			vals: reverseProps[prop].values,
		})
		whatLinksHere.appendChild(statement)
		resolvePlaceholders()
	}
}
