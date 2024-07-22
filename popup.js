let currentEditIndex = -1;

document.addEventListener('DOMContentLoaded', function() {
  loadBookmarks();
  document.getElementById('addForm').addEventListener('submit', addBookmark);
  document.getElementById('saveEdit').addEventListener('click', saveEditedBookmark);
  document.getElementById('cancelEdit').addEventListener('click', cancelEdit);
});

function loadBookmarks() {
  chrome.storage.sync.get(['bookmarks'], function(result) {
    const bookmarks = result.bookmarks || [];
    const bookmarksDiv = document.getElementById('bookmarks');
    bookmarksDiv.innerHTML = '';
    bookmarks.forEach(function(bookmark, index) {
      const div = createBookmarkElement(bookmark, index);
      bookmarksDiv.appendChild(div);
    });
  });
}

function createBookmarkElement(bookmark, index) {
  const div = document.createElement('div');
  div.className = 'bookmark';
  
  const bookmarkInfo = document.createElement('div');
  bookmarkInfo.className = 'bookmark-info';
  
  const status = document.createElement('div');
  status.className = 'status';
  bookmarkInfo.appendChild(status);

  const img = document.createElement('img');
  img.src = bookmark.logo || 'images/default-icon.svg';
  bookmarkInfo.appendChild(img);

  const a = document.createElement('a');
  a.href = '#';
  a.textContent = bookmark.address;
  a.addEventListener('click', function() {
    chrome.tabs.create({ url: 'http://' + bookmark.address });
  });
  bookmarkInfo.appendChild(a);

  div.appendChild(bookmarkInfo);

  const bookmarkActions = document.createElement('div');
  bookmarkActions.className = 'bookmark-actions';

  const editButton = document.createElement('button');
  editButton.textContent = 'Edit';
  editButton.addEventListener('click', function() {
    startEdit(index);
  });
  bookmarkActions.appendChild(editButton);

  const deleteButton = document.createElement('button');
  deleteButton.textContent = 'Delete';
  deleteButton.addEventListener('click', function() {
    deleteBookmark(index);
  });
  bookmarkActions.appendChild(deleteButton);

  div.appendChild(bookmarkActions);

  checkStatus(bookmark.address, status);

  return div;
}

function addBookmark(e) {
  e.preventDefault();
  const address = document.getElementById('address').value;
  const logo = document.getElementById('logo').value;
  
  chrome.storage.sync.get(['bookmarks'], function(result) {
    const bookmarks = result.bookmarks || [];
    
    // Check for duplicate address
    if (bookmarks.some(bookmark => bookmark.address === address)) {
      alert('This localhost address already exists!');
      return;
    }
    
    bookmarks.push({ address, logo });
    chrome.storage.sync.set({ bookmarks }, function() {
      loadBookmarks();
      document.getElementById('address').value = '';
      document.getElementById('logo').value = '';
    });
  });
}

function startEdit(index) {
  chrome.storage.sync.get(['bookmarks'], function(result) {
    const bookmarks = result.bookmarks || [];
    const bookmark = bookmarks[index];
    document.getElementById('editAddress').value = bookmark.address;
    document.getElementById('editLogo').value = bookmark.logo || '';
    document.getElementById('editForm').classList.add('active');
    document.getElementById('addForm').style.display = 'none';
    currentEditIndex = index;
  });
}

function saveEditedBookmark() {
  const address = document.getElementById('editAddress').value;
  const logo = document.getElementById('editLogo').value;
  
  chrome.storage.sync.get(['bookmarks'], function(result) {
    const bookmarks = result.bookmarks || [];
    
    // Check for duplicate address, excluding the current bookmark
    if (bookmarks.some((bookmark, index) => index !== currentEditIndex && bookmark.address === address)) {
      alert('This localhost address already exists!');
      return;
    }
    
    bookmarks[currentEditIndex] = { address, logo };
    chrome.storage.sync.set({ bookmarks }, function() {
      loadBookmarks();
      cancelEdit();
    });
  });
}

function cancelEdit() {
  document.getElementById('editForm').classList.remove('active');
  document.getElementById('addForm').style.display = 'block';
  currentEditIndex = -1;
}

function deleteBookmark(index) {
  if (confirm('Are you sure you want to delete this bookmark?')) {
    chrome.storage.sync.get(['bookmarks'], function(result) {
      const bookmarks = result.bookmarks || [];
      bookmarks.splice(index, 1);
      chrome.storage.sync.set({ bookmarks }, function() {
        loadBookmarks();
      });
    });
  }
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