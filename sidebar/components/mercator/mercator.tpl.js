templates.mercator = (vars) => { 
	let tag = document.createElement('img');
	let zoom = parseInt((vars.pre + 4) * 4);
	let maps = {
    '1x': `https://maps.wikimedia.org/img/osm-intl,${ zoom },${ vars.lat },${ vars.lon },${ vars.width }x${ vars.height }.png`,
    '2x': `https://maps.wikimedia.org/img/osm-intl,${ zoom },${ vars.lat },${ vars.lon },${ vars.width }x${ vars.height }@2x.png`
	};

	let srcset = []
	for (key in maps) {
		srcset.push(`${ maps[key] } ${ key }`);
	}
	tag.setAttribute('srcset', srcset.join(','));
	tag.setAttribute('loading', 'lazy');

	let wrapper = document.createElement('figure');
	let caption = document.createElement('figcaption');

	let contributorLink = 'https://www.openstreetmap.org/copyright';
	let osmLink = document.createElement('a');
	osmLink.innerText = 'OpenStreetMap';
	osmLink.setAttribute('href', 'https://www.openstreetmap.org/copyright')
	let attributaion = [
		document.createTextNode('Map data © '),
		osmLink,
		document.createTextNode(' contributors'),
	];
	for (fragment of attributaion) {
		caption.appendChild(fragment);
	}

	wrapper.appendChild(tag);
	wrapper.appendChild(caption);

	return wrapper;
}
