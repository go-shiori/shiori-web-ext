// Get DOM
var inputTags = document.getElementById("input-tags"),
    btnRemove = document.getElementById("btn-remove"),
    btnLibraries = document.getElementById("btn-libraries"),
    btnSave = document.getElementById("btn-save"),
    loading = document.getElementById("loading-sign");

async function showError(err) {
    var tabs = await browser.tabs.query({
        currentWindow: true,
        active: true,
    });

    if (tabs.length < 1) {
        throw new Error("no tab available");
    }

    if (err instanceof Error) {
        err = err.message;
    }

    return browser.tabs.sendMessage(tabs[0].id, {
        type: "show-error",
        message: err,
    });
}

// Add event handler
btnRemove.addEventListener("click", (e) => {
    // Show loading indicator
    btnSave.style.display = "none";
    loading.style.display = "block";
    btnRemove.style.display = "none";

    browser.runtime.sendMessage({type: "remove-bookmark"})
        .catch(err => showError(err))
        .finally(() => { window.close() });
});

btnLibraries.addEventListener("click", (e) => {
    browser.runtime.sendMessage({type: "open-libraries"})
        .finally(() => { window.close() });
});

btnSave.addEventListener("click", (e) => {
    // Get input value
    var tags = inputTags.value
        .toLowerCase()
        .replace(/\s+/g, " ")
        .split(/\s*,\s*/g)
        .filter(tag => tag.trim() !== "")
        .map(tag => {
            return {
                name: tag.trim()
            };
        });

    // Show loading indicator
    btnSave.style.display = "none";
    loading.style.display = "block";

    // Send data
    var message = {
        type: "save-bookmark",
        tags: tags,
    }

    browser.runtime.sendMessage(message)
        .catch(err => showError(err))
        .finally(() => window.close());
});

inputTags.addEventListener("keyup", (e) => {
    // keyCode 13 = "Enter" key on the keyboard
    if (event.keyCode === 13) {
        event.preventDefault()
        btnSave.click()
    }
})
