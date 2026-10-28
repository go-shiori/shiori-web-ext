importScripts('browser-polyfill.js', 'background-script.js');

browser.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'THEME_CHANGED') {
    browser.storage.local.set({ theme: msg.theme });
    updateIcon();
  }
});
