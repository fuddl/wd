import { fsw } from '@sutton-signwriting/font-ttf'
import { optimize } from 'svgo'
import { requreStylesheet } from '../require-styleheet.js'

const sutton = (ascii) => {
	const element = document.createElement('span')
	const svgString = optimize(fsw.signSvg(ascii)).data

	const root = svgString.match(/<svg([^\>]+)\>/)?.[1]
	const width = root.match(/width="(\d+)"/)?.[1]
	const height = root.match(/height="(\d+)"/)?.[1]
	const viewbox = root.match(/viewBox="(\d+ \d+ \d+ \d+)"/)?.[1]
	const svgNameSpace = 'http://www.w3.org/2000/svg'

	const image = document.createElementNS(svgNameSpace, 'svg')
	image.setAttribute('width', width)
	image.setAttribute('height', height)
	image.setAttribute('viewBox', viewbox)

	const svgTexts = svgString.match(/<text[^\>]+>[^<a-zA-Z0-9]+<\/text>/g)

	if (svgTexts === null) {
		const maxLenght = 24
		return document.createTextNode(ascii.length > maxLenght ? `${ascii.substring(0,maxLenght)}…` : ascii)
	}

	for (const svgText of svgTexts) {
		const fontSize = svgText.match(/font-size:(\d+px)/)?.[1]
		const transform = svgText.match(/transform="([^"]+)"/)?.[1]
		const symbol = svgText.match(/>([^<]+)</)?.[1]
		const fill = svgText.match(/fill="([^"]+)"/)?.[1]
		const font = svgText.match(/font-family\:'([^\']+)/)?.[1]
		
		if (fontSize && transform && symbol && font) {
			const text = document.createElementNS(svgNameSpace, 'text')
			text.textContent = symbol
			text.setAttribute('font-family', font)
			text.setAttribute('fill', fill ?? 'currentColor')
			text.setAttribute('transform', transform)
			text.setAttribute('font-size', fontSize)
			text.setAttribute('line-height', fontSize)
			image.appendChild(text)
		}
	}

	requreStylesheet("components/sutton/sutton.css");

	return image
}

export { sutton };