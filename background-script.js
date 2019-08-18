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

async function getPageContent(tab) {
    try {
        var content = await browser.tabs.sendMessage(tab.id, "page-content");
        return content;
    } catch {
        return {};
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
        apiURL = new URL("/api/bookmarks/ext", config.server);
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
        apiURL = new URL("/api/bookmarks/ext", config.server);
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
    var pageTitle = content.title || "";
    await saveLocalBookmark(tab.url, pageTitle);

    return Promise.resolve();
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