// Get DOM
var errorMessage = document.getElementById("error-message"),
    txtSession = document.getElementById("txt-session"),
    inputServer = document.getElementById("input-server"),
    inputUsername = document.getElementById("input-username"),
    inputPassword = document.getElementById("input-password"),
    btnLogin = document.getElementById("btn-login"),
    loadingSign = document.getElementById("loading-sign");

// Define local function
function showLoading() {
    btnLogin.style.display = "none";
    loadingSign.style.display = "block";
}

function hideLoading() {
    btnLogin.style.display = "block";
    loadingSign.style.display = "none";
}

function hideError() {
    errorMessage.style.display = "none";
}

function showError(msg) {
    errorMessage.style.display = "block";
    errorMessage.textContent = msg;
}

function getItems(items) {
    var session = items.session || "",
        server = items.server || "",
        username = items.username || "",
        password = items.password || "";
    
    if (session === "") txtSession.textContent = "No active session";
    else txtSession.textContent = `Active session: ${session}`;

    inputServer.value = server;
    inputUsername.value = username;
    inputPassword.value = password;
}

function logout() {
    // Get DOM value
    var session = txtSession.textContent,
        server = inputServer.value;

    // Get session ID
    if (session === "") return Promise.resolve();
    else if (session === "No active session") return Promise.resolve();
    else session = session.replace("Active session: ", "");

    // Create logout URL
    var logoutURL = "";
    try {
        logoutURL = new URL("/api/logout", server);
    } catch(err) {
        return Promise.reject(new Error(`${server} is not a valid url`));
    }

    // Send logout request
    return new Promise((resolve, reject) => {
        var fetchData = {
            method: "post",
            headers: {
                "Content-Type": "application/json",
                "X-Session-Id": session,
            },
        };

        fetch(logoutURL, fetchData)
            .then(response => {
                if (!response.ok) throw response;
                return resolve();
            })
            .catch(err => {
                reject(err);
            });
    });
}

function login() {
    // Get input value
    var server = inputServer.value,
        username = inputUsername.value,
        password = inputPassword.value;

    // Validate input
    if (server === "") {
        return Promise.reject(new Error("Server must not empty"));
    }

    if (username === "") {
        return Promise.reject(new Error("Username must not empty"));
    }

    if (password === "") {
        return Promise.reject(new Error("Password must not empty"));
    }

    // Create login URL
    var loginURL = "";
    try {
        loginURL = new URL("/api/login", server);
    } catch(err) {
        return Promise.reject(new Error(`${server} is not a valid url`));
    }

    // Send login request
    return new Promise((resolve, reject) => {
        var fetchData = {
            method: "post",
            body: JSON.stringify({
                username: username,
                password: password,
            }),
            headers: {
                "Content-Type": "application/json",
            },
        };

        fetch(loginURL, fetchData)
            .then(response => {
                if (!response.ok) throw response;
                return response.json();
            })
            .then(jsonData => {
                resolve({
                    server: server,
                    username: username,
                    password: password,
                    session: jsonData.session,
                });
            })
            .catch(err => {
                reject(err);
            });
    });
}

// Load local storage
browser.storage.local.get().then(getItems).catch(showError);

// Register event listener
function eventHandler() {
    showLoading();

    logout().then(login)
        .then(loginResult => {
            return new Promise((resolve, reject) => {
                browser.storage.local.set(loginResult)
                    .then(() => {
                        hideError();
                        txtSession.textContent = `Active session: ${loginResult.session}`;
                        resolve();
                    })
                    .catch(err => {
                        reject(err);
                    })
            });
        })
        .catch(err => {
            if (err instanceof Error) {
                showError(err.message);
                return;
            }

            err.text().then(msg => {
                showError(`${msg} (${err.status})`);
            })
        })
        .finally(() => {
            hideLoading();
        });
}

btnLogin.addEventListener("click", eventHandler);
