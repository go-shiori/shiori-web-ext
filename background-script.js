async function getCurrentTab() {
    // Get active tabs in current window
    var tabs = await browser.tabs.query({
        currentWindow: true,
        active: true,
    });

    if (tabs.length < 1) {
        throw new Error("no tab available");
    }

    if (tabs[0].url.startsWith("about:")) {
        throw new Error("config page is not bookmarkable");
    }

    return tabs[0];
}

async function getHtmlContent(tab) {
    try {
        var rawHtml = await browser.tabs.sendMessage(tab.id, "raw-html");
        return rawHtml;
    } catch {
        return "";
    }
}

async function getShioriBookmarkFolder() {
    // Get bookmark's root menu
    var items = await browser.bookmarks.search({}),
        menuFolder = items.find(el => el.type === "folder");

    if (menuFolder == null) {
        throw new Error("bookmarks menu not found");
    }

    // Check if `Shiori` folder already exists inside menu folder
    var menuChildren = await browser.bookmarks.getChildren(menuFolder.id),
        shioriFolder = menuChildren.find(el => el.type === "folder" && el.title === "Shiori");
    
    // If already exists, return as it is. Else, create it.
    if (shioriFolder != null) return shioriFolder;

    shioriFolder = await browser.bookmarks.create({
        title: "Shiori",
        parentId: menuFolder.id
    })

    return shioriFolder;
}

async function getExtensionConfig() {
    var items = await browser.storage.local.get(),
        session = items.session || "",
        server = items.server || "";
    
    if (session === "") {
        throw new Error("no active session, please login first");
    }
    
    if (server === "") {
        throw new Error("server url is not specified");
    }

    return {
        session: session,
        server: server
    };
}

async function saveBookmark(tags) {
    // Get value from async function
    var tab = await getCurrentTab(),
        config = await getExtensionConfig(),
        rawHtml = await getHtmlContent(tab);
    
    // Create API URL
    var apiURL = "";
    try {
        apiURL = new URL("/api/bookmarks/ext", config.server);
    } catch(err) {
        throw new Error(`${config.server} is not a valid url`);
    }

    // Send request via background script
    var data = {
        url: tab.url,
        tags: tags,
        createArchive: true,
    }

    var response = await fetch(apiURL, {
        method: "post",
        body: JSON.stringify(data),
        headers: {
            "Content-Type": "application/json",
            "X-Session-Id": config.session,
        }
    });

    if (!response.ok) {
        var err = await response.text();
        throw new Error(err);
    }

    return Promise.resolve();
}

// Define event handler
browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    return new Promise((resolve, reject) => {
        saveBookmark(request.tags)
            .then(() => { resolve() })
            .catch(err => { reject(err) });
    });
});