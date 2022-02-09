export interface MatchSuggestion {
    prop: string | Array<string>
    value: string
    valueIsCaseInsensitive?: boolean
    recommended?: boolean
}

export interface Resolver {
    applicable(location: HTMLAnchorElement | HTMLAreaElement | Location): Promise<boolean | Array<MatchSuggestion>>
    getEntityId(location: HTMLAnchorElement | HTMLAreaElement | Location): Promise<string>
    noCache?: boolean
}

export interface Resolution {
	entityId: string
	doNotCache?: boolean
}

export interface RegexResolver extends Resolver {
    regex: RegExp
}
