const mercator = (vars) => { 
	let tag = document.createElement('img');
	let zoom = parseInt((vars.pre + 4) * 4);
	let maps = {
		'1x': `https://maps.wikimedia.org/img/osm-intl,${ zoom },${ vars.lat },${ vars.lon },${ vars.width }x${ vars.height }.png`,
		'2x': `https://maps.wikimedia.org/img/osm-intl,${ zoom },${ vars.lat },${ vars.lon },${ vars.width }x${ vars.height }@2x.png`
	};

	let srcset = []
	for (let key in maps) {
		srcset.push(`${ maps[key] } ${ key }`);
	}
	tag.setAttribute('srcset', srcset.join(','));
	tag.setAttribute('loading', 'lazy');

	let wrapper = document.createElement('figure')
	let caption = document.createElement('figcaption')

	let link = document.createElement('a')
	link.setAttribute('href', `https://maps.wikimedia.org/#${ zoom }/${ vars.lat }/${ vars.lon }#wd:${vars.entity}`)

	link.style.position = 'relative'
	link.style.display = 'block'

	let marker = document.createElement('span')
	marker.style.position = 'absolute'
	marker.style.left = '50%'
	marker.style.top = '50%'
	marker.style.transform = 'translate(-50%,-.5em)'
	marker.innerText = '📍'
	link.appendChild(marker)

	let contributorLink = 'https://www.openstreetmap.org/copyright';
	let osmLink = document.createElement('a');
	osmLink.innerText = 'OpenStreetMap';
	osmLink.setAttribute('href', 'https://www.openstreetmap.org/copyright')
	let attributaion = [
		document.createTextNode('Map data © '),
		osmLink,
		document.createTextNode(' contributors'),
	];
	for (let fragment of attributaion) {
		caption.appendChild(fragment);
	}
	link.appendChild(tag)
	wrapper.appendChild(link);
	wrapper.appendChild(caption);

	return wrapper;
}

export { mercator }
