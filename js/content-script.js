async function getPageContent() {
	var html = document.documentElement.innerHTML,
		title = document.title;

	if (typeof html !== "string") {
		throw new Error("html content not available");
	}

	return {
		title: title,
		html: html.replace(/\s+/g, " "),
	};
}

async function showError(msg) {
	// Remove old error dialog
	document.querySelectorAll(".shiori-ext-dialog-overlay")
		.forEach(node => node.remove());

	// Create new error dialog
	var overlay = document.createElement("div"),
		dialog = document.createElement("div"),
		header = document.createElement("p"),
		body = document.createElement("p"),
		footer = document.createElement("div"),
		button = document.createElement("a");

	overlay.className = "shiori-ext-dialog-overlay";
	dialog.className = "shiori-ext-dialog";
	header.className = "shiori-ext-dialog-header";
	body.className = "shiori-ext-dialog-body";
	footer.className = "shiori-ext-dialog-footer";

	header.textContent = "Shiori Error";
	body.textContent = msg;
	button.textContent = "OK";

	button.addEventListener("click", () => {
		overlay.remove();
	});

	overlay.appendChild(dialog);
	dialog.appendChild(header);
	dialog.appendChild(body);
	dialog.appendChild(footer);
	footer.appendChild(button);
	
	document.body.appendChild(overlay);
}

browser.runtime.onMessage.addListener(request => {
	switch (request.type) {
		case "page-content":
			return getPageContent();
		case "show-error":
			return showError(request.message);
			break;
	}
});