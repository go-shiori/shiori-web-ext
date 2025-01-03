async function getPageContent() {
    const html = document.documentElement.innerHTML;
    const title = document.title;

    if (typeof html !== "string") {
        throw new Error("HTML content not available");
    }

    return {
        title: title,
        html: html.replace(/\s+/g, " "),
    };
}

async function showError(msg) {
    // Remove old error dialog
    document.querySelectorAll(".shiori-ext-dialog-overlay").forEach((node) => node.remove());

    // Create new error dialog
    const overlay = document.createElement("div");
    const dialog = document.createElement("div");
    const header = document.createElement("p");
    const body = document.createElement("p");
    const footer = document.createElement("div");
    const button = document.createElement("a");

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

browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.type) {
        case "page-content":
            getPageContent().then(sendResponse).catch((err) => sendResponse({ error: err.message }));
            return true; // Indicates that the response will be sent asynchronously
        case "show-error":
            showError(request.message);
            sendResponse({ success: true });
            break;
    }
});
