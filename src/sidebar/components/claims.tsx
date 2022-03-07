import {useEffect, useRef} from 'react'
import {groupClaims} from '../group-claims'
import {renderStatement} from "../render-claims"

interface Claim {
	// todo
}

interface ClaimsProps {
	claims: Claim[]
}

export const Claims = ({claims}: ClaimsProps) => {
	const reference = useRef<HTMLDivElement>(null)
	useEffect(() => {
		// todo footnotes broken
		const rendered = groupClaims(claims)
			.map(prop => renderStatement(claims[prop], {}))
			.filter(Boolean)
			.map(claim => claim.rendered)

		reference.current?.append(...rendered)
	})

	return <div className='claims' ref={reference}/>
}
