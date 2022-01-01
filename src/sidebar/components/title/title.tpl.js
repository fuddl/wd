import "./title.css";

const title = (vars) => {
	let tag = document.createElement("i");
	tag.innerText = vars.text;
	tag.classList.add("title");
	if (vars.lang) {
		tag.setAttribute("lang", vars.lang);
	}
	return tag;
};

export { title };
