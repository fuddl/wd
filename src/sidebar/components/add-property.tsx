import './express/express.css'
import * as browser from 'webextension-polyfill'
import {useEffect, useRef, useState} from 'react'

interface Suggestion {
	id: string
	datatype: string
	label: string
	description: string
}

//todo move
export function useComponentVisible(ref, initialIsVisible = false) {
	const [isComponentVisible, setIsComponentVisible] = useState(initialIsVisible)
	// const ref = useRef(null)

	const handleClickOutside = (event) => {
		if (ref.current && !ref.current.contains(event.target)) {
			setIsComponentVisible(false)
		}
	}

	useEffect(() => {
		document.addEventListener('click', handleClickOutside, true)
		return () => {
			document.removeEventListener('click', handleClickOutside, true)
		}
	}, [])

	return [isComponentVisible, setIsComponentVisible]
}

export const AddProperty = () => {
	const [suggestions, setSuggestions] = useState<Array<Suggestion>>([])
	const [searchString, setSearchString] = useState('')
	const [selectedDescription, setSelectedDescription] = useState('')
	const autoCompleteRef = useRef(null)
	const [showSuggestions, setShowSuggestions] = useComponentVisible(autoCompleteRef, false)

	const updateAutocomplete = async function (e) {
		setSearchString(e.target.value)
		setShowSuggestions(true)

		const response = await fetch(`https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${e.target.value}&format=json&errorformat=plaintext&language=en&uselang=en&type=property`)
		const result = await response.json()
		console.log(result)
		if (result.search) setSuggestions(result.search)
	}

	// todo hide suggestion on blur
	return <div className="express">
		<div className="express__main" ref={autoCompleteRef}>
			<input
				type="search"
				value={searchString}
				className="express__pick"
				onChange={updateAutocomplete}
				onFocus={updateAutocomplete}
			/>

			{showSuggestions &&
				<ul
					className="express__autocomplete"
					onBlur={() => setShowSuggestions(false)}
				>
					{suggestions.map(it =>
						<li key={it.id}
							className="express__autocomplete-option"

							onClick={() => {
								setSearchString(it.label)
								setSelectedDescription(it.description)
								setShowSuggestions(false)
							}}
						>
							<strong className="express__autocomplete__label">{it.label}</strong>
							<div
								className="express__autocomplete__description">{it.description + ' ' + it.datatype}</div>
						</li>)}
				</ul>}
			<div className="express__desc">{selectedDescription}</div>
		</div>
	</div>
}


// const updateAutocompleteO = async function (e) {
// 	let response = await fetch(`https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${e.target.value}&format=json&errorformat=plaintext&language=en&uselang=en&type=property`)
// 	response = await response.json()
// 	for (const suggestion of response.search) {
//
// 		const item = document.createElement('li')
// 		if (!supportedProperties.includes(suggestion.datatype)) {
// 			item.classList.add('express__autocomplete-option--unsupported')
// 			item.setAttribute('title', 'Data type not supported')
// 		} else {
// 			item.setAttribute('tabindex', '0')
// 			const activationEvent = () => {
// 				wrapper.setAttribute('data-prop', suggestion.id)
// 				wrapper.setAttribute('data-datatype', suggestion.datatype)
//
// 				browser.storage.local.set({
// 					lastUsedProp: {
// 						prop: suggestion.id,
// 						name: suggestion.label,
// 						desc: suggestion.description,
// 						datatype: suggestion.datatype,
// 					},
// 				})
// 				wrapper.dispatchEvent(new Event('change'))
// 			}
// 			item.addEventListener('keydown', (e) => {
// 				if (e.key === 'Enter') {
// 					activationEvent()
// 				}
// 			})
// 		}
// 	}
// }

const supportedProperties = [
	'monolingualtext',
	'string',
	'wikibase-item',
	'wikibase-lexeme',
	'wikibase-property',
]
