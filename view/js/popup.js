// Get DOM
var inputTags = document.getElementById("input-tags"),
    btnSave = document.getElementById("btn-save"),
    loading = document.getElementById("loading");

// Create asynchronous function
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

async function getShioriData() {
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

async function sendBookmarkRequest() {
    // Get value from async function
    var bookmarkFolder = await getShioriBookmarkFolder(),
        currentTab = await getCurrentTab(),
        shioriData = await getShioriData(),
        rawHtml = await getHtmlContent(currentTab);

    // Get value from DOM
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

    // Create API URL
    var apiURL = "";
    try {
        apiURL = new URL("/api/bookmarks/ext", shioriData.server);
    } catch(err) {
        throw new Error(`${shioriData.server} is not a valid url`);
    }

    // Send request
    var data = {
        url: currentTab.url,
        tags: tags,
        createArchive: true,
    }

    var response = await fetch(apiURL, {
        method: "post",
        body: JSON.stringify(data),
        headers: {
            "Content-Type": "application/json",
            "X-Session-Id": shioriData.session,
        }
    });

    if (!response.ok) {
        var err = await response.text();
        throw new Error(err);
    }

    console.log(bookmarkFolder);
    console.log(currentTab);
    console.log(shioriData.server);
    console.log(rawHtml);
    console.log(apiURL);

    return Promise.resolve();
}

// Add event handler
btnSave.addEventListener("click", (e) => {
    btnSave.style.display = "none";
    loading.style.display = "block";
    
    sendBookmarkRequest()
        .then(() => console.log("OOK"))
        .catch(err => console.error(err.message))
        .finally(() => {
            btnSave.style.display = "block";
            loading.style.display = "none";
        });
});