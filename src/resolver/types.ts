export interface MatchSuggestion {
	/**
	 * Do we need to have either prop or sitelink?
	 * prop is present everywhere besides wikipedia resolver, where we have sitelink
	 */
    prop?: string | Array<string>
	sitelink?: string
    value: string
    valueIsCaseInsensitive?: boolean
    recommended?: boolean
}

export interface Resolver {
    applicable(location: HTMLAnchorElement | HTMLAreaElement | Location): Promise<boolean | Array<MatchSuggestion>>
    getEntityId(location: HTMLAnchorElement | HTMLAreaElement | Location): Promise<string>
	id: string
    noCache?: boolean
	[key: string]: any
}

export interface Resolution {
	entityId: string
	matchSuggestions: Array<MatchSuggestion>
	doNotCache?: boolean
}

export interface RegexResolver extends Resolver {
    regex: RegExp
}
