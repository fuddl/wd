let proposals = JSON.parse(decodeURIComponent(window.location.search.replace(/^\?/, '')));
let content = document.getElementById('content');

let labelField = templates.join({
  human: proposals.titles[0],
});

content.appendChild(labelField);
