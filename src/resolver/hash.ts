import {Resolver} from './types'

const hash: Resolver = {
	id: 'hash',
	async applicable(location) {
		return location.hash.match(/#wd:[QMPL]\d+/) !== null
	},
	async getEntityId(location) {
		return location.href.match(/#wd:([QMPL]\d+)/)[1]
	},
}

export { hash }
