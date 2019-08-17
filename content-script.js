browser.runtime.onMessage.addListener(request => {
	var response = document.documentElement.innerHTML;

	if (response) {
		return Promise.resolve(response.replace(/\s+/g, " "));
	} else {
		return Promise.reject(new Error("html content not available"));
	}
});