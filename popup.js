document.addEventListener('DOMContentLoaded', function() {
    loadBookmarks();
    document.getElementById('addForm').addEventListener('submit', addBookmark);
  });
  
  function loadBookmarks() {
    chrome.storage.sync.get(['bookmarks'], function(result) {
      const bookmarks = result.bookmarks || [];
      const bookmarksDiv = document.getElementById('bookmarks');
      bookmarksDiv.innerHTML = '';
      bookmarks.forEach(function(bookmark) {
        const div = createBookmarkElement(bookmark);
        bookmarksDiv.appendChild(div);
      });
    });
  }
  
  function createBookmarkElement(bookmark) {
    const div = document.createElement('div');
    div.className = 'bookmark';
    
    const status = document.createElement('div');
    status.className = 'status';
    div.appendChild(status);
  
    const img = document.createElement('img');
    img.src = bookmark.logo || 'images/default-icon.svg';
    div.appendChild(img);
  
    const a = document.createElement('a');
    a.href = '#';
    a.textContent = bookmark.address;
    a.addEventListener('click', function() {
      chrome.tabs.create({ url: 'http://' + bookmark.address });
    });
    div.appendChild(a);
  
    checkStatus(bookmark.address, status);
  
    return div;
  }
  
  function addBookmark(e) {
    e.preventDefault();
    const address = document.getElementById('address').value;
    const logo = document.getElementById('logo').value;
    chrome.storage.sync.get(['bookmarks'], function(result) {
      const bookmarks = result.bookmarks || [];
      bookmarks.push({ address, logo });
      chrome.storage.sync.set({ bookmarks }, function() {
        loadBookmarks();
        document.getElementById('address').value = '';
        document.getElementById('logo').value = '';
      });
    });
  }
  
  function checkStatus(address, statusElement) {
    fetch('http://' + address, { mode: 'no-cors' })
      .then(() => {
        statusElement.classList.add('online');
        statusElement.classList.remove('offline');
      })
      .catch(() => {
        statusElement.classList.add('offline');
        statusElement.classList.remove('online');
      });
  }