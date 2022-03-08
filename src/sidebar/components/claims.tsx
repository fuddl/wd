import {useEffect, useRef} from 'react'
import {Claim, renderStatement} from "../render-claims"

export interface ClaimsProps {
	statements: {id: string, claims: Claim[]}[]
	renderingCache: any
}

// Integration based on https://reactjs.org/docs/integrating-with-other-libraries.html
export const Claims = ({statements, renderingCache}: ClaimsProps) => {
	const reference = useRef<HTMLDivElement>(null)
	useEffect(() => {
		const rendered = statements
			.map(it => renderStatement(it.claims, renderingCache))
			.filter(Boolean)
			.map(claim => claim.rendered)

		reference.current?.append(...rendered)
	})

	return <div className='claims' ref={reference}/>
}
