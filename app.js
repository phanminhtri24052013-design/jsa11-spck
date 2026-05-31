// --- 1. QUẢN LÝ TÀI KHOẢN (Đăng ký, Đăng nhập, Đăng xuất) ---

window.register = function () {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    // Kiểm tra nhập liệu trống
    if (!email || !password || !confirmPassword) {
        return alert("Vui lòng nhập đầy đủ tất cả các trường dữ liệu!");
    }

    // Kiểm tra mật khẩu trùng khớp
    if (password !== confirmPassword) {
        return alert("Mật khẩu xác nhận không trùng khớp! Vui lòng kiểm tra lại.");
    }

    // Tự động ghi lại ngày đăng ký tài khoản
    const today = new Date();
    const createdDate = today.getDate() + '/' + (today.getMonth() + 1) + '/' + today.getFullYear();

    // Tên hiển thị mặc định ban đầu lấy từ Email
    const defaultName = email.split('@')[0];

    const userData = { 
        email: email, 
        password: password,
        displayName: defaultName,
        createdAt: createdDate
    };

    localStorage.setItem("user_db", JSON.stringify(userData));
    alert("Đăng ký thành công! Hãy dùng tài khoản này để đăng nhập.");
    window.location.href = "login.html"; // Chuyển hướng ngay sang trang đăng nhập
};

window.login = function () {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const storedUser = JSON.parse(localStorage.getItem("user_db"));

    if (storedUser && storedUser.email === email && storedUser.password === password) {
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("currentUser", email);
        alert("Đăng nhập thành công!");
        window.location.href = "index.html"; 
    } else {
        alert("Email hoặc mật khẩu không chính xác!");
    }
};

window.logout = function () {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("currentUser");
    alert("Đã đăng xuất!");
    window.location.href = "login.html"; 
};

// Cập nhật lại tên hiển thị cá nhân ở phía dưới thanh Sidebar trái
function updateUserSidebarDisplay() {
    const storedUser = JSON.parse(localStorage.getItem("user_db"));
    const email = localStorage.getItem("currentUser");
    const userDisplaySpan = document.getElementById("userDisplay");
    
    if (userDisplaySpan) {
        if (storedUser && storedUser.displayName) {
            userDisplaySpan.innerText = storedUser.displayName;
        } else if (email) {
            userDisplaySpan.innerText = email.split('@')[0];
        }
    }
}


// --- 2. XỬ LÝ DỮ LIỆU NHẠC (ITUNES API) ---

let currentDataSongs = []; 

window.loadFeaturedMusic = function() {
    switchTab('discover');
};

window.searchMusic = function() {
    const searchInput = document.getElementById("searchInput");
    const query = searchInput.value;

    if (!query) return alert("Nhập tên bài hát bạn muốn tìm!");

    searchInput.value = "";
    document.getElementById("sectionTitle").innerText = `Kết quả tìm kiếm cho: "${query}"`;
    
    document.querySelectorAll('.sidebar li').forEach(li => li.classList.remove('active'));
    document.getElementById('nav-discover').classList.add('active');

    fetchAndDisplay(query, false);
};

async function fetchAndDisplay(query, isFeatured) {
    const list = document.getElementById("musicList");
    list.innerHTML = `<div class="loader">${isFeatured ? "Đang tải gợi ý..." : "Đang tìm kiếm..."}</div>`;

    try {
        const response = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=15`);
        const data = await response.json();

        if (data.results.length === 0) {
            list.innerHTML = "<p>Không tìm thấy kết quả phù hợp.</p>";
            return;
        }

        currentDataSongs = data.results; 
        displayMusic(data.results);
    } catch (error) {
        console.error("Lỗi API:", error);
        list.innerHTML = "<p>Lỗi kết nối máy chủ.</p>";
    }
}

function displayMusic(songs, isInsidePlaylist = false, currentPlaylistName = "") {
    const list = document.getElementById("musicList");
    list.innerHTML = ""; 

    const favorites = getFavorites();

    songs.forEach(song => {
        const cover = song.artworkUrl100.replace('100x100bb.jpg', '400x400bb.jpg');
        const isFav = favorites.some(fav => fav.trackId === song.trackId);

        let playlistActionBtn = `
            <button class="playlist-btn" title="Thêm vào playlist" onclick="addTrackToPlaylistPrompt(${song.trackId})">
                <i class="fas fa-plus"></i>
            </button>`;
        
        if (isInsidePlaylist) {
            playlistActionBtn = `
                <button class="playlist-btn" style="color: #e63946;" title="Xóa khỏi playlist" onclick="removeTrackFromPlaylist('${currentPlaylistName}', ${song.trackId})">
                    <i class="fas fa-trash-alt"></i>
                </button>`;
        }

        list.innerHTML += `
            <div class="music-card">
                <div class="cover-wrapper">
                    <img src="${cover}" alt="${song.trackName}">
                    <button class="fav-btn ${isFav ? 'active' : ''}" onclick="toggleFavorite(${song.trackId}, ${isInsidePlaylist}, '${currentPlaylistName}')">
                        <i class="${isFav ? 'fas' : 'far'} fa-heart"></i>
                    </button>
                    <button class="play-btn" onclick="window.open('${song.trackViewUrl}')">
                        <i class="fas fa-play"></i>
                    </button>
                    ${playlistActionBtn}
                </div>
                <div class="card-info">
                    <h3>${song.trackName}</h3>
                    <p>${song.artistName}</p>
                </div>
                <audio controls class="mini-player">
                    <source src="${song.previewUrl}" type="audio/mpeg">
                </audio>
            </div>
        `;
    });
}


// --- 3. QUẢN LÝ THƯ VIỆN YÊU THÍCH ---

function getFavorites() {
    const currentUser = localStorage.getItem("currentUser") || "guest";
    return JSON.parse(localStorage.getItem(`fav_${currentUser}`)) || [];
}

window.toggleFavorite = function(trackId, isInsidePlaylist = false, currentPlaylistName = "") {
    const currentUser = localStorage.getItem("currentUser") || "guest";
    let favorites = getFavorites();
    const index = favorites.findIndex(song => song.trackId === trackId);

    if (index > -1) {
        favorites.splice(index, 1);
    } else {
        const songData = currentDataSongs.find(song => song.trackId === trackId);
        if (songData) favorites.push(songData);
    }

    localStorage.setItem(`fav_${currentUser}`, JSON.stringify(favorites));

    if (document.getElementById('nav-library').classList.contains('active')) {
        showLibrary();
    } else if (isInsidePlaylist) {
        showPlaylistTracks(currentPlaylistName);
    } else {
        displayMusic(currentDataSongs);
    }
};

window.showLibrary = function() {
    document.getElementById("sectionTitle").innerText = "Bài hát yêu thích của bạn";
    const favorites = getFavorites();
    currentDataSongs = favorites; 

    if (favorites.length === 0) {
        document.getElementById("musicList").innerHTML = "<p style='grid-column: 1/-1; text-align:center; color: var(--text-sub)'>Chưa có bài hát yêu thích nào.</p>";
    } else {
        displayMusic(favorites);
    }
};


// =========================================================================
// --- 4. LOGIC XỬ LÝ PLAYLIST ---
// =========================================================================

function getUserPlaylists() {
    const currentUser = localStorage.getItem("currentUser") || "guest";
    return JSON.parse(localStorage.getItem(`playlists_${currentUser}`)) || {};
}

function saveUserPlaylists(playlists) {
    const currentUser = localStorage.getItem("currentUser") || "guest";
    localStorage.setItem(`playlists_${currentUser}`, JSON.stringify(playlists));
}

window.showPlaylistsMenu = function() {
    document.getElementById("sectionTitle").innerText = "Danh sách Playlist của bạn";
    const list = document.getElementById("musicList");
    list.innerHTML = "";

    const actionHeader = document.createElement('div');
    actionHeader.className = 'playlist-header-actions';
    actionHeader.innerHTML = `
        <input type="text" id="newPlaylistName" class="input-playlist" placeholder="Nhập tên playlist mới...">
        <button class="btn-create-playlist" onclick="createNewPlaylist()">Tạo Playlist</button>
    `;
    list.parentNode.insertBefore(actionHeader, list);

    const playlistGrid = document.createElement('div');
    playlistGrid.className = 'playlist-grid';
    
    const playlists = getUserPlaylists();
    const playlistNames = Object.keys(playlists);

    if (playlistNames.length === 0) {
        playlistGrid.innerHTML = "<p style='text-align:center; color: var(--text-sub); grid-column: 1/-1;'>Bạn chưa tạo playlist nào cả.</p>";
    } else {
        playlistNames.forEach(name => {
            const songCount = playlists[name].length;
            playlistGrid.innerHTML += `
                <div class="playlist-card" onclick="showPlaylistTracks('${name}')">
                    <button class="delete-playlist-btn" onclick="event.stopPropagation(); deletePlaylist('${name}')">
                        <i class="fas fa-times"></i>
                    </button>
                    <i class="fas fa-music"></i>
                    <h4>${name}</h4>
                    <p>${songCount} bài hát</p>
                </div>
            `;
        });
    }
    list.appendChild(playlistGrid);
};

window.createNewPlaylist = function() {
    const input = document.getElementById("newPlaylistName");
    const name = input.value.trim();

    if (!name) return alert("Vui lòng nhập tên Playlist!");

    let playlists = getUserPlaylists();

    if (playlists[name]) {
        return alert("Playlist này đã tồn tại!");
    }

    playlists[name] = []; 
    saveUserPlaylists(playlists);
    
    removePlaylistActionHeader();
    showPlaylistsMenu();
};

window.deletePlaylist = function(name) {
    if (confirm(`Bạn có chắc chắn muốn xóa playlist "${name}" không?`)) {
        let playlists = getUserPlaylists();
        delete playlists[name];
        saveUserPlaylists(playlists);
        removePlaylistActionHeader();
        showPlaylistsMenu();
    }
};

// --- POP-UP NỔI LÊN ĐỂ CLICK CHUỘT CHỌN NHANH PLAYLIST THAY VÌ NHẬP SỐ ---
window.addTrackToPlaylistPrompt = function(trackId) {
    const playlists = getUserPlaylists();
    const playlistNames = Object.keys(playlists);

    if (playlistNames.length === 0) {
        return alert("Bạn chưa có playlist nào. Hãy chuyển sang mục 'Playlist' để tạo trước!");
    }

    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'playlist-modal-overlay';
    modalOverlay.id = 'playlistSelectModal';

    let listItemsHTML = '';
    playlistNames.forEach(name => {
        listItemsHTML += `
            <div class="playlist-modal-item" onclick="executeAddToPlaylist('${name}', ${trackId})">
                <i class="fas fa-list-ul"></i> ${name}
            </div>
        `;
    });

    modalOverlay.innerHTML = `
        <div class="playlist-modal-card">
            <h3>Thêm bài hát vào Playlist</h3>
            <div class="playlist-modal-list">
                ${listItemsHTML}
            </div>
            <button class="btn-close-modal" onclick="document.getElementById('playlistSelectModal').remove()">Đóng</button>
        </div>
    `;

    document.body.appendChild(modalOverlay);

    modalOverlay.addEventListener('click', function(e) {
        if (e.target === modalOverlay) {
            modalOverlay.remove();
        }
    });
};

window.executeAddToPlaylist = function(targetPlaylist, trackId) {
    const playlists = getUserPlaylists();

    const isExist = playlists[targetPlaylist].some(song => song.trackId === trackId);
    if (isExist) {
        return alert(`Bài hát này đã có sẵn trong playlist "${targetPlaylist}" rồi!`);
    }

    const songData = currentDataSongs.find(song => song.trackId === trackId);
    if (songData) {
        playlists[targetPlaylist].push(songData);
        saveUserPlaylists(playlists);
        alert(`Đã thêm thành công vào playlist: ${targetPlaylist}`);
        
        const modal = document.getElementById('playlistSelectModal');
        if (modal) modal.remove();
    } else {
        alert("Không tìm thấy dữ liệu bài hát hiện tại để thêm.");
    }
};

window.showPlaylistTracks = function(name) {
    removePlaylistActionHeader();
    document.getElementById("sectionTitle").innerText = `Playlist: ${name}`;
    
    const playlists = getUserPlaylists();
    const tracks = playlists[name] || [];
    currentDataSongs = tracks; 

    const list = document.getElementById("musicList");
    if (list) {
        list.style.display = "grid"; 
        list.style.width = "100%";
    }

    if (tracks.length === 0) {
        document.getElementById("musicList").innerHTML = "<p style='grid-column: 1/-1; text-align:center; color: var(--text-sub)'>Chưa có bài hát nào trong playlist này.</p>";
    } else {
        displayMusic(tracks, true, name);
    }
};

window.removeTrackFromPlaylist = function(playlistName, trackId) {
    let playlists = getUserPlaylists();
    if (playlists[playlistName]) {
        playlists[playlistName] = playlists[playlistName].filter(song => song.trackId !== trackId);
        saveUserPlaylists(playlists);
        showPlaylistTracks(playlistName); 
    }
};

function removePlaylistActionHeader() {
    const oldHeader = document.querySelector('.playlist-header-actions');
    if (oldHeader) oldHeader.remove();
}



// --- 5. LOGIC XỬ LÝ TRANG PROFILE (HỒ SƠ CÁ NHÂN) ---

window.showProfilePage = function() {
    const email = localStorage.getItem("currentUser") || "Chưa có dữ liệu";
    let storedUser = JSON.parse(localStorage.getItem("user_db"));
    
    if (!storedUser) {
        storedUser = { email: email, displayName: email.split('@')[0], createdAt: "Hôm nay" };
    }
    if (!storedUser.createdAt) storedUser.createdAt = "24/5/2026"; 

    document.getElementById("sectionTitle").innerText = "Thông tin tài khoản";
    const list = document.getElementById("musicList");
    
    // ÉP THẺ LIST BỎ CHẾ ĐỘ GRID ĐỂ KHUNG PROFILE ĐƯỢC GIÃN RỘNG TOÀN MÀN HÌNH
    list.style.display = "block";
    list.style.width = "100%";
    
    list.innerHTML = `
        <div class="profile-container">
            <div class="profile-row">
                <label>Email Đăng Nhập</label>
                <span>${storedUser.email}</span>
            </div>
            <div class="profile-row">
                <label>Tên Hiển Thị</label>
                <input type="text" id="updateNameInput" class="input-profile" value="${storedUser.displayName || ''}" placeholder="Nhập tên hiển thị mới...">
            </div>
            <div class="profile-row">
                <label>Ngày Tạo Tài Khoản</label>
                <span>${storedUser.createdAt}</span>
            </div>
            <button class="btn-save-profile" onclick="saveProfileChanges()">Lưu Thay Đổi</button>
        </div>
    `;
};


window.saveProfileChanges = function() {
    const newName = document.getElementById("updateNameInput").value.trim();
    if (!newName) return alert("Tên hiển thị không được để trống!");

    let storedUser = JSON.parse(localStorage.getItem("user_db"));
    if (storedUser) {
        storedUser.displayName = newName;
        localStorage.setItem("user_db", JSON.stringify(storedUser));
        alert("Đã cập nhật tên hiển thị thành công!");
        updateUserSidebarDisplay(); 
    }
};


// --- 6. ĐIỀU HƯỚNG CÁC TAB TRÊN SIDEBAR ---

window.switchTab = function(tab) {
    removePlaylistActionHeader();
    document.querySelectorAll('.sidebar li').forEach(li => li.classList.remove('active'));
    
    const searchHeader = document.getElementById("mainSearchHeader");
    const list = document.getElementById("musicList");
    
    // KHÔI PHỤC LẠI CHẾ ĐỘ GRID MẶC ĐỊNH CHO CÁC MÀN HÌNH DANH SÁCH BÀI HÁT
    if (list) {
        list.style.display = "grid";
    }

    if (tab === 'discover') {
        if (searchHeader) searchHeader.style.display = "flex";
        document.getElementById('nav-discover').classList.add('active');
        document.getElementById("sectionTitle").innerText = "Gợi ý cho bạn";
        fetchAndDisplay("V-Pop mới nhất", true);
    } else if (tab === 'library') {
        if (searchHeader) searchHeader.style.display = "flex";
        document.getElementById('nav-library').classList.add('active');
        showLibrary();
    } else if (tab === 'playlist') {
        if (searchHeader) searchHeader.style.display = "flex";
        document.getElementById('nav-playlist').classList.add('active');
        showPlaylistsMenu();
    } else if (tab === 'profile') {
        if (searchHeader) searchHeader.style.display = "none"; 
        document.getElementById('nav-profile').classList.add('active');
        showProfilePage(); // Hàm này sẽ tự chuyển sang block
    }
};


document.addEventListener("DOMContentLoaded", function() {
    const input = document.getElementById("searchInput");
    if (input) {
        input.addEventListener("keypress", function(event) {
            if (event.key === "Enter") {
                event.preventDefault();
                searchMusic();
            }
        });
    }
});