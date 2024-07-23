let currentEditIndex = -1;

document.addEventListener("DOMContentLoaded", function () {
  loadBookmarks();
  document.getElementById("addForm").addEventListener("submit", addBookmark);
  document
    .getElementById("saveEdit")
    .addEventListener("click", saveEditedBookmark);
  document.getElementById("cancelEdit").addEventListener("click", cancelEdit);
});

function loadBookmarks() {
  chrome.storage.sync.get(["bookmarks"], function (result) {
    const bookmarks = result.bookmarks || [];
    const bookmarksDiv = document.getElementById("bookmarks");
    bookmarksDiv.innerHTML = "";
    bookmarks.forEach(function (bookmark, index) {
      const div = createBookmarkElement(bookmark, index);
      bookmarksDiv.appendChild(div);
    });
  });
}

function createBookmarkElement(bookmark, index) {
  const div = document.createElement("div");
  div.className = "bookmark";

  const bookmarkInfo = document.createElement("div");
  bookmarkInfo.className = "bookmark-info";

  const status = document.createElement("div");
  status.className = "status";
  bookmarkInfo.appendChild(status);

  const img = document.createElement("img");
  img.src = bookmark.logo || "images/default-icon.svg";
  img.alt = "Bookmark icon";
  bookmarkInfo.appendChild(img);

  const a = document.createElement("a");
  a.href = "#";
  a.textContent = bookmark.address;
  a.title = bookmark.address; // Add title for full address on hover
  a.addEventListener("click", function (e) {
    e.preventDefault();
    const url = bookmark.address.startsWith("http")
      ? bookmark.address
      : "http://" + bookmark.address;
    chrome.tabs.create({ url: url });
  });
  bookmarkInfo.appendChild(a);

  div.appendChild(bookmarkInfo);

  const bookmarkActions = document.createElement("div");
  bookmarkActions.className = "bookmark-actions";

  const editButton = document.createElement("button");
  editButton.textContent = "Edit";
  editButton.addEventListener("click", function () {
    startEdit(index);
  });
  bookmarkActions.appendChild(editButton);

  const deleteButton = document.createElement("button");
  deleteButton.textContent = "Delete";
  deleteButton.addEventListener("click", function () {
    deleteBookmark(index);
  });
  bookmarkActions.appendChild(deleteButton);

  div.appendChild(bookmarkActions);

  checkStatus(bookmark.address, status);

  return div;
}

function showError(message) {
  const errorDialog = document.createElement("div");
  errorDialog.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background-color: var(--error-bg);
    color: var(--error-text);
    padding: 10px;
    border-radius: 5px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    z-index: 1000;
    font-size: 14px;
    text-align: center;
  `;

  errorDialog.textContent = message;

  document.body.appendChild(errorDialog);

  setTimeout(() => {
    errorDialog.remove();
  }, 3000);
}

function addBookmark(e) {
  e.preventDefault();
  const address = document.getElementById("address").value;
  const logo = document.getElementById("logo").value;

  chrome.storage.sync.get(["bookmarks"], function (result) {
    const bookmarks = result.bookmarks || [];

    // Check for duplicate address
    if (bookmarks.some((bookmark) => bookmark.address === address)) {
      showError("This address already exists!");
      return;
    }

    bookmarks.push({ address, logo });
    chrome.storage.sync.set({ bookmarks }, function () {
      loadBookmarks();
      document.getElementById("address").value = "";
      document.getElementById("logo").value = "";
    });
  });
}

function startEdit(index) {
  chrome.storage.sync.get(["bookmarks"], function (result) {
    const bookmarks = result.bookmarks || [];
    const bookmark = bookmarks[index];
    document.getElementById("editAddress").value = bookmark.address;
    document.getElementById("editLogo").value = bookmark.logo || "";
    document.getElementById("editForm").classList.add("active");
    document.getElementById("addForm").style.display = "none";
    currentEditIndex = index;
  });
}

function saveEditedBookmark() {
  const address = document.getElementById("editAddress").value;
  const logo = document.getElementById("editLogo").value;

  chrome.storage.sync.get(["bookmarks"], function (result) {
    const bookmarks = result.bookmarks || [];

    // Check for duplicate address, excluding the current bookmark
    if (
      bookmarks.some(
        (bookmark, index) =>
          index !== currentEditIndex && bookmark.address === address
      )
    ) {
      showError("This address already exists!");
      return;
    }

    bookmarks[currentEditIndex] = { address, logo };
    chrome.storage.sync.set({ bookmarks }, function () {
      loadBookmarks();
      cancelEdit();
    });
  });
}

function cancelEdit() {
  document.getElementById("editForm").classList.remove("active");
  document.getElementById("addForm").style.display = "block";
  currentEditIndex = -1;
}

function deleteBookmark(index) {
  if (confirm("Are you sure you want to delete this bookmark?")) {
    chrome.storage.sync.get(["bookmarks"], function (result) {
      const bookmarks = result.bookmarks || [];
      bookmarks.splice(index, 1);
      chrome.storage.sync.set({ bookmarks }, function () {
        loadBookmarks();
      });
    });
  }
}

function checkStatus(address, statusElement) {
  let url;
  if (address.startsWith("http://") || address.startsWith("https://")) {
    url = address;
  } else if (address.includes("://")) {
    // For other protocols, we can't check status directly
    statusElement.classList.add("unknown");
    statusElement.classList.remove("online", "offline");
    return;
  } else {
    // Assume http:// if no protocol is specified
    url = "http://" + address;
  }

  fetch(url, {
    mode: "no-cors",
    cache: "no-cache",
    headers: {
      "Cache-Control": "no-cache",
    },
  })
    .then(() => {
      statusElement.classList.add("online");
      statusElement.classList.remove("offline", "unknown");
    })
    .catch(() => {
      // If http fails, try https
      if (!address.startsWith("https://")) {
        fetch("https://" + address.replace(/^https?:\/\//, ""), {
          mode: "no-cors",
        })
          .then(() => {
            statusElement.classList.add("online");
            statusElement.classList.remove("offline", "unknown");
          })
          .catch(() => {
            statusElement.classList.add("offline");
            statusElement.classList.remove("online", "unknown");
          });
      } else {
        statusElement.classList.add("offline");
        statusElement.classList.remove("online", "unknown");
      }
    });
}
