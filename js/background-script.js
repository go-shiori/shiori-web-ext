async function getCurrentTab() {
    const tabs = await browser.tabs.query({
        currentWindow: true,
        active: true,
    });

    if (tabs.length < 1) {
        throw new Error("No tab available");
    }

    const supportedProtocols = ["https:", "http:", "ftp:", "file:"];
    const activeTab = tabs[0];
    const url = new URL(activeTab.url);

    if (!supportedProtocols.includes(url.protocol)) {
        throw new Error(`Protocol "${url.protocol}" is not supported`);
    }

    return activeTab;
}

async function getPageContent(tab) {
    try {
        const content = await browser.tabs.sendMessage(tab.id, { type: "page-content" });
        return content;
    } catch {
        return {};
    }
}

async function getShioriBookmarkFolder() {
    const runtimeUrl = browser.runtime.getURL("/");
    let parentId;

    if (runtimeUrl.startsWith("moz")) {
        parentId = "unfiled_____";
    } else if (runtimeUrl.startsWith("chrome")) {
        parentId = "2";
    } else {
        throw new Error("Extension only supports Firefox and Chrome");
    }

    const children = await browser.bookmarks.getChildren(parentId);
    let shiori = children.find((el) => !el.url && el.title === "Shiori");

    if (!shiori) {
        shiori = await browser.bookmarks.create({
            title: "Shiori",
            parentId,
        });
    }

    return shiori;
}

async function findLocalBookmark(url) {
    const shioriFolder = await getShioriBookmarkFolder();
    const existingBookmarks = await browser.bookmarks.search({ url });

    return existingBookmarks.find((book) => book.parentId === shioriFolder.id) || null;
}

async function saveLocalBookmark(url, title) {
    const shioriFolder = await getShioriBookmarkFolder();
    const existingBookmarks = await browser.bookmarks.search({ url });

    if (!existingBookmarks.some((book) => book.parentId === shioriFolder.id)) {
        await browser.bookmarks.create({
            url,
            title,
            parentId: shioriFolder.id,
        });
    }
}

async function removeLocalBookmark(url) {
    const shioriFolder = await getShioriBookmarkFolder();
    const existingBookmarks = await browser.bookmarks.search({ url });

    for (const book of existingBookmarks) {
        if (book.parentId === shioriFolder.id) {
            await browser.bookmarks.remove(book.id);
        }
    }
}

async function getExtensionConfig() {
    const { token = "", server = "" } = await browser.storage.local.get();

    if (!token) {
        throw new Error("No active session, please login first");
    }

    if (!server) {
        throw new Error("Server URL is not specified");
    }

    return { token, server };
}

async function openLibraries() {
    const config = await getExtensionConfig();
    return browser.tabs.create({ active: true, url: config.server });
}

async function removeBookmark() {
    const tab = await getCurrentTab();
    const config = await getExtensionConfig();
    const srvURL = new URL(config.server);
    srvURL.pathname = srvURL.pathname.replace(/\/+$/, '') + '/';
    const apiURL = new URL(`${srvURL}api/bookmarks/ext`).toString();

    const response = await fetch(apiURL, {
        method: "DELETE",
        body: JSON.stringify({ url: tab.url }),
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${config.token}`,
        },
    });

    if (!response.ok) {
        throw new Error(await response.text());
    }

    await removeLocalBookmark(tab.url);
}

async function saveBookmark(tags) {
    const tab = await getCurrentTab();
    const config = await getExtensionConfig();
    const content = await getPageContent(tab);
    const srvURL = new URL(config.server);
    srvURL.pathname = srvURL.pathname.replace(/\/+$/, '') + '/';
    const apiURL = new URL(`${srvURL}api/bookmarks/ext`).toString();

    const response = await fetch(apiURL, {
        method: "POST",
        body: JSON.stringify({
            url: tab.url,
            tags,
            html: content.html || "",
        }),
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${config.token}`,
        },
    });

    if (!response.ok) {
        throw new Error(await response.text());
    }

    await saveLocalBookmark(tab.url, content.title || tab.title);
}

browser.runtime.onMessage.addListener((request) => {
    switch (request.type) {
        case "open-libraries":
            return openLibraries();
        case "remove-bookmark":
            return removeBookmark();
        case "save-bookmark":
            return saveBookmark(request.tags);
        default:
            return Promise.resolve();
    }
});

browser.tabs.onActivated.addListener(() => updateIcon());
browser.tabs.onUpdated.addListener(() => updateIcon());
browser.bookmarks.onCreated.addListener(() => updateIcon());
browser.bookmarks.onRemoved.addListener(() => updateIcon());
browser.windows.onFocusChanged.addListener(() => updateIcon());

async function updateIcon() {
    try {
        const tab = await getCurrentTab();
        const isBookmarked = !!(await findLocalBookmark(tab.url));

        browser.action.setIcon({
            path: isBookmarked
                ? {
                      16: "icons/action-bookmarked-16.png",
                      32: "icons/action-bookmarked-32.png",
                      64: "icons/action-bookmarked-64.png",
                  }
                : {
                      16: "icons/action-default-16.png",
                      32: "icons/action-default-32.png",
                      64: "icons/action-default-64.png",
                  },
        });
    } catch {
        browser.action.setIcon({
            path: {
                16: "icons/action-default-16.png",
                32: "icons/action-default-32.png",
                64: "icons/action-default-64.png",
            },
        });
    }
}
