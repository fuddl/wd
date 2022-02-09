import {Resolver} from './types'

const commons: Resolver = {
	id: 'commons',
	async applicable(location) {
		return location.href.match(/^https:\/\/commons(\.m)?\.wikimedia\.org\/wiki\/File:/) !== null
	},
	async getEntityId(location) {
		const link = document.querySelector('link[href^="https://commons.wikimedia.org/wiki/Special:EntityData/M"][type="application/json"]')
		const href = link.getAttribute('href')
		return href.match(/https:\/\/commons\.wikimedia\.org\/wiki\/Special:EntityData\/(M\d+)\.json/)[1]
	}
}

export { commons }
