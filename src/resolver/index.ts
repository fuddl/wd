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
import {findAsync, mapAsync} from '../core/async'

export const resolvers = [
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

type LocationLike = HTMLAnchorElement | HTMLAreaElement | Location

export const resolve = async (location: LocationLike): Promise<Resolution | null> => {
	for (const resolver of resolvers) {
		const result = await checkApplicableAndResolve(resolver, location)
		if (result) return result
	}
	return null
}

export const resolveAll = async (location: LocationLike): Promise<Resolution[]> => {
	const resolutions = await mapAsync(resolvers,
		async resolver => checkApplicableAndResolve(resolver, location))

	return resolutions.filter(Boolean)
}

/**
 * Obvious candidate for being part of the resolver class if we go that way
 */
async function checkApplicableAndResolve(resolver: Resolver, location: LocationLike): Promise<Resolution | null> {
	const matchSuggestions = await resolver.applicable(location)
	if (!matchSuggestions) return

	const entityId = await resolver.getEntityId(location)

	if (entityId) return {
		entityId,
		matchSuggestions: matchSuggestions === true ? [] : matchSuggestions,
		doNotCache: resolver.noCache,
	}
}

// todo better interface vs nested arrays
export const getMatchSuggestions = async (location: LocationLike)
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
	async (location: LocationLike): Promise<Resolver | null> =>
		findAsync(resolvers, resolver => resolver.applicable(location))
