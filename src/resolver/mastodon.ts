import { sparqlQuery } from '../sqarql-query.js'

const mastodon: Resolver = {
	id: 'mastodon',
	aquireKnownInstances: async function() {

		const query = `
			SELECT distinct ?domain WHERE {
				?item wdt:P4033 ?address.
				BIND (replace(?address, "^@?[^@]+@", "") AS ?domain)
			}
		`
		const domains = await sparqlQuery(query)
		const output = []
		for (const domain of domains) {
			if (domain?.domain?.value) {
				output.push(domain.domain.value)
			}
		}
		return output
	},
	getAddress: async function(location) {
		if (!this.domains) {
			this.domains = await this.aquireKnownInstances()
		}
		const mastHost = this.domains.find(domain => domain == location.hostname);
		const username = (() => {
			if (location.pathname.match(/\/@([0-9a-zA-Z_]+)$/)) {
				return document.location.pathname.substring(2)
			}
			if (location.pathname.match(/^\/users\/([^\/]+)/)) {
				return document.location.pathname.split('/')[2]
			}
			
		})()
		const address = (() => {
			if (location.pathname.match(/\/@[0-9A-Za-z_]+@[0-9a-z\.\-]+[0-9a-z]+$/)) {
				return document.location.pathname.substring(2)
			}
		})()
		if (address || username) {
			return address ?? `${username}@${mastHost}`
		} else {
			return false
		}
	},
	async applicable(location) {
		let address = await this.getAddress(location)
		if (address) {
			return [{
				prop: 'P4033',
				value: address,
				recommended: true,
			}]
		} else {
			return false
		}
	},
	async getEntityId(location) {
		let address = await this.getAddress(location)

		const query = `
			SELECT ?item
			WHERE {
				?item wdt:P4033 "${ address }".
			}
		`

		const result = await sparqlQuery(query)
		if (result[0]) {
			const entityId = result[0].item.value.match(/https?:\/\/www\.wikidata\.org\/entity\/(\w\d+)/)[1]
			return entityId
		} else {
			return false
		}
	},
}

export { mastodon }