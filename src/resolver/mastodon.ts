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
		const mastHost = this.domains.find(domain => domain == location.hostname)
		if (!mastHost) {
			return false
		}
		let pathnameNormalized = location.pathname.replace(/^\/web/, '')
		const username = (() => {
			if (pathnameNormalized.match(/\/@([0-9a-zA-Z_]+)/)) {
				return pathnameNormalized.match(/\/@([0-9a-zA-Z_]+)/)[1]
			}
			if (pathnameNormalized.match(/^\/users\/([^\/]+)/)) {
				return pathnameNormalized.split('/')[2]
			}
			
		})()
		const address = (() => {
			if (pathnameNormalized.match(/\/@[0-9A-Za-z_]+@[0-9a-z\.\-]+[0-9a-z]+/)) {
				return pathnameNormalized.substring(2)
			}
		})()
		if (address || username) {
			return address ?? `${username}@${mastHost}`
		} else {
			return false
		}
	},
	getTitle() {
		if (typeof document?.title === 'string' ) {
			const matches = document.title.match(/^(.+)\s\(@[^@]+@[^@\.]+\.[^\.]+\)/)
			return matches?.[1]
		} else {
			return false
		}
	},
	async applicable(location) {
		let address = await this.getAddress(location)
		let title = this.getTitle(document)
		if (address) {
			return [{
				prop: 'P4033',
				value: address,
				label: this.getTitle() ?? null,
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