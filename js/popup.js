// State management
let currentMode = 'search'; // 'search' or 'add'
let searchResults = [];
let selectedIndex = -1;
let searchTimeout;
let extensionReady = false;

// Get DOM elements
const statusCheck = document.getElementById("status-check");
const statusLoading = document.getElementById("status-loading");
const statusError = document.getElementById("status-error");
const errorMessage = document.getElementById("error-message");
const btnOpenOptions = document.getElementById("btn-open-options");
const btnRetry = document.getElementById("btn-retry");
const searchMode = document.getElementById("search-mode");
const addMode = document.getElementById("add-mode");
const inputSearch = document.getElementById("input-search");
const inputTags = document.getElementById("input-tags");
const btnSwitchAdd = document.getElementById("btn-switch-add");
const btnSwitchSearch = document.getElementById("btn-switch-search");
const btnRemove = document.getElementById("btn-remove");
const btnLibraries = document.getElementById("btn-libraries");
const btnSave = document.getElementById("btn-save");
const loading = document.getElementById("loading-sign");
const searchLoading = document.getElementById("search-loading");
const searchEmpty = document.getElementById("search-empty");
const bookmarkList = document.getElementById("bookmark-list");

async function showError(err) {
  var tabs = await browser.tabs.query({
    currentWindow: true,
    active: true,
  });

  if (tabs.length < 1) {
    throw new Error("no tab available");
  }

  if (err instanceof Error) {
    err = err.message;
  }

  return browser.tabs.sendMessage(tabs[0].id, {
    type: "show-error",
    message: err,
  });
}

async function checkExtensionConfiguration() {
  try {
    const config = await browser.runtime.sendMessage({ type: "check-config" });
    
    if (!config.server || !config.token) {
      return {
        ready: false,
        error: "Extension not configured. Please go to extension options to login.",
        needsConfig: true
      };
    }

    try {
      await browser.runtime.sendMessage({ 
        type: "check-health", 
        server: config.server, 
        token: config.token 
      });
      
      return { ready: true };
    } catch (healthError) {
      return {
        ready: false,
        error: `Cannot reach Shiori server: ${healthError.message}`,
        needsConfig: false
      };
    }
  } catch (error) {
    return {
      ready: false,
      error: `Configuration check failed: ${error.message}`,
      needsConfig: true
    };
  }
}

function showStatusError(message, needsConfig = false) {
  // Hide main interface elements
  searchMode.style.display = 'none';
  addMode.style.display = 'none';
  
  // Show status screen
  statusCheck.style.display = 'block';
  statusLoading.style.display = 'none';
  statusError.style.display = 'block';
  errorMessage.textContent = message;
  
  if (needsConfig) {
    btnOpenOptions.style.display = 'inline-block';
  } else {
    btnOpenOptions.style.display = 'none';
  }
}

function showMainInterface(initialMode = 'search') {
  statusCheck.style.display = 'none';
  extensionReady = true;
  switchToMode(initialMode);
}

function switchToMode(mode) {
  if (!extensionReady) return;
  
  currentMode = mode;
  browser.storage.local.set({ lastMode: mode });

  if (mode === 'search') {
    searchMode.style.display = 'block';
    addMode.style.display = 'none';
    // Use requestAnimationFrame for proper DOM rendering
    requestAnimationFrame(() => {
      setTimeout(() => inputSearch.focus(), 50);
    });
    loadRecentBookmarks();
  } else {
    searchMode.style.display = 'none';
    addMode.style.display = 'block';
    requestAnimationFrame(() => {
      setTimeout(() => inputTags.focus(), 50);
    });
  }
}

function renderBookmarks(bookmarks) {
  bookmarkList.innerHTML = '';
  searchResults = bookmarks;
  selectedIndex = bookmarks.length > 0 ? 0 : -1;

  if (bookmarks.length === 0) {
    searchEmpty.style.display = 'block';
    searchLoading.style.display = 'none';
    return;
  }

  searchEmpty.style.display = 'none';
  searchLoading.style.display = 'none';

  bookmarks.forEach((bookmark, index) => {
    const item = document.createElement('div');
    item.className = 'bookmark-item';
    if (index === selectedIndex) {
      item.classList.add('selected');
    }

    const title = document.createElement('div');
    title.className = 'bookmark-title';
    title.textContent = bookmark.title || bookmark.url;

    const url = document.createElement('div');
    url.className = 'bookmark-url';
    url.textContent = bookmark.url;

    const tagsContainer = document.createElement('div');
    tagsContainer.className = 'bookmark-tags';

    if (bookmark.tags && bookmark.tags.length > 0) {
      bookmark.tags.forEach(tag => {
        const tagEl = document.createElement('span');
        tagEl.className = 'bookmark-tag';
        tagEl.textContent = tag.name;
        tagsContainer.appendChild(tagEl);
      });
    }

    item.appendChild(title);
    item.appendChild(url);
    item.appendChild(tagsContainer);

    item.addEventListener('click', () => openSelectedBookmark(index, true));
    bookmarkList.appendChild(item);
  });
}

