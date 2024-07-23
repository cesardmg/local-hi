chrome.runtime.onInstalled.addListener(function () {
  chrome.storage.sync.set({ bookmarks: [] }, function () {
    console.log("Initial bookmarks array created");
  });
});

// You can add more background tasks here if needed
