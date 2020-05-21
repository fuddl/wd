let proposals = JSON.parse(decodeURIComponent(window.location.search.replace(/^\?/, '')));
let content = document.getElementById('content');

async function setClaim(subject, property, value) {

	let token = await getTokens();

	let claim = {
		id: "Q4115189",
		type: "claim",
		mainsnak: {
			snaktype: "value",
			property: property,
			datavalue: {
				value: value,
				type: "string"
			}
		}
	}

	console.log(token);

	let response = await fetch('https://www.wikidata.org/w/api.php?action=wbsetclaim&baserevid=' + subject.lastrevid + '&claim=' + JSON.stringify(claim) + '&token=' + token, {
		method: 'POST',
		body: JSON.stringify({token: token})
	});
	let json = JSON.parse(await response.text());
	console.log(json);
}

let labelField = templates.join({
  human: proposals.titles[0],
  prop: proposals.ids[0][0].prop,
  value: proposals.ids[0][0].value,
});

content.appendChild(labelField);
