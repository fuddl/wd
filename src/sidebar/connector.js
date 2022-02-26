import {wikidataGetEntity} from '../wd-get-entity.js'
import {getTokens} from './wd-get-token.js'
import {templates} from './components/templates.tpl.js'
import {constraintsToStatements} from './constraintsToStatements.js'
import {ldToStatements} from './ldToStatements.js'
import {metaToStatements} from './metaToStatements.js'
import browser from 'webextension-polyfill'
import {Browser} from '../core/browser'

class jobRedundancyChecker {
	constructor() {
		this.list = []
	}
	check(job) {
		let hash = JSON.stringify(job)
		if (this.list.includes(hash)) {
			return true
		} else {
			this.list.push(hash)
			return false
		}
	}
	debug() {
		console.debug(this.list)
	}
}

function getPropertyScope(property) {
	let scopes = {
		'Q54254515': 'lexeme',
	}
	if (property.claims.P31) {
		for (let instanceOf of property.claims.P31) {
			if (instanceOf.mainsnak.datavalue.value.id) {
				if (scopes[instanceOf.mainsnak.datavalue.value.id]) {
					return scopes[instanceOf.mainsnak.datavalue.value.id]
				}
			}
		}
	}
	return 'item'
}


let existing = new jobRedundancyChecker();

