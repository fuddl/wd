import { ruby } from './components/ruby/ruby.tpl.js'
import { fit } from 'furigana'

const fitKlingon = function (pIqaD, latin) {
 	const trans = {
 		'TLH': '',
 		'CH': '',
 		'GH': '',
 		'NG': '',
 		'QH': '',
 		'A': '',
 		'B': '',
 		'D': '',
 		'E': '',
 		'H': '',
 		'I': '', 
 		'J': '',
 		'L': '',
 		'M': '',
 		'N': '',
 		'O': '',
 		'P': '',
 		'Q': '',
 		'R': '',
 		'S': '',
 		'T': '',
 		'U': '',
 		'V': '',
 		'W': '',
 		'Y': '',
 		"'": '',
 	}
 	output = []
 	for (const letter of pIqaD) {
 		if (letter.match(/\s/) && latin.match(/^\s+/)) {
 			output.push({r: letter})
 			latin = latin.replace(/^\s+/, '')
 			continue
 		}
 		for (const i in trans) {
 			if (letter == trans[i] && latin.toUpperCase().startsWith(i)) {
 				output.push({
 					w: letter,
 					r: latin.substring(0,i.length),
 				})
 				latin = latin.substring(i.length)
 				continue
 			}
 		}
 	}
 	return output
}

const rubifyLemma = function (lemmas) {
	const output = {
		rubified: null,
		unrubified: null,
	}
	if ('ja' in lemmas && 'ja-hira' in lemmas) {
		try {
			const fitted = fit(lemmas.ja.value, lemmas['ja-hira'].value, {type: 'object'});
			output.rubified = ruby(fitted, 'ja');
			delete lemmas['ja'];
			delete lemmas['ja-hira'];
		} catch (error) {
			console.error('ja and ja-hira representations of this lexeme are probably invalid')
		}
	}
	if ('tlh-piqd' in lemmas && 'tlh-latn' in lemmas) {
		const fitted = fitKlingon(lemmas['tlh-piqd' ].value, lemmas['tlh-latn'].value);
		output.rubified = ruby(fitted, 'tlh');
		delete lemmas['tlh-piqd'];
		delete lemmas['tlh-latn'];
	}
	output.unrubified = lemmas
	return output			
}

export { rubifyLemma }