import { ruby } from './components/ruby/ruby.tpl.js'
import { fit } from 'furigana'

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
	output.unrubified = lemmas
	return output			
}

export { rubifyLemma }