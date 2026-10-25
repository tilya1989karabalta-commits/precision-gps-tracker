// Precision GPS - Professional Location Sharing App
// Admin: 0556-652-652 | MBank

const CONFIG = {
    adminPhone: '0556-652-652',
    defaultZoom: 16,
    highAccuracy: true,
    maxAge: 5000,
    timeout: 15000
};

let map, marker, watchId = null, currentPos = null, isFollowing = false;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initMap();
    bindEvents();
    loadAdminSettings();
    requestLocation();
});

function initMap() {
    map = L.map('map', {
        zoomControl: true,
        attributionControl: true
    }).setView([42.8746, 74.5698], 13); // Bishkek default

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap'
    }).addTo(map);

    // Custom marker icon
    const userIcon = L.divIcon({
        className: 'user-marker',
        iconSize: [18, 18],
        iconAnchor: [9, 9]
    });

    marker = L.marker([42.8746, 74.5698], { icon: userIcon }).addTo(map);
    marker.bindPopup('<b>Сиздин жериңиз</b><br>Жүктөлүүдө...');
}

function bindEvents() {
    document.getElementById('btn-locate').addEventListener('click', requestLocation);
    document.getElementById('btn-follow').addEventListener('click', toggleFollow);
    document.getElementById('btn-copy').addEventListener('click', copyCoords);
    document.getElementById('btn-share').addEventListener('click', openShareModal);
    document.getElementById('btn-close-share').addEventListener('click', () => {
        document.getElementById('share-modal').classList.add('hidden');
    });
    document.getElementById('btn-copy-link').addEventListener('click', copyShareLink);
    document.getElementById('btn-admin').addEventListener('click', openAdminModal);
    document.getElementById('btn-close-admin').addEventListener('click', () => {
        document.getElementById('admin-modal').classList.add('hidden');
    });
    document.getElementById('btn-save-admin').addEventListener('click', saveAdminSettings);
}

function requestLocation() {
    if (!navigator.geolocation) {
        updateStatus('GPS колдоого алынбайт', 'error');
        return;
    }

    updateStatus('Так жер изделүүдө...', 'loading');

    const options = {
        enableHighAccuracy: CONFIG.highAccuracy,
        maximumAge: CONFIG.maxAge,
        timeout: CONFIG.timeout
    };

    navigator.geolocation.getCurrentPosition(
        onSuccess,
        onError,
        options
    );
}

function onSuccess(pos) {
    currentPos = pos.coords;
    const { latitude, longitude, accuracy, altitude } = currentPos;

    // Update map
    const latlng = [latitude, longitude];
    marker.setLatLng(latlng);
    marker.setPopupContent(`
        <b>Сиздин жериңиз</b><br>
        ${latitude.toFixed(6)}, ${longitude.toFixed(6)}<br>
        Тактык: ±${Math.round(accuracy)} м
    `);

    if (!isFollowing) {
        map.setView(latlng, CONFIG.defaultZoom);
    } else {
        map.panTo(latlng);
    }

    // Update UI
    document.getElementById('status').textContent = 'Активдүү';
    document.getElementById('status').style.color = '#10b981';
    document.getElementById('accuracy').textContent = `±${Math.round(accuracy)} м`;
    document.getElementById('coords').textContent = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
    document.getElementById('altitude').textContent = altitude ? `${Math.round(altitude)} м` : '—';

    showToast('Жайгашкан жер такталды');
}

function onError(err) {
    let msg = 'Ката';
    switch (err.code) {
        case 1: msg = 'Уруксат берилген жок'; break;
        case 2: msg = 'Жайгашкан жер табылган жок'; break;
        case 3: msg = 'Убакыт бүттү'; break;
    }
    updateStatus(msg, 'error');
    showToast(msg, true);
}

function updateStatus(text, type = 'ok') {
    const el = document.getElementById('status');
    el.textContent = text;
    el.style.color = type === 'error' ? '#ef4444' : type === 'loading' ? '#f59e0b' : '#10b981';
}

function toggleFollow() {
    const btn = document.getElementById('btn-follow');
    if (isFollowing) {
        if (watchId) navigator.geolocation.clearWatch(watchId);
        watchId = null;
        isFollowing = false;
        btn.textContent = 'Көзөмөлдөө';
        btn.style.background = '';
        showToast('Көзөмөлдөө токтотулду');
    } else {
        if (!navigator.geolocation) return;
        isFollowing = true;
        btn.textContent = 'Токтотуу';
        btn.style.background = '#ef4444';
        watchId = navigator.geolocation.watchPosition(onSuccess, onError, {
            enableHighAccuracy: true,
            maximumAge: 3000,
            timeout: 10000
        });
        showToast('Үзгүлтүксүз көзөмөлдөө башталды');
    }
}

function copyCoords() {
    if (!currentPos) {
        showToast('Адегенде жерди табыңыз', true);
        return;
    }
    const text = `${currentPos.latitude.toFixed(6)}, ${currentPos.longitude.toFixed(6)}`;
    navigator.clipboard.writeText(text).then(() => {
        showToast('Координаттар көчүрүлдү');
    }).catch(() => {
        showToast('Көчүрүү ишке ашкан жок', true);
    });
}

function openShareModal() {
    if (!currentPos) {
        showToast('Адегенде жерди табыңыз', true);
        return;
    }
    const link = `${window.location.origin}${window.location.pathname}?lat=${currentPos.latitude}&lng=${currentPos.longitude}&acc=${Math.round(currentPos.accuracy)}`;
    document.getElementById('share-link').value = link;
    document.getElementById('share-modal').classList.remove('hidden');
}

function copyShareLink() {
    const input = document.getElementById('share-link');
    input.select();
    navigator.clipboard.writeText(input.value).then(() => {
        showToast('Шилтеме көчүрүлдү');
    });
}

function openAdminModal() {
    document.getElementById('admin-modal').classList.remove('hidden');
}

function loadAdminSettings() {
    const name = localStorage.getItem('adminName') || 'Admin';
    document.getElementById('admin-name').value = name;
}

function saveAdminSettings() {
    const name = document.getElementById('admin-name').value.trim() || 'Admin';
    const pass = document.getElementById('admin-pass').value;
    localStorage.setItem('adminName', name);
    if (pass) localStorage.setItem('adminPass', pass);
    showToast('Админ маалыматы сакталды');
    document.getElementById('admin-modal').classList.add('hidden');
}

function showToast(msg, isError = false) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.style.background = isError ? '#ef4444' : '#10b981';
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 2500);
}

// Handle shared location from URL
window.addEventListener('load', () => {
    const params = new URLSearchParams(window.location.search);
    const lat = parseFloat(params.get('lat'));
    const lng = parseFloat(params.get('lng'));
    if (!isNaN(lat) && !isNaN(lng)) {
        map.setView([lat, lng], 17);
        L.marker([lat, lng]).addTo(map)
            .bindPopup(`Бөлүшүлгөн жер<br>${lat.toFixed(6)}, ${lng.toFixed(6)}`)
            .openPopup();
        showToast('Бөлүшүлгөн жер ачылды');
    }
});

// Service Worker for PWA
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
}