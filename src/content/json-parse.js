import fixNewlinesInJsonStrings from 'fix-newlines-in-json-strings'

function jsonParse(i) {
	try {
		return JSON.parse(fixNewlinesInJsonStrings(i.replace(/\/\*[\s\S]*?\*\//g, "")))  
	} catch (error) {
		console.error(error);
		console.error(i);
		return {}
	}

}

export { jsonParse }