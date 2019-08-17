// Get DOM
var inputTags = document.getElementById("input-tags"),
    btnSave = document.getElementById("btn-save"),
    loading = document.getElementById("loading");

// Add event handler
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
    browser.runtime.sendMessage({tags: tags})
        .then(() => console.log("OK"))
        .catch(err => console.error(err.message))
        .finally(() => {
            btnSave.style.display = "block";
            loading.style.display = "none";
        });

});