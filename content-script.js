browser.runtime.onMessage.addListener(request => {
	var html = document.documentElement.innerHTML,
		title = document.title;

	if (typeof html == "string") {
		return Promise.resolve({
			title: title,
			html: html.replace(/\s+/g, " "),
		});
	} else {
		return Promise.reject(new Error("html content not available"));
	}
});