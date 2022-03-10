import {useEffect, useRef} from 'react'
import {Claim, renderStatement} from "../render-claims"
import {AddProperty} from "./add-property"

export interface ClaimsProps {
	statements: {id: string, claims: Claim[]}[]
	renderingCache: any
}

export const Claims = (props: ClaimsProps) => {
	return <div>
		<ExistingClaims {...props}/>
		<AddClaims></AddClaims>
	</div>
}

// Integration based on https://reactjs.org/docs/integrating-with-other-libraries.html
export const ExistingClaims = ({statements, renderingCache}: ClaimsProps) => {
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

/**
 * todo have a shortcut
 * in "edit mode" - automatically add an empty claim field when prev is filled
 * see example in https://github.com/openshift/angular-key-value-editor
 *
 * saving incrementally vs saving on exiting edit mode?
 */
const AddClaims = () => {
	return <div className='remark'>

		<AddProperty></AddProperty>
	</div>

}
