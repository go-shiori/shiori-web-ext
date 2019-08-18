// Get DOM
var inputTags = document.getElementById("input-tags"),
    btnRemove = document.getElementById("btn-remove"),
    btnLibraries = document.getElementById("btn-libraries"),
    btnSave = document.getElementById("btn-save"),
    loading = document.getElementById("loading-sign");

// Add event handler
btnRemove.addEventListener("click", (e) => {
    // Show loading indicator
    btnSave.style.display = "none";
    loading.style.display = "block";
    btnRemove.style.display = "none";

    browser.runtime.sendMessage({type: "remove-bookmark"})
        .catch(err => console.error(err.message))
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
        .then(() => console.log("OK"))
        .catch(err => console.error(err.message))
        .finally(() => {
            btnSave.style.display = "block";
            loading.style.display = "none";
        });
});