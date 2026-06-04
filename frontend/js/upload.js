const API_BASE = 'http://127.0.0.1:8000/api';
const token = localStorage.getItem('access_token');
const params = new URLSearchParams(window.location.search);
const hostelId = params.get('hostel_id');

let selectedFiles = [];

// Check auth on page load
if (!token) {
    window.location.href = 'login.html';
}

// Load hostel name and existing images
window.addEventListener('DOMContentLoaded', () => {
    if (!hostelId) {
        document.getElementById('hostel-name-display').textContent = 'No hostel selected!';
        return;
    }
    loadGallery();
});

// ── Drag & Drop ──
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    handleFiles(e.dataTransfer.files);
});

dropZone.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', () => {
    handleFiles(fileInput.files);
});

// ── Handle Selected Files ──
function handleFiles(files) {
    selectedFiles = Array.from(files).filter(f => f.type.startsWith('image/'));

    if (selectedFiles.length === 0) return;

    document.getElementById('fileCount').textContent = selectedFiles.length;
    document.getElementById('previewSection').style.display = 'block';

    const grid = document.getElementById('previewGrid');
    grid.innerHTML = '';

    selectedFiles.forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const item = document.createElement('div');
            item.className = 'preview-item';
            item.innerHTML = `
                <img src="${e.target.result}" alt="Preview">
                <button class="remove-btn" onclick="removeFile(${index})">✕</button>
            `;
            grid.appendChild(item);
        };
        reader.readAsDataURL(file);
    });
}

// ── Remove File from Preview ──
function removeFile(index) {
    selectedFiles.splice(index, 1);
    handleFiles(selectedFiles);
    if (selectedFiles.length === 0) {
        document.getElementById('previewSection').style.display = 'none';
    }
}

// ── Upload All Images ──
document.getElementById('uploadBtn').addEventListener('click', async () => {
    if (selectedFiles.length === 0) return;

    const uploadBtn = document.getElementById('uploadBtn');
    const progressSection = document.getElementById('progressSection');
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');

    uploadBtn.disabled = true;
    progressSection.style.display = 'block';

    let uploaded = 0;
    const total = selectedFiles.length;

    for (const file of selectedFiles) {
        const formData = new FormData();
        formData.append('image', file);

        try {
            const response = await fetch(
                `${API_BASE}/hostels/${hostelId}/upload-image/`,
                {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: formData
                }
            );

            if (response.ok) {
                uploaded++;
                const percent = Math.round((uploaded / total) * 100);
                progressBar.style.width = percent + '%';
                progressText.textContent = `${uploaded} of ${total} uploaded`;
            }
        } catch (err) {
            console.error('Upload failed:', err);
        }
    }

    // Reset after upload
    setTimeout(() => {
        progressSection.style.display = 'none';
        document.getElementById('previewSection').style.display = 'none';
        selectedFiles = [];
        uploadBtn.disabled = false;
        loadGallery();
    }, 1000);
});

// ── Load Gallery from API ──
async function loadGallery() {
    try {
        const response = await fetch(
            `${API_BASE}/hostels/${hostelId}/images/`,
            {
                headers: { 'Authorization': `Bearer ${token}` }
            }
        );

        const images = await response.json();
        const grid = document.getElementById('galleryGrid');
        const noMsg = document.getElementById('noImagesMsg');

        if (images.length === 0) {
            noMsg.style.display = 'block';
            return;
        }

        noMsg.style.display = 'none';
        grid.innerHTML = '';

        images.forEach(img => {
            const item = document.createElement('div');
            item.className = 'gallery-item';
            item.innerHTML = `<img src="${img.image_url}" alt="Hostel Image">`;
            grid.appendChild(item);
        });

        document.getElementById('hostel-name-display').textContent =
            `Hostel ID: ${hostelId} — ${images.length} image(s) uploaded`;

    } catch (err) {
        console.error('Failed to load gallery:', err);
    }
}