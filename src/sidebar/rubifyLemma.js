import { ruby } from './components/ruby/ruby.tpl.js'
import { fit } from 'furigana'

const fitKlingon = function (pIqaD, latin) {
 	const trans = {
 		'D': '',
 		'H': '',
 		'Q': '',
 		'ch': '',
 		'gh': '',
 		'ng': '',
 		'tlh': '',
 		"'": '',
 		'a': '',
 		'b': '',
 		'e': '',
 		'I': '', 
 		'j': '',
 		'l': '',
 		'm': '',
 		'n': '',
 		'o': '',
 		'p': '',
 		'q': '',
 		'r': '',
 		'S': '',
 		't': '',
 		'u': '',
 		'v': '',
 		'w': '',
 		'y': '',
 	}
 	const output = []
 	for (const letter of pIqaD) {
 		if (letter.match(/\s/) && latin.match(/^\s+/)) {
 			output.push({w: letter})
 			latin = latin.replace(/^\s+/, '')
 			continue
 		}
 		for (const i in trans) {
 			if (letter == trans[i] && latin.startsWith(i)) {
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
			const fitted = fit(lemmas.ja.value, lemmas['ja-hira'].value, {
				type: 'object',
				kanaReading: false,
			});
			// undo the katakana → hiragana transliteration
			for (let i in fitted) {
				if(fitted[i].w.match(/^[゠-ヿ]+$/)) {
					fitted[i].r = ''
				}
			}
			output.rubified = ruby(fitted, 'ja');
			delete lemmas['ja'];
			delete lemmas['ja-hira'];
		} catch (error) {
			console.error('ja and ja-hira representations of this lexeme are probably invalid')
		}
	}
	else if ('ja' in lemmas && 'ja-kana' in lemmas && !lemmas.ja.value.match(/([ぁ-んァ-ン])/)) {
		// if `ja` doesn't contain hiragana or katakana while `ja-kana` is present
		// it is probably a loanword (?)
		// lets rubyfy it as it is
		output.rubified = ruby([{w: lemmas.ja.value, r: lemmas['ja-kana'].value}], 'ja');
		delete lemmas['ja'];
		delete lemmas['ja-kana'];
	}
	if ('tlh-piqd' in lemmas && 'tlh-latn' in lemmas) {
		try {
			const fitted = fitKlingon(lemmas['tlh-piqd' ].value, lemmas['tlh-latn'].value);
			if (fitted.length > 0) {
				output.rubified = ruby(fitted, 'tlh');
				delete lemmas['tlh-piqd'];
				delete lemmas['tlh-latn'];
			}
		} catch (error) {
			console.error('tlh-piqd and tlh-latn representations of this lexeme are probably invalid')
		}
	}
	output.unrubified = lemmas
	return output			
}

export { rubifyLemma }