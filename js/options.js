// Define async function
async function getExtensionConfig() {
    var items = await browser.storage.local.get();

    return {
        server: items.server || "",
        session: items.session || "",
        username: items.username || "",
        password: items.password || "",
    };
}

async function saveExtensionConfig(cfg) {
    return browser.storage.local.set(cfg);
}

async function logout(server, session) {
    // Make sure session is exists
    if (session === "") return Promise.resolve();

    // Validate input
    if (server === "") {
        throw new Error("Server must not empty");
    }

    // Create logout url
    var logoutURL = "";
    try {
        logoutURL = new URL(server);
        if (logoutURL.pathname.slice(-1) == "/") {
            logoutURL.pathname = logoutURL.pathname + "api/logout";
        } else {
            logoutURL.pathname = logoutURL.pathname + "/api/logout";
        }
    } catch(err) {
        throw new Error(`${server} is not a valid url`);
    }

    // Send logout request
    var response = await fetch(logoutURL, {
        method: "post",
        headers: {
            "X-Session-Id": session,
        }
    });

    if (!response.ok) {
        var err = await response.text();
        throw new Error(err);
    }

    return Promise.resolve();
}

async function login(server, username, password) {
    // Validate input
    if (server === "") {
        throw new Error("Server must not empty");
    }

    if (username === "") {
        throw new Error("Username must not empty");
    }

    if (password === "") {
        throw new Error("Password must not empty");
    }

    // Create login URL
    var loginURL = "";
    try {
        loginURL = new URL(server);
        if (loginURL.pathname.slice(-1) == "/") {
            loginURL.pathname = loginURL.pathname + "api/login";
        } else {
            loginURL.pathname = loginURL.pathname + "/api/login";
        }
    } catch(err) {
        throw new Error(`${server} is not a valid url`);
    }

    // Send login request
    var response = await fetch(loginURL, {
        method: "post",
        body: JSON.stringify({
            username: username,
            password: password,
        }),
        headers: {
            "Content-Type": "application/json",
        }
    });

    if (!response.ok) {
        var err = await response.text();
        throw new Error(err);
    }

    var jsonResp = await response.json(),
        session = jsonResp.session;

    return session;
}

// Define function for UI handler
var errorMessage = document.getElementById("error-message"),
    txtSession = document.getElementById("txt-session"),
    inputServer = document.getElementById("input-server"),
    inputUsername = document.getElementById("input-username"),
    inputPassword = document.getElementById("input-password"),
    btnLogin = document.getElementById("btn-login"),
    loadingSign = document.getElementById("loading-sign"),
    config = {};

function showLoading() {
    btnLogin.style.display = "none";
    loadingSign.style.display = "block";
}

function hideLoading() {
    btnLogin.style.display = "block";
    loadingSign.style.display = "none";
}

function showError(msg) {
    errorMessage.style.display = "block";
    errorMessage.textContent = msg;
}

function hideError() {
    errorMessage.style.display = "none";
}

getExtensionConfig()
    .then(cfg => {
        config = cfg;

        if (cfg.session === "") txtSession.textContent = "No active session";
        else txtSession.textContent = `Active session: ${cfg.session}`;

        inputServer.value = cfg.server;
        inputUsername.value = cfg.username;
        inputPassword.value = cfg.password;
    })
    .catch(err => showError(err));

// Register event listener
async function btnLoginClick() {
    // Get input value
    var server = inputServer.value,
        username = inputUsername.value,
        password = inputPassword.value;

    // Make sure to log out first
    await logout(server, config.session);
    
    // Login using input value
    var newSession = await login(server, username, password);

    // Save input value and session to config
    config.server = server;
    config.session = newSession;
    config.username = username;
    config.password = password;
    await saveExtensionConfig(config);
    txtSession.textContent = `Active session: ${newSession}`;

    return Promise.resolve();
}

btnLogin.addEventListener("click", () => {
    hideError();
    showLoading();

    btnLoginClick()
        .catch(err => showError(err))
        .finally(() => hideLoading());
});
