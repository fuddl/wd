templates.ensign = (vars) => { return `
	<header class="ensign">
		<h1 class="ensign__title">${ vars.label }</h1>
		<small class="ensign__id">${ vars.id }</small>
		<p class="ensign__description">${ vars.description }</p>
	</header>
	<link rel="stylesheet" href="components/ensign/ensign.css"/>
` }