import {RegexResolver} from './types'

const inventaire: RegexResolver = {
	id: 'inventaire',
	regex: /https:\/\/inventaire\.io\/entity\/wd:(Q\d+)/,
	async applicable(location) {
		return await this.getEntityId(location) !== null
	},
	async getEntityId(location) {
		return location.href.match(this.regex) != null ? location.href.match(this.regex)[1] : null
	},
}

export { inventaire }
