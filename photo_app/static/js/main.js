document.addEventListener('DOMContentLoaded', function () {
  const uploadForm = document.getElementById('uploadForm');
  const searchBtn = document.getElementById('searchBtn');
  const searchInput = document.getElementById('searchTag');
  const gallery = document.getElementById('photoGallery');
  const editForm = document.getElementById('editForm');
  document.addEventListener('DOMContentLoaded', function() {
  // Helper Functions
  const capitalizeFirst = (text) => 
    text ? text.charAt(0).toUpperCase() + text.slice(1).toLowerCase() : '';

  const truncateText = (text, max = 80) => 
    text ? (text.length > max ? text.substring(0, max) + '...' : text) : '';

  // Render Tags with More Button
  const renderTags = (tags) => {
    if (!tags || !tags.length) return '<span class="text-muted">No tags</span>';
    
    const visible = tags.slice(0, 4);
    const hidden = tags.slice(4);
    
    let html = visible.map(tag => 
      `<span class="badge bg-secondary">${tag}</span>`
    ).join('');

    if (hidden.length) {
      html += `
        <span class="d-none extra-tags">
          ${hidden.map(tag => `<span class="badge bg-secondary">${tag}</span>`).join('')}
        </span>
        <button class="toggle-more btn btn-sm btn-link p-0">+${hidden.length} more</button>
      `;
    }

    return html;
  };

  // Update Gallery Function
  const updateGallery = (photos) => {
    const gallery = document.getElementById('photoGallery');
    if (!photos || !photos.length) {
      gallery.innerHTML = '<p class="text-center py-4">No photos found</p>';
      return;
    }

    gallery.innerHTML = photos.map(photo => `
      <div class="col-md-4 mb-4" data-photo-id="${photo.id}">
        <div class="card h-100">
          <img src="/static/uploads/${photo.image_path}" class="card-img-top">
          <div class="card-body">
            <h5 class="card-title">${capitalizeFirst(photo.title)}</h5>
            <p class="card-text" title="${photo.description || ''}">
              ${truncateText(photo.description)}
            </p>
            <div class="tags">
              ${renderTags(photo.tags)}
            </div>
            <div class="mt-auto pt-2">
              <button class="btn btn-sm btn-primary edit-photo">Edit</button>
              <button class="btn btn-sm btn-danger ms-2 delete-photo">Delete</button>
            </div>
          </div>
        </div>
      </div>
    `).join('');

    attachEventListeners();
  };

  // Attach Event Listeners
  const attachEventListeners = () => {
    // Toggle More Tags
    document.querySelectorAll('.toggle-more').forEach(btn => {
      btn.addEventListener('click', function() {
        const extraTags = this.previousElementSibling;
        extraTags.classList.toggle('d-none');
        this.textContent = extraTags.classList.contains('d-none') ? 
          `+${extraTags.querySelectorAll('.badge').length} more` : 'Hide';
      });
    });

    // ... (rest of your event listeners)
  };

  // Initialize
  fetch('/photos')
    .then(res => res.json())
    .then(updateGallery)
    .catch(err => console.error('Error:', err));
});
  // Upload form submit
  uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(uploadForm);
    try {
      const res = await fetch('/upload', { method: 'POST', body: formData });
      const data = await res.json();
      data.success ? location.reload() : alert('Upload failed');
    } catch (err) {
      console.error('Upload error:', err);
    }
  });

  // Search by tag
  searchBtn.addEventListener('click', () => {
    const tag = searchInput.value.trim();
    fetch(`/search?tag=${encodeURIComponent(tag)}`)
      .then(res => res.json())
      .then(updateGallery)
      .catch(err => {
        console.error('Search failed:', err);
        gallery.innerHTML = '<p>Search failed.</p>';
      });
  });

  // Update photo gallery with new photos
 function capitalizeFirst(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function truncateText(text, maxLength = 80) {
  return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
}

function updateGallery(photos) {
  const gallery = document.getElementById('photoGallery');
  gallery.innerHTML = photos.map(photo => {
    const visibleTags = photo.tags.slice(0, 4);
    const hiddenTags = photo.tags.slice(4);
    const moreButton = hiddenTags.length > 0
      ? `<button class="btn btn-sm btn-link toggle-tags">+${hiddenTags.length} more</button>`
      : '';

    const hiddenTagHtml = hiddenTags.map(tag =>
      `<span class="badge bg-secondary d-none extra-tag">${tag}</span>`).join(' ');

    return `
      <div class="col-md-4 mb-4" data-photo-id="${photo.id}">
        <div class="card">
          <img src="/static/uploads/${photo.image_path}" class="card-img-top" alt="${photo.title}">
          <div class="card-body">
            <h5 class="card-title">${capitalizeFirst(photo.title)}</h5>
            <p class="card-text">${truncateText(photo.description || '')}</p>
            <div class="tags">
              ${visibleTags.map(tag => `<span class="badge bg-secondary">${tag}</span>`).join(' ')}
              ${hiddenTagHtml}
              ${moreButton}
            </div>
            <button class="btn btn-sm btn-primary edit-photo">Edit</button>
            <button class="btn btn-sm btn-danger delete-photo">Delete</button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  attachEventListeners();
}


  // Attach events for dynamically rendered elements
  function attachEventListeners() {
    // Edit button click
    document.querySelectorAll('.edit-photo').forEach(button => {
      button.addEventListener('click', async (e) => {
        const card = e.target.closest('[data-photo-id]');
        const id = card.dataset.photoId;
        const title = card.querySelector('.card-title').textContent;
        const description = card.querySelector('.card-text').textContent;
        const tags = Array.from(card.querySelectorAll('.badge')).map(b => b.textContent).join(', ');

        document.getElementById('editPhotoId').value = id;
        document.getElementById('editTitle').value = title;
        document.getElementById('editDescription').value = description;
        document.getElementById('editTags').value = tags;

        new bootstrap.Modal(document.getElementById('editModal')).show();
      });
    });

    // Delete button click
    document.querySelectorAll('.delete-photo').forEach(button => {
      button.addEventListener('click', async (e) => {
        const photoId = e.target.closest('[data-photo-id]').dataset.photoId;
        if (confirm('Are you sure you want to delete this photo?')) {
          try {
            const res = await fetch(`/photo/${photoId}/delete`, {
              method: 'DELETE',
              headers: {
                'X-CSRFToken': document.querySelector('input[name="csrf_token"]').value
              }
            });
            const data = await res.json();
            if (data.success) {
              e.target.closest('[data-photo-id]').remove();
            }
          } catch (err) {
            console.error('Delete failed:', err);
          }
        }
      });
    });

    // Toggle extra tags
    document.querySelectorAll('.toggle-tags').forEach(button => {
      button.addEventListener('click', () => {
        const tags = button.closest('.tags').querySelectorAll('.extra-tag');
        tags.forEach(tag => tag.classList.toggle('d-none'));
        button.remove();
      });
    });
  }
  // Toggle More Tags Functionality
document.addEventListener('click', function(e) {
  if (e.target.classList.contains('toggle-more')) {
    const moreTags = e.target.previousElementSibling;
    moreTags.classList.toggle('d-none');
    e.target.textContent = moreTags.classList.contains('d-none') ? 
      `+${moreTags.querySelectorAll('.badge').length}` : 'Hide';
  }
});

  // Handle Edit Form submit
  editForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const photoId = document.getElementById('editPhotoId').value;
    const updatedData = {
      title: document.getElementById('editTitle').value,
      description: document.getElementById('editDescription').value,
      tags: document.getElementById('editTags').value
    };

    try {
      const res = await fetch(`/photo/${photoId}/edit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': document.querySelector('input[name="csrf_token"]').value
        },
        body: JSON.stringify(updatedData)
      });
      const result = await res.json();
      result.success ? location.reload() : alert('Edit failed');
    } catch (err) {
      console.error('Edit failed:', err);
    }
  });

  // Initial binding
  attachEventListeners();
});
