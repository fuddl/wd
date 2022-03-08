import {useEffect, useRef} from 'react'
import {Claim, renderStatement} from "../render-claims"

export interface ClaimsProps {
	statements: {id: string, claims: Claim[]}[]
}

// Integration based on https://reactjs.org/docs/integrating-with-other-libraries.html
export const Claims = ({statements}: ClaimsProps) => {
	const reference = useRef<HTMLDivElement>(null)
	useEffect(() => {
		const rendered = statements
			.map(it => renderStatement(it.claims))
			.filter(Boolean)
			.map(claim => claim.rendered)

		reference.current?.append(...rendered)
	})

	return <div className='claims' ref={reference}/>
}
