import { Resolver } from './types'
import { commonsGetEntity } from '../wd-get-entity.js'

const commons: Resolver = {
	id: 'commons',
	regex: /^https:\/\/commons(?:\.m)?\.wikimedia\.org\/wiki\/File:([^#\/]+)/,
	applicable(location) {
		return location.href.match(this.regex) !== null
	},
	async getEntityId(location) {
		let entity = await commonsGetEntity(location.href.match(this.regex)[1])
		return entity.id
	}
}

export { commons }
