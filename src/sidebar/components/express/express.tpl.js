import { getValidStringLanguages, makeLanguageValid } from '../../../get-valid-string-languages.js'
import { wikidataGetEntity } from '../../../wd-get-entity.js'
import { getValueByLang } from '../../get-value-by-lang.js'
import { getAutodesc } from '../../get-autodesc.js'
import browser from 'webextension-polyfill'

const express = (vars) => {

	const supportedProperties = [
		'monolingualtext',
		'string',
		'wikibase-item',
		'wikibase-lexeme',
		'wikibase-property',
	]

	let wrapper = document.createElement('div')
	wrapper.classList.add('express')

	let main = document.createElement('div')
	main.classList.add('express__main')
	wrapper.appendChild(main)

	let autocomplete = document.createElement('ul')
	autocomplete.classList.add('express__autocomplete')

	let input = document.createElement('input')
	input.classList.add('express__pick')
	input.setAttribute('type', 'search')

	let desc = document.createElement('div')
	desc.classList.add('express__desc')

	const updateAutocomplete = async function(e) {
		let response = await fetch(`https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${e.target.value}&format=json&errorformat=plaintext&language=en&uselang=en&type=property`)
		response = await response.json()
		autocomplete.innerText = ''
		for (let suggestion of response.search) {
			let title = document.createElement('strong')
			title.innerText = suggestion.label
			let itemDesc = document.createElement('div')
			itemDesc.innerText = suggestion.description + ' ' + suggestion.datatype
			let item = document.createElement('li')
			item.classList.add('express__autocomplete-option')
			item.appendChild(title)
			item.appendChild(itemDesc)
			if (!supportedProperties.includes(suggestion.datatype)) {
				item.classList.add('express__autocomplete-option--unsupported')
				item.setAttribute('title', 'Data type not supported')
			} else {
				item.setAttribute('tabindex', '0')
				let activationEvent = () => {
					input.value = suggestion.label
					desc.innerText = suggestion.description
					wrapper.setAttribute('data-prop', suggestion.id)
					wrapper.setAttribute('data-datatype', suggestion.datatype)

					browser.storage.local.set({
						lastUsedProp:	{
							prop: suggestion.id,
							name: suggestion.label,
							desc: suggestion.description,
							datatype: suggestion.datatype,
						},
					})
					wrapper.dispatchEvent(new Event('change'))
					autocomplete.innerText = ''
				}
				item.addEventListener('click', activationEvent)
				item.addEventListener('keydown', (e) => {
					if (e.key === 'Enter') {
						activationEvent()
					}
				})
			}
			autocomplete.appendChild(item)
		}
	}

	input.addEventListener('keyup', updateAutocomplete)
	input.addEventListener('focus', updateAutocomplete)
	window.addEventListener('click', () => {
		if (event.target !== input || !autocomplete.contains(event.target)) {
			autocomplete.innerText = ''
		}
	})

	main.appendChild(input)

	let style = document.createElement('link')
	style.setAttribute('rel',	'stylesheet')
	style.setAttribute('href', 'components/express/express.css')

	wrapper.appendChild(style)

	main.appendChild(autocomplete)
	main.appendChild(desc);

	(async () => {
		let storage = await browser.storage.local.get('lastUsedProp')
		if (!storage.lastUsedProp) {
			let firstPropId = 'P527'
			let firstProp = await wikidataGetEntity(firstPropId)

			browser.storage.local.set({
				lastUsedProp:	{
					prop: firstPropId,
					name: getValueByLang(firstProp[firstPropId], 'labels', firstPropId),
					desc: getValueByLang(firstProp[firstPropId], 'descriptions', ''),
					datatype: firstProp[firstPropId].datatype,
				},
			})

			storage = await browser.storage.local.get('lastUsedProp')
		}
		desc.innerText = storage.lastUsedProp.desc
		input.value = storage.lastUsedProp.name
		wrapper.setAttribute('data-prop', storage.lastUsedProp.prop)
		wrapper.setAttribute('data-datatype', storage.lastUsedProp.datatype)
	})()

	let selection = document.createElement('div')
	selection.classList.add('express__selection')
	main.appendChild(selection)

	let options = document.createElement('details')
	options.classList.add('express__options')
	wrapper.appendChild(options)

	let composer = document.createElement('textarea')
	composer.classList.add('express__composer')
	composer.setAttribute('placeholder', 'Type here or select text in the page…')
	main.appendChild(composer)

	let languagePicker = document.createElement('select')
	languagePicker.classList.add('express__lang');
	(async () => {
		let response = await getValidStringLanguages()
		for (let key in response) {
			let option = document.createElement('option')
			option.setAttribute('value', response[key].code)
			option.innerText = response[key].code
			languagePicker.appendChild(option)
		}
	})()
	main.appendChild(languagePicker)

	let summary = document.createElement('summary')
	summary.innerText = 'Links on this page'
	options.appendChild(summary)

	wrapper.addEventListener('keydown', (e) => {
		let allOptions = autocomplete.querySelectorAll('[tabindex]')
		let currentIndex = 0
		if (allOptions) {
			currentIndex = Array.prototype.indexOf.call(allOptions, document.activeElement)
		}
		switch (e.key) {
			case 'ArrowUp':
				e.preventDefault()
				if (document.activeElement === autocomplete.firstChild) {
					input.focus()
				} else {
					allOptions.item(currentIndex - 1).focus()
				}
				break
			case 'ArrowDown':
				e.preventDefault()
				if (document.activeElement === input) {
					autocomplete.firstChild.focus()
				} else if (document.activeElement === autocomplete.lastChild) {
					input.focus()
				} else {
					allOptions.item(currentIndex + 1).focus()
				}
				break
		}
	})

	return {
		element: wrapper,
		selection: selection,
		options: options,
		composer: composer,
		languagePicker: languagePicker,
		loadingFinished: function() {
			progress.remove()
			input.focus()
		}
	}
}

const express__tag = (vars) => {
	let wrapper = document.createElement('label')
	wrapper.setAttribute('data-entity', vars.id)
	wrapper.classList.add('express__tag')

	let title = document.createElement('div')
	title.classList.add('express__tag__title')
	title.innerText = vars.id
	wrapper.appendChild(title)

	let description = document.createElement('small')
	description.innerText = '███████ ██████████'
	description.classList.add('express__tag__desc')
	wrapper.appendChild(description)

	wrapper.postProcess = async function () {
		let e = await wikidataGetEntity(vars.id)
		title.innerText = getValueByLang(e[vars.id], 'labels', vars.id)
		let desc =	getValueByLang(e[vars.id], 'descriptions', false)
		if (desc) {
			description.innerText = desc
		} else {
			description.style.opacity = .5
			description.innerText = await getAutodesc(vars.id)
		}
	}

	wrapper.toggle = function() {
		let enabled = wrapper.classList.toggle('express__tag--selected')
		if (enabled) {
			vars.dest.appendChild(wrapper)
			wrapper.setAttribute('data-selected', true)
		} else {
			vars.src.insertBefore(wrapper, vars.src.firstChild)
			wrapper.removeAttribute('data-selected', true)
		}
		vars.refresh()
	}

	wrapper.addEventListener('click', () => {
		wrapper.toggle()
	})

	return wrapper
}

export { express, express__tag }
