import { getExpectedProps } from './expectedProps.js'
import { PrependNav } from './prepend-nav.js'
import { templates } from "./components/templates.tpl.js"
import { wikidataGetEntity } from '../wd-get-entity.js'

PrependNav()

let bouncer = templates.bouncer();

if (window.location.search) {
	let currentEntity = window.location.search.match(/^\?(\w\d+)/, '')[1];
	if (currentEntity.match(/[QMPL]\d+/)) {
		( async()=> {

			document.body.appendChild(bouncer)

			browser.runtime.sendMessage({
				type: 'lock_sidebar',
			});

			const entities = await wikidataGetEntity(currentEntity, false, false, true)

			bouncer.remove()
			const stage = document.getElementById('content')
			for (let id of Object.keys(entities)) {
				const expectedProps = await getExpectedProps(entities[id])
				
				stage.appendChild(expectedProps)
			}
		})()
	}
}