function updateSelection(newIndex) {
  if (searchResults.length === 0) return;

  // Remove old selection
  const oldSelected = bookmarkList.querySelector('.selected');
  if (oldSelected) {
    oldSelected.classList.remove('selected');
  }

  // Update index
  selectedIndex = Math.max(0, Math.min(newIndex, searchResults.length - 1));

  // Add new selection
  const bookmarkItems = bookmarkList.querySelectorAll('.bookmark-item');
  if (bookmarkItems[selectedIndex]) {
    bookmarkItems[selectedIndex].classList.add('selected');
    bookmarkItems[selectedIndex].scrollIntoView({ block: 'nearest' });
  }
}

function openSelectedBookmark(index = selectedIndex, newTab = true) {
  if (index >= 0 && index < searchResults.length) {
    const bookmark = searchResults[index];
    browser.runtime.sendMessage({
      type: "open-bookmark",
      url: bookmark.url,
      newTab: newTab
    }).finally(() => window.close());
  }
}

async function searchBookmarks(keyword = "") {
  searchLoading.style.display = 'block';
  searchEmpty.style.display = 'none';

  try {
    const result = await browser.runtime.sendMessage({
      type: "search-bookmarks",
      keyword: keyword,
      page: 1
    });
    renderBookmarks(result.bookmarks || []);
  } catch (err) {
    searchLoading.style.display = 'none';
    showError(err);
  }
}

async function loadRecentBookmarks() {
  await searchBookmarks("");
}

// Event handlers for add mode (original functionality)
btnRemove.addEventListener("click", (e) => {
  btnSave.style.display = "none";
  loading.style.display = "block";
  btnRemove.style.display = "none";

  browser.runtime.sendMessage({ type: "remove-bookmark" })
    .catch(err => showError(err))
    .finally(() => { window.close() });
});

btnLibraries.addEventListener("click", (e) => {
  browser.runtime.sendMessage({ type: "open-libraries" })
    .finally(() => { window.close() });
});

btnSave.addEventListener("click", (e) => {
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

  btnSave.style.display = "none";
  loading.style.display = "block";

  var message = {
    type: "save-bookmark",
    tags: tags,
  }

  browser.runtime.sendMessage(message)
    .catch(err => showError(err))
    .finally(() => window.close());
});

inputTags.addEventListener("keyup", (e) => {
  if (e.keyCode === 13) {
    e.preventDefault()
    btnSave.click()
  }
});

// Event handlers for search mode
btnSwitchAdd.addEventListener("click", (e) => {
  e.preventDefault();
  switchToMode('add');
});

btnSwitchSearch.addEventListener("click", (e) => {
  e.preventDefault();
  switchToMode('search');
});

inputSearch.addEventListener("input", (e) => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    searchBookmarks(e.target.value);
  }, 300);
});

inputSearch.addEventListener("keydown", (e) => {
  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault();
      updateSelection(selectedIndex + 1);
      break;
    case 'ArrowUp':
      e.preventDefault();
      updateSelection(selectedIndex - 1);
      break;
    case 'Enter':
      e.preventDefault();
      if (e.shiftKey) {
        openSelectedBookmark(selectedIndex, false); // current tab
      } else {
        openSelectedBookmark(selectedIndex, true); // new tab
      }
      break;
    case 'Escape':
      window.close();
      break;
  }
});

// Global keyboard shortcut for mode switching
document.addEventListener("keydown", (e) => {
  // Ctrl+A (or Cmd+A on Mac) to switch modes
  if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
    e.preventDefault();
    const newMode = currentMode === 'search' ? 'add' : 'search';
    switchToMode(newMode);
  }
});

// Event handlers for status screen
btnOpenOptions.addEventListener("click", () => {
  browser.runtime.openOptionsPage();
  window.close();
});

btnRetry.addEventListener("click", async () => {
  // Reset to loading state
  statusError.style.display = 'none';
  statusLoading.style.display = 'block';
  searchMode.style.display = 'none';
  addMode.style.display = 'none';
  await initializeExtension();
});

// Initialize extension
async function initializeExtension() {
  // Ensure main interface is hidden during initialization
  searchMode.style.display = 'none';
  addMode.style.display = 'none';
  statusCheck.style.display = 'block';
  statusLoading.style.display = 'block';
  statusError.style.display = 'none';
  
  try {
    const status = await checkExtensionConfiguration();
    
    if (status.ready) {
      const data = await browser.storage.local.get("lastMode");
      const savedMode = data.lastMode || 'search';
      showMainInterface(savedMode);
    } else {
      showStatusError(status.error, status.needsConfig);
    }
  } catch (error) {
    showStatusError(`Initialization failed: ${error.message}`, true);
  }
}

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  initializeExtension();
});
