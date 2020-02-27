templates.mercator = (vars) => { 
	let tag = document.createElement('img');
	let zoom = 17;
	let maps = {
    '1x': `https://maps.wikimedia.org/img/osm-intl,${ zoom },${ vars.lat },${ vars.lon },${ vars.width }x${ vars.height }@1x.png`,
    '2x': `https://maps.wikimedia.org/img/osm-intl,${ zoom },${ vars.lat },${ vars.lon },${ vars.width }x${ vars.height }@2x.png`
	};

	let srcset = []
	for (key in maps) {
		srcset.push(`${ maps[key] } ${ key }`);
	}
	tag.setAttribute('srcset', srcset.join(','));
	tag.setAttribute('loading', 'lazy');

	return tag;
}