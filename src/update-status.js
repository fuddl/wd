function updateStatus(parts) {
	browser.runtime.sendMessage({
		type: 'status',
		message: parts,
	});
}

function updateStatusInternal(parts) {
	window.postMessage({
		type: 'status',
		message: parts,
	}, browser.runtime.getURL(''));
}

export { updateStatus, updateStatusInternal }