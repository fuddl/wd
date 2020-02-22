templates.claim = (vars) => { return `
	<dl class="remark">
		<dt class="remark__verb" title="${ vars.propDesc ?? '' }">
			${ vars.prop }
		</dt>
		${ vars.vals.map((item) => {
     	return `<dd class="remark__object">${ item }</dd>`;
		}).join('') }
	</dl>
	<link rel="stylesheet" href="components/remark/remark.css"/>
` }