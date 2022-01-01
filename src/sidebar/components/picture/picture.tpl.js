import "./picture.css";

const picture = (vars) => {
	let tag = document.createElement("img");
	let srcset = [];
	for (let key in vars.srcSet) {
		srcset.push(`${vars.srcSet[key]} ${key}w`);
	}
	tag.setAttribute("srcset", srcset.join(","));
	tag.setAttribute("loading", "lazy");

	tag.setAttribute("src", vars.srcSet[0]);

	let wrapper = document.createElement("figure");
	wrapper.classList.add("picture");
	wrapper.appendChild(tag);

	if (vars.tag) {
		let tagWrapper = document.createElement("div");
		tagWrapper.classList.add("picture__tag");
		tagWrapper.appendChild(vars.tag);
		wrapper.appendChild(tagWrapper);
	}

	return wrapper;
};

export { picture };
