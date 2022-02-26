import { templates } from './components/templates.tpl.js'

const formatters = {
	textLink: {
		scopes: ['reference'],
		requiredProperties: ['P854', 'P1476'],
		format: (snaks) => {
			let url = snaks['P854'][0].datavalue?.value
			let title = snaks['P1476'][0].datavalue?.value?.text
			let lang = snaks['P1476'][0].datavalue?.value?.language
			let section = snaks['P958'] ? snaks['P958'][0].datavalue?.value : false
			let urlParts = [url]

			delete snaks['P854']
			delete snaks['P1476']

			if (section) {
				urlParts = url.split('#')
				delete snaks['P958']
			}


			let frag = document.createDocumentFragment()
			if (url && title) {
				const link = templates.link(urlParts[0], title, lang)

				frag.appendChild(link)

				if (section) {
					frag.appendChild(document.createTextNode(' → '))
					let sectionLink = templates.link(urlParts.join('#'), section, lang)
					frag.appendChild(sectionLink)
				}

				const newSnack = [{
					datavalue: {
						value: frag,
						type: 'preformatted',
					}
				}]

				return {newSnack, ...snaks}
			}
			return snaks
		}
	},
	blockquote: {
		scopes: ['reference'],
		requiredProperties: ['P1683'],
		format: (snaks) => {
			let text = snaks['P1683'][0].datavalue?.value?.text
			let lang = snaks['P1683'][0].datavalue?.value?.language

			delete snaks['P1683']

			if (text) {
				const blockquote = [{
					datavalue: {
						value: templates.blockquote(text, lang),
						type: 'preformatted',
					}
				}]
				return {...snaks, blockquote}
			}
			return snaks
		}
	}
}

function hasAllProperties(obj, props) {
	for (const prop of props) {
		if (!obj.hasOwnProperty(prop)) {
			return false
		}
	}
	return true
}

const ApplyFormatters = function (snaks, scope) {
	for (const key in formatters) {
		if (formatters[key].scopes.includes(scope)) {
			if (hasAllProperties(snaks, formatters[key].requiredProperties)) {
				snaks = formatters[key].format(snaks)
			}
		}
	}
	return snaks
}

export { ApplyFormatters }
