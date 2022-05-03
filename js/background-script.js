async function getCurrentTab() {
    // Get active tabs in current window
    var tabs = await browser.tabs.query({
        currentWindow: true,
        active: true,
    });

    if (tabs.length < 1) {
        throw new Error("no tab available");
    }

    // Make sure URL protocol supported
    var supportedProtocols = ["https:", "http:", "ftp:", "file:"],
        activeTab = tabs[0],
        url = document.createElement('a');

    if (activeTab.url !== "") {
        url.href = activeTab.url;
        if (supportedProtocols.indexOf(url.protocol) === -1) {
            throw new Error(`protocol "${url.protocol}" is not supported`);
        }
    }

    return activeTab;
}

async function getPageContent(tab) {
    try {
        var content = await browser.tabs.sendMessage(tab.id, {type: "page-content"});
        return content;
    } catch {
        return {};
    }
}

async function getShioriBookmarkFolder() {
    // TODO:
    // I'm not sure it's the most efficient way, but it's the simplest.
    // We want to put Shiori folder in `Other bookmarks`, which id different depending on browser.
    // In Firefox, its id is `unfiled_____` while in Chrome the id is `2`.
    var parentId = "",
        runtimeUrl = await browser.runtime.getURL("/");
    
    if (runtimeUrl.startsWith("moz")) {
        parentId = "unfiled_____";
    } else if (runtimeUrl.startsWith("chrome")) {
        parentId = "2";
    } else {
        throw new Error("right now extension only support firefox and chrome")
    }

    // Check if the parent folder already has Shiori folder
    var children = await browser.bookmarks.getChildren(parentId),
        shiori = children.find(el => el.url == null && el.title === "Shiori");

    if (!shiori) {
        shiori = await browser.bookmarks.create({
            title: "Shiori",
            parentId: parentId
        });
    }

    return shiori;
}

async function findLocalBookmark(url) {
    var shioriFolder = await getShioriBookmarkFolder(),
        existingBookmarks = await browser.bookmarks.search({
            url: url,
        });

    var idx = existingBookmarks.findIndex(book => {
        return book.parentId === shioriFolder.id;
    });

    if (idx >= 0) {
        return existingBookmarks[idx];
    } else {
        return null;
    }
}

async function saveLocalBookmark(url, title) {
    var shioriFolder = await getShioriBookmarkFolder(),
        existingBookmarks = await browser.bookmarks.search({
            url: url,
        });

    var idx = existingBookmarks.findIndex(book => {
        return book.parentId === shioriFolder.id;
    });

    if (idx === -1) {
        await browser.bookmarks.create({
            url: url,
            title: title,
            parentId: shioriFolder.id,
        });
    }

    return Promise.resolve();
}

async function removeLocalBookmark(url) {
    var shioriFolder = await getShioriBookmarkFolder(),
        existingBookmarks = await browser.bookmarks.search({
            url: url,
        });

    existingBookmarks.forEach(book => {
        if (book.parentId !== shioriFolder.id) return;
        browser.bookmarks.remove(book.id);
    });

    return Promise.resolve();
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

async function openLibraries() {
    var config = await getExtensionConfig();
    return browser.tabs.create({
        active: true,
        url: config.server,
    });
}

async function removeBookmark() {
    var tab = await getCurrentTab(),
        config = await getExtensionConfig();

    // Create API URL
    var apiURL = "";
    try {
        var api = new URL(config.server);
        if (api.pathname.slice(-1) == "/") {
            api.pathname = api.pathname + "api/bookmarks/ext";
        } else {
            api.pathname = api.pathname + "/api/bookmarks/ext";
        }
        apiURL = api.toString();
    } catch(err) {
        throw new Error(`${config.server} is not a valid url`);
    }

    // Send request via background script
    var response = await fetch(apiURL, {
        method: "delete",
        body: JSON.stringify({url: tab.url}),
        headers: {
            "Content-Type": "application/json",
            "X-Session-Id": config.session,
        }
    });

    if (!response.ok) {
        var err = await response.text();
        throw new Error(err);
    }

    // Remove local bookmark
    await removeLocalBookmark(tab.url);

    return Promise.resolve();
}

async function saveBookmark(tags) {
    // Get value from async function
    var tab = await getCurrentTab(),
        config = await getExtensionConfig(),
        content = await getPageContent(tab);

    // Create API URL
    var apiURL = "";
    try {
        var api = new URL(config.server);
        if (api.pathname.slice(-1) == "/") {
            api.pathname = api.pathname + "api/bookmarks/ext";
        } else {
            api.pathname = api.pathname + "/api/bookmarks/ext";
        }
        apiURL = api.toString();
    } catch(err) {
        throw new Error(`${config.server} is not a valid url`);
    }

    // Send request via background script
    var data = {
        url: tab.url,
        tags: tags,
        html: content.html || "",
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

    // Save to local bookmark
    var pageTitle = content.title || tab.title;
    await saveLocalBookmark(tab.url, pageTitle);

    return Promise.resolve();
}

async function updateIcon() {
    // Set initial icon
    var runtimeUrl = await browser.runtime.getURL("/"),
        icon = {path: {
            16: "icons/action-default-16.png",
            32: "icons/action-default-32.png",
            64: "icons/action-default-64.png"
        }};
    
    // Firefox allows using empty object as default icon.
    // This way, Firefox will use default_icon that defined in manifest.json
    if (runtimeUrl.startsWith("moz")) {
        icon = {};
    }

    // Get current active tab
    try {
        var tab = await getCurrentTab(),
            local = await findLocalBookmark(tab.url);
        
        if (local) icon.path = {
            16: "icons/action-bookmarked-16.png",
            32: "icons/action-bookmarked-32.png",
            64: "icons/action-bookmarked-64.png"
        }
    } catch {}

    return browser.browserAction.setIcon(icon);
}

// Define event handler
browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    var task = Promise.resolve();

    switch (request.type) {
        case "open-libraries":
            task = new Promise((resolve, reject) => {
                openLibraries()
                    .then(() => { resolve() })
                    .catch(err => { reject(err) });
            });
            break;
        case "remove-bookmark":
            task = new Promise((resolve, reject) => {
                removeBookmark()
                    .then(() => { resolve() })
                    .catch(err => { reject(err) });
            });
            break;
        case "save-bookmark":
            task = new Promise((resolve, reject) => {
                saveBookmark(request.tags)
                    .then(() => { resolve() })
                    .catch(err => { reject(err) });
            });
            break;
    }

    return task;
});

// Add handler for icon change
function updateActiveTab()  {
    updateIcon().catch(err => console.error(err.message));
}

browser.bookmarks.onCreated.addListener(updateActiveTab);
browser.bookmarks.onRemoved.addListener(updateActiveTab);
browser.tabs.onUpdated.addListener(updateActiveTab);
browser.tabs.onActivated.addListener(updateActiveTab);
browser.windows.onFocusChanged.addListener(updateActiveTab);
updateActiveTab();