(async () => {
	let proposals = JSON.parse(decodeURIComponent(window.location.search.replace(/^\?/, '')))

	let content = document.getElementById('content')
	let propPreview
	let connectorProp
	let propform = document.createElement('form')
	let preview = document.createDocumentFragment()
	let isMultiple = false
	content.appendChild(propform)
	let scope = 'item'
	let currentTab = await Browser.getCurrentTabIdForAllContexts()

	const isProp = proposals.ids[0][0].hasOwnProperty('prop')
	const isSitelink = proposals.ids[0][0].hasOwnProperty('sitelink')

	if (isProp) {
		isMultiple = typeof proposals.ids[0][0].prop !== 'string'
		connectorProp = !isMultiple ? proposals.ids[0][0].prop : proposals.ids[0][0].prop[0]
		let property = !isMultiple ? await wikidataGetEntity(proposals.ids[0][0].prop) : null

		scope = !isMultiple ? getPropertyScope(property[proposals.ids[0][0].prop]) : 'item'

		if (!isMultiple) {
			propPreview = templates.placeholder({
				entity: proposals.ids[0][0].prop,
			})
		} else {
			propPreview = document.createElement('select')
			let emptyOption = document.createElement('option')
			propPreview.appendChild(emptyOption)
			for (let prop of proposals.ids[0][0].prop) {
				let option = templates.placeholder({
					tag: 'option',
					entity: prop,
					type: 'option',
				})
				option.setAttribute('value', prop)

				propPreview.appendChild(option)
			}
			propPreview.addEventListener('change', function(event) {
				connectorProp = event.target.value
				propPreview.removeChild(emptyOption)
			})
		}
		preview = templates.remark({
			prop: propPreview,
			vals: [templates.code(proposals.ids[0][0].value)],
		})
		if (proposals.ld) {
			await ldToStatements(proposals.ld, propform, proposals.source, existing)
		}

		if (proposals.meta) {
			await metaToStatements(proposals.meta, propform, proposals.source, existing)
		}

		if(!isMultiple && property[proposals.ids[0][0].prop]?.claims?.P2302) {
			constraintsToStatements(proposals.ids[0][0].prop, property[proposals.ids[0][0].prop].claims.P2302, propform)
		}
	} else if (isSitelink) {
		preview = templates.remark({
			prop: document.createTextNode(`Add sitelink ${proposals.ids[0][0].sitelink}`),
			vals: [templates.code(proposals.ids[0][0].value)],
		})
	}

	propform.appendChild(preview)


	let labelField = templates.join({
		human: proposals.titles[0],
		scope: scope,
		id: 'joiner',
	})
	let direction = templates.direction()

	content.appendChild(direction)

	content.appendChild(labelField)

	let saveButton = document.createElement('button')
	saveButton.setAttribute('disabled', 'disabled')
	saveButton.innerText = 'Connect to Wikidata'


	let form = document.createElement('div')
	form.classList.add('submit-actions')
	form.appendChild(saveButton)
	content.appendChild(form)

	let selectedEntity = ''

	var observer = new MutationObserver(function(mutations) {
		mutations.forEach(function(mutation) {
			if (mutation.type == 'attributes') {
				if (labelField.hasAttribute('data-selected-entity')) {
					saveButton.removeAttribute('disabled')
					selectedEntity = labelField.getAttribute('data-selected-entity')
				}
			}
		})
	})

	observer.observe(labelField, {
		attributes: true,
	})

	saveButton.addEventListener('click', async function() {
		if (selectedEntity && !saveButton.hasAttribute('disabled')) {
			saveButton.setAttribute('disabled', 'disabled')

			let jobs = []

			if (selectedEntity === 'CREATE') {
				let lang = navigator.language.substr(0,2)
				jobs.push({
					type: 'create',
					label: labelField.getAttribute('data-selected-label'),
					lang: lang,
					fromTab: proposals.fromTab,
					fromUrl: proposals.source.url,
				})
				selectedEntity = 'LAST'
			}

			if (isProp) {

				let now = new Date()

				jobs.push({
					type: 'set_claim',
					subject: selectedEntity,
					verb: connectorProp,
					object: proposals.ids[0][0].value,
					fromTab: currentTab,
					references: [{
						'P854': [{
							'snaktype': 'value',
							'property': 'P854',
							'datavalue': {
								'value': proposals.source.url,
								'type': 'string'
							},
							'datatype': 'url'
						}],
						'P1476': [{
							'snaktype': 'value',
							'property': 'P1476',
							'datavalue': {
								'value': {
									'text': proposals.source.title.trim(),
									'language': proposals.source.lang ? proposals.source.lang : 'zxx',
								},
								'type': 'monolingualtext'
							},
							'datatype': 'string'
						}],
						'P813': [{
							'snaktype': 'value',
							'property': 'P813',
							'datavalue': {
								'type': 'time',
								'value': {
									'after': 0,
									'before': 0,
									'calendarmodel': 'http://www.wikidata.org/entity/Q1985727',
									'precision': 11,
									'time': `+${ now.toISOString().substr(0,10) }T00:00:00Z`,
									'timezone': 0
								}
							}
						}]
					}],
				})
			}

			if (isSitelink) {
				jobs.push({
					type: 'set_sitelink',
					subject: selectedEntity,
					verb: proposals.ids[0][0].sitelink,
					object: proposals.ids[0][0].value,
					fromTab: currentTab,
				})
			}

			const formData = new FormData(propform)
			for (let pair of formData.entries()) {
				if (pair[1] != '') {
				 	let job = JSON.parse(pair[1])
				 	if (!job.subject) {
				 		job.subject = selectedEntity
				 	}
			 		job.fromTab = currentTab
				 	jobs.push(job)
				}
			}

			browser.runtime.sendMessage({
				type: 'send_to_wikidata',
				data: jobs,
			})

			browser.runtime.sendMessage({
				type: 'wait',
				tid: currentTab,
			})
		}
	})
	let token = await getTokens()
	if (token === '+\\') {
		let warning = document.createElement('p')

		warning.style['background-color'] = '#ffe5e5'
		warning.style['color'] = 'red'
		warning.style['padding'] = '1em'

		let text1 = document.createTextNode(`
			It appears that you are not logged into a wikidata account. Please note
			that some of your edits might fail, because of wikidata's spam protection.
			Also note that your public IP address will be publicly visible in the edit
			history. It is strongly advised that you `)
		warning.appendChild(text1)

		let loginLink = document.createElement('a')
		loginLink.innerText = ' log in '
		loginLink.setAttribute('href', 'https://www.wikidata.org/wiki/Special:UserLogin')
		warning.appendChild(loginLink)

		let text2 = document.createTextNode(' or ')
		warning.appendChild(text2)

		let createAccountLink = document.createElement('a')
		createAccountLink.innerText = ' create an account '
		createAccountLink.setAttribute('href', 'https://www.wikidata.org/wiki/Special:CreateAccount')
		warning.appendChild(createAccountLink)

		let text3 = document.createTextNode(`
			. Among other benefits, your edits will be attributed to a user name.
		`)
		warning.appendChild(text3)

		content.insertBefore(warning, labelField)
	}
})()
