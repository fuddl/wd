import {cache} from './cache'
import {commons} from './commons'
import {doi} from './doi'
import {hash} from './hash'
import {inventaire} from './inventaire'
import {URL_match_pattern} from './url-match-pattern'
import {wikipedia} from './wikipedia'
import {schemaOrg} from './schema-org'
import {url} from './url'
import {googleMaps} from './google-maps'
import {wikidata} from './wikidata'
import {MatchSuggestion, Resolution, Resolver} from './types'
import {findAsync} from '../core/async'

const resolvers = [
	wikidata,
	hash,
	cache,
	wikipedia,
	inventaire,
	commons,
	URL_match_pattern,
	doi,
	schemaOrg,
	googleMaps,
	url,
]

export const resolve = async (location: HTMLAnchorElement | HTMLAreaElement | Location): Promise<Resolution | null> => {
	for (const resolver of resolvers) {
		if (!await resolver.applicable(location)) continue
		const entityId = await resolver.getEntityId(location)

		if (entityId) return {
			entityId,
			doNotCache: resolver.noCache,
		}
	}
	return null
}

// todo better interface vs nested arrays
export const findMatchSuggestions = async (location: HTMLAnchorElement | HTMLAreaElement | Location)
	: Promise<Array<Array<MatchSuggestion>>> => {
	const suggestions = await Promise.all(
		resolvers.map(resolver => resolver.applicable(location)),
	)
	return suggestions.filter(it => it && it !== true) as Array<Array<MatchSuggestion>>

}

/**
 * Runs all the resolvers async, then finds first resolved and matching one
 * @param location
 */

export const findFirstMatchingResolver =
	async (location: HTMLAnchorElement | HTMLAreaElement | Location): Promise<Resolver | null> =>
		findAsync(resolvers, async resolver => resolver.applicable(location))

export {resolvers}
