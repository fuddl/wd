import { templates } from "../templates.tpl.js";
import { requreStylesheet } from '../require-styleheet.js'

const locator = (vars) => { 
	requreStylesheet("components/locator/locator.css")

	const wrapper = document.createElement('details')
	wrapper.classList.add('locator')
	const legend = document.createElement('summary')
	const title = templates.placeholder({ entity: vars.prop, tag: 'span' })

	const intro = document.createElement('div')
	
	const updateIntro = () => {

		// clear all nodes that exist yet
		while (intro.firstChild) {
        intro.removeChild(intro.firstChild);
    }

		intro.appendChild(document.createTextNode('Expected from '))
		intro.appendChild(templates.placeholder({ entity: vars.expectedFromClass }))
		intro.appendChild(document.createTextNode('. '))
		
		if (vars.singleValue) {
			intro.appendChild(document.createTextNode('Is expected to have 1 value. '))
		}
		if (vars.existingIds.length > 0) {
			intro.appendChild(document.createTextNode(`Has ${vars.existingIds.length} values: `))
		} else if (vars.noValue) {
			intro.appendChild(document.createTextNode('Has been marked with '))
			const novalue = document.createElement('em')
			novalue.innerText = 'novalue.'
			intro.appendChild(novalue)
		} else {
			intro.appendChild(document.createTextNode('Has 0 values.'))
		}
		if (vars.existingIds.length > 0) {
			const list = document.createElement('ul')
			for (const id of vars.existingIds) {
				const listItem = document.createElement('li')
				listItem.appendChild(templates.code(id))
				list.appendChild(listItem)
			}
			intro.appendChild(list)
		}
	}
	wrapper.appendChild(intro)
	updateIntro()

	legend.appendChild(title)
	wrapper.appendChild(legend)

	const updateModifiers = () => {
		wrapper.open = !(vars.existingIds.length > 0) && !vars.noValue
		wrapper.classList.toggle('locator--satisfied', (vars.singleValue == true && vars.existingIds.length > 0))
		wrapper.classList.toggle('locator--no-apply', vars.noValue)
		wrapper.classList.toggle('locator--maybe-satisfied', vars.existingIds.length > 0)
	}
	updateModifiers()

	const autocompleteList = document.createElement('datalist')
	autocompleteList.setAttribute('id', vars.id)
	for (const keyword of vars.keywords) {
		const listItem = document.createElement('option')
		listItem.setAttribute('value', keyword)
		autocompleteList.appendChild(listItem)
	}
	wrapper.appendChild(autocompleteList)

	const searchField = document.createElement('input')
	searchField.setAttribute('type', 'search')
	searchField.setAttribute('list', vars.id)
	searchField.value = vars.keywords[0]
	const searchButton = document.createElement('button')
	searchButton.innerText = '🔎'
	searchButton.addEventListener('click', () => {
		if (vars.searchUrl) {
			window.open(
				vars.searchUrl.replace('$1', encodeURIComponent(searchField.value)),
				vars.id
			)
		} else {
			browser.search.query({
				text: `${searchField.value} site:${vars.url}`,
				disposition: 'NEW_TAB',
			});
		}
	})

	const searchBox = document.createElement('div')
	searchBox.appendChild(searchField)
	searchBox.appendChild(searchButton)

	wrapper.appendChild(searchBox)

	if (vars.existingIds.length === 0 && !vars.noValue) {
		const hasNoValue = document.createElement('button')
		hasNoValue.innerText = 'Add no value'
		wrapper.appendChild(hasNoValue)

		hasNoValue.addEventListener('click', async () => {
			let now = new Date()
			await browser.runtime.sendMessage({
				type: 'send_to_wikidata',
				data: [{
					"type": "set_claim",
					"subject": vars.subject,
					"verb": vars.prop,
					"object": null,
					"qualifiers": [{
						property: 'P585',
							"value": {
								"after": 0,
								"before": 0,
								"calendarmodel": "http://www.wikidata.org/entity/Q1985727",
								"precision": 11,
								"time": `+${ now.toISOString().substr(0,10) }T00:00:00Z`,
								"timezone": 0
						}
					}]
				}]
			})
		})
	}

	browser.runtime.onMessage.addListener(async msg => {
		if (msg.type == 'success_info') {
			if (
				(vars.subject == msg.data.subject) &&
				(vars.prop == msg.data.verb)
			) {
				if (msg.data.object === null) {
					vars.noValue = true
				} else {
					vars.existingIds.push(msg.data.object)
				}
				updateModifiers()
				updateIntro()
			}
		}
	})

	return wrapper
}

export { locator }