 // ===== 全局变量 =====
        const API_BASE_URL = "https://neteasecloudmusicapibackup-production.up.railway.app";
       
// ===== IndexedDB =====
let db = null;

function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('JinyuMusicDB', 1);
        request.onupgradeneeded = function(e) {
            const db = e.target.result;
            if (!db.objectStoreNames.contains('audios')) {
                db.createObjectStore('audios', { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains('lyrics')) {
                db.createObjectStore('lyrics', { keyPath: 'id' });
            }
        };
        request.onsuccess = function(e) {
            db = e.target.result;
            resolve(db);
        };
        request.onerror = function(e) {
            reject(e);
        };
    });
}

function saveAudioToDB(id, file) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction('audios', 'readwrite');
        const store = tx.objectStore('audios');
        store.put({ id, file });
        tx.oncomplete = () => resolve();
        tx.onerror = (e) => reject(e);
    });
}

function getAudioFromDB(id) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction('audios', 'readonly');
        const store = tx.objectStore('audios');
        const request = store.get(id);
        request.onsuccess = () => resolve(request.result);
        request.onerror = (e) => reject(e);
    });
}

function saveLyricToDB(id, lyricText) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction('lyrics', 'readwrite');
        const store = tx.objectStore('lyrics');
        store.put({ id, lyricText });
        tx.oncomplete = () => resolve();
        tx.onerror = (e) => reject(e);
    });
}

function getLyricFromDB(id) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction('lyrics', 'readonly');
        const store = tx.objectStore('lyrics');
        const request = store.get(id);
        request.onsuccess = () => resolve(request.result);
        request.onerror = (e) => reject(e);
    });
}

function deleteAudioFromDB(id) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction('audios', 'readwrite');
        const store = tx.objectStore('audios');
        store.delete(id);
        tx.oncomplete = () => resolve();
        tx.onerror = (e) => reject(e);
    });
}


        // 播放器变量
        const audioPlayer = new Audio();
        audioPlayer.volume = 1.0;
        let isPlaying = false;
        let playMode = 'order';
        let currentLyrics = [];
        let currentLyricIndex = -1;
        let currentPlaylist = [];
        let currentTrackIndex = 0;
        let currentPlaylistId = null;

        // 个人主页变量
        let cropper = null;
        let currentTarget = null;
        let currentBadgeId = null;
        let currentProfilePlaylistId = null;
        let newPlaylistCover = '';
        let editPlaylistCover = '';
        let newBadgeImg = '';
        let nextBadgeId = 7;
        let nextPlaylistId = 4;
        let isManageMode = false;
        let selectedSongs = new Set();

        // 徽章数据
        const badgesData = {
            badge1: { name: '听歌达人', emoji: '🎧', condition: '累计听歌超过100首', progress: '150/100 首', unlocked: true, customImg: '' },
            badge2: { name: '音乐英才', emoji: '🎹', condition: '完成音乐测试', progress: '0/1 次', unlocked: false, customImg: '' },
            badge3: { name: '英文歌爱好者', emoji: '🌍', condition: '收藏英文歌超过50首', progress: '68/50 首', unlocked: true, customImg: '' },
            badge4: { name: '小众歌探索者', emoji: '🔍', condition: '发现小众歌曲20首', progress: '5/20 首', unlocked: false, customImg: '' },
            badge5: { name: '悲情歌手', emoji: '💔', condition: '收藏悲伤歌曲30首', progress: '12/30 首', unlocked: false, customImg: '' },
            badge6: { name: 'K歌之王', emoji: '🎤', condition: 'K歌录音10次', progress: '3/10 次', unlocked: false, customImg: '' }
        };

        // 歌单数据
        let playlistsData = {
            playlist1: { name: '我喜欢', icon: '❤️', cover: '', desc: '点击编辑按钮修改歌单信息', songs: [] },
            playlist2: { name: '古风精选', icon: '🎋', cover: '', desc: '古风歌曲精选集', songs: [] },
            playlist3: { name: '夜听精选', icon: '🌙', cover: '', desc: '适合夜晚聆听的音乐', songs: [] }
        };

        // DOM元素
        const btnPlay = document.getElementById('btnPlay');
        const btnPlaylist = document.getElementById('btnPlaylist');
        const btnMode = document.getElementById('btnMode');
        const progressBar = document.getElementById('progressBar');
        const progressFill = document.getElementById('progressFill');
        const progressHandle = document.getElementById('progressHandle');
        const currentTimeEl = document.getElementById('currentTime');
        const totalTimeEl = document.getElementById('totalTime');
        const songTitleText = document.getElementById('songTitleText');
        const songTitleInput = document.getElementById('songTitleInput');
        const songTitleBox = document.querySelector('.song-title-box');

        const playIcon = `<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>`;
        const pauseIcon = `<svg viewBox="0 0 24 24"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/></svg>`;

        // ===== 底部导航切换 =====
        function switchPage(page) {
            const playerPage = document.getElementById('playerPage');
            const profileMainPage = document.getElementById('profileMainPage');
            const navPlay = document.getElementById('navPlay');
            const navProfile = document.getElementById('navProfile');

            if (page === 'play') {
                playerPage.classList.remove('hidden');
                profileMainPage.classList.remove('active');
                navPlay.classList.add('active');
                navProfile.classList.remove('active');
            } else {
                playerPage.classList.add('hidden');
                profileMainPage.classList.add('active');
                navPlay.classList.remove('active');
                navProfile.classList.add('active');

                // 切换到个人主页时同步歌单封面到播放器
                syncCoversToPlayer();
            }
        }

        // ===== 同步歌单封面到播放器歌单选择弹窗 =====
        function syncCoversToPlayer() {
            // 更新个人主页歌单封面显示
            Object.keys(playlistsData).forEach(playlistId => {
                const playlist = playlistsData[playlistId];
                const coverEl = document.getElementById(`${playlistId}-cover`);
                if (coverEl) {
                    const coverBox = coverEl.parentElement;
                    if (playlist.cover) {
                        coverEl.src = playlist.cover;
                        coverBox.classList.add('has-cover');
                    } else {
                        coverEl.src = '';
                        coverBox.classList.remove('has-cover');
                    }
                }
            });
        }

        // ===== 工具函数 =====
        function formatTime(seconds) {
            if (!seconds || isNaN(seconds)) return '00:00';
            const mins = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }

        function parseLRC(lrcText) {
            const lines = lrcText.split('\n');
            const lyrics = [];
            lines.forEach(line => {
                const match = line.match(/\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/);
                if (match) {
                    const minutes = parseInt(match[1]);
                    const seconds = parseInt(match[2]);
                    const milliseconds = parseInt(match[3].padEnd(3, '0'));
                    const text = match[4].trim();
                    if (text) {
                        const time = minutes * 60 + seconds + milliseconds / 1000;
                        lyrics.push({ time, text });
                    }
                }
            });
            lyrics.sort((a, b) => a.time - b.time);
            return lyrics;
        }

        // ===== localStorage存取 =====
        function saveData() {
            const saveablePlaylists = {};
            Object.keys(playlistsData).forEach(playlistId => {
                const playlist = playlistsData[playlistId];
                saveablePlaylists[playlistId] = {
                    name: playlist.name,
                    icon: playlist.icon,
                    cover: playlist.cover,
                    desc: playlist.desc,
                    songs: playlist.songs.map(s => {
    if (s.source === 'netease') {
        return {
            id: s.id,
            name: s.name,
            artist: s.artist,
            cover: s.cover,
            source: 'netease',
            lrcId: s.lrcId || null
        };
    } else if (s.source === 'local') {
        return {
            name: s.name,
            artist: s.artist,
            dbId: s.dbId,
            source: 'local',
            lrcId: s.lrcId || null
        };
    }
    return null;
}).filter(Boolean)

                };
            });
            localStorage.setItem('jinyu_playlists', JSON.stringify(saveablePlaylists));
            console.log('✅ 歌单数据已保存');
        }

        function loadData() {
            const saved = localStorage.getItem('jinyu_playlists');
            if (!saved) return;
            try {
                const savedPlaylists = JSON.parse(saved);
                Object.keys(savedPlaylists).forEach(playlistId => {
                    if (playlistsData[playlistId]) {
                        playlistsData[playlistId].songs = savedPlaylists[playlistId].songs || [];
                        playlistsData[playlistId].cover = savedPlaylists[playlistId].cover || '';
                        playlistsData[playlistId].desc = savedPlaylists[playlistId].desc || '';
                        playlistsData[playlistId].name = savedPlaylists[playlistId].name || playlistsData[playlistId].name;
                    }
                });
                console.log('✅ 歌单数据已读取');
            } catch(e) {
                console.error('读取数据失败:', e);
            }
        }
        // ===== 播放模式切换 =====
        btnMode.addEventListener('click', function(e) {
            e.stopPropagation();
            if (playMode === 'order') {
                playMode = 'random';
                btnMode.className = 'control-flower mode-flower mode-random';
                alert('✅ 已切换到：随机播放');
            } else if (playMode === 'random') {
                playMode = 'single';
                btnMode.className = 'control-flower mode-flower mode-single';
                alert('✅ 已切换到：单曲循环');
            } else {
                playMode = 'order';
                btnMode.className = 'control-flower mode-flower mode-order';
                alert('✅ 已切换到：顺序播放');
            }
        });

        function getNextTrackIndex() {
            if (playMode === 'single') return currentTrackIndex;
            if (playMode === 'random') {
                if (currentPlaylist.length <= 1) return 0;
                let randomIndex;
                do { randomIndex = Math.floor(Math.random() * currentPlaylist.length); }
                while (randomIndex === currentTrackIndex);
                return randomIndex;
            }
            let next = currentTrackIndex + 1;
            if (next >= currentPlaylist.length) return -1;
            return next;
        }

        // ===== 歌单选择弹窗 =====
        btnPlaylist.addEventListener('click', function(e) {
            e.stopPropagation();
            openPlaylistModal();
        });

        function openPlaylistModal() {
            const container = document.getElementById('playlistListInModal');
            container.innerHTML = '';

            Object.keys(playlistsData).forEach(playlistId => {
                const playlist = playlistsData[playlistId];
                const option = document.createElement('div');
                option.className = 'playlist-option';
                option.onclick = () => selectPlaylist(playlistId);

                // 封面缩略图（同步个人主页封面）
                const hasCover = !!playlist.cover;
                option.innerHTML = `
                    <div class="playlist-option-cover ${hasCover ? 'has-cover' : ''}">
                        <img src="${playlist.cover || ''}" alt="">
                        <span class="cover-icon">${playlist.icon}</span>
                    </div>
                    <div class="playlist-option-info">
                        <div class="playlist-option-name">${playlist.name}</div>
                        <div class="playlist-option-count">${playlist.songs.length} 首歌曲</div>
                    </div>
                `;
                container.appendChild(option);
            });

            document.getElementById('playlistModal').classList.add('active');
        }

        function closePlaylistModal() {
            document.getElementById('playlistModal').classList.remove('active');
        }

        document.getElementById('closePlaylistBtn').addEventListener('click', closePlaylistModal);

        function selectPlaylist(playlistId) {
            currentPlaylistId = playlistId;
            const playlist = playlistsData[playlistId];
            closePlaylistModal();
            if (playlist.songs.length === 0) {
                alert('⚠️ 这个歌单还没有歌曲！请先在个人主页导入！');
                return;
            }
            openSongListModal(playlistId);
        }

        function openSongListModal(playlistId) {
            const playlist = playlistsData[playlistId];
            const container = document.getElementById('songsListContainer');
            document.getElementById('songListTitle').textContent = `${playlist.name} - ${playlist.songs.length}首`;
            container.innerHTML = '';

            playlist.songs.forEach((song, index) => {
                const item = document.createElement('div');
                item.className = 'song-item';
                item.onclick = () => selectSong(playlistId, index);
                item.innerHTML = `
                    <div class="song-item-name">${index + 1}. ${song.name}</div>
                    <div class="song-item-artist">${song.artist}</div>
                `;
                container.appendChild(item);
            });

            document.getElementById('songListModal').classList.add('active');
        }

        function closeSongListModal() {
            document.getElementById('songListModal').classList.remove('active');
        }

        document.getElementById('closeSongListBtn').addEventListener('click', closeSongListModal);

        // ===== 选歌并播放（核心） =====
        async function selectSong(playlistId, songIndex) {
            const playlist = playlistsData[playlistId];
            currentPlaylist = playlist.songs;
            currentTrackIndex = songIndex;
            currentPlaylistId = playlistId;
            closeSongListModal();

            const song = currentPlaylist[songIndex];

                if (song.source === 'local' && song.dbId && !song.url) {
        try {
            const record = await getAudioFromDB(song.dbId);
            if (record && record.file) {
                song.url = URL.createObjectURL(record.file);
            } else {
                alert(`❌ 《${song.name}》的音频文件找不到了，请重新导入！`);
                return;
            }
        } catch(e) {
            alert(`❌ 读取本地音频失败！`);
            console.error(e);
            return;
        }
    }


            if (song.source === 'netease' && song.id) {
                songTitleText.textContent = '加载中...';
                if (song.cover) {
                    document.getElementById('coverImage').src = song.cover;
                }
                try {
                    const urlRes = await fetch(`${API_BASE_URL}/song/url/v1?id=${song.id}&level=standard`);
                    const urlData = await urlRes.json();

                    if (!urlData.data[0] || !urlData.data[0].url) {
                        alert(`❌ 《${song.name}》无法播放（可能是VIP或无版权）`);
                        songTitleText.textContent = song.name;
                        return;
                    }

                    song.url = urlData.data[0].url.replace('http://', 'https://');

                    const lyricRes = await fetch(`${API_BASE_URL}/lyric?id=${song.id}`);
                    const lyricData = await lyricRes.json();

                    if (lyricData.lrc && lyricData.lrc.lyric) {
                        song.lyrics = parseLRC(lyricData.lrc.lyric);
                    } else {
                        song.lyrics = [];
                    }

                } catch(e) {
                    alert('❌ 获取歌曲资源失败，请检查网络！');
                    console.error(e);
                    return;
                }
            }

            loadTrack(songIndex);

            setTimeout(() => {
                audioPlayer.play().then(() => {
                    isPlaying = true;
                    btnPlay.querySelector('.play-icon').innerHTML = pauseIcon;
                    document.querySelector('.album-cover-container').classList.add('playing');
                }).catch(err => {
                    console.error('播放失败:', err);
                    alert('⚠️ 播放失败！');
                });
            }, 100);
        }

        function loadTrack(index) {
            if (index < 0 || index >= currentPlaylist.length) return;
            const track = currentPlaylist[index];
            currentTrackIndex = index;

            audioPlayer.pause();
            isPlaying = false;
            btnPlay.querySelector('.play-icon').innerHTML = playIcon;
            document.querySelector('.album-cover-container').classList.remove('playing');

            audioPlayer.src = track.url || '';
            songTitleText.textContent = track.name;
            songTitleInput.value = track.name;

            progressFill.style.width = '0%';
            progressHandle.style.left = '0%';
            currentTimeEl.textContent = '00:00';
            totalTimeEl.textContent = '00:00';
            currentLyricIndex = -1;

            if (track.lyrics && track.lyrics.length > 0) {
                currentLyrics = track.lyrics;
                renderLyrics(currentLyrics);
            } else if (track.lrcId) {
                // 有lrcId就去IndexedDB读，不要清空
                getLyricFromDB(track.lrcId).then(record => {
                    if (record && record.lyricText) {
                        track.lyrics = parseLRC(record.lyricText);
                        currentLyrics = track.lyrics;
                        renderLyrics(currentLyrics);
                    } else {
                        currentLyrics = [];
                        renderLyrics([]);
                    }
                });
            } else {
                currentLyrics = [];
                renderLyrics([]);
            }

        }

        // ===== 歌词渲染和高亮 =====
        function renderLyrics(lyrics) {
            const lyricsScroll = document.getElementById('lyricsScroll');
            if (lyrics.length === 0) {
                lyricsScroll.innerHTML = '<div class="lyric-line">暂无歌词</div>';
                return;
            }
            lyricsScroll.innerHTML = '';
            lyrics.forEach((lyric, index) => {
                const line = document.createElement('div');
                line.className = 'lyric-line';
                line.textContent = lyric.text;
                line.dataset.index = index;
                lyricsScroll.appendChild(line);
            });
        }

        function updateLyricHighlight(currentTime) {
            if (currentLyrics.length === 0) return;
            const lyricsScroll = document.getElementById('lyricsScroll');
            const lines = lyricsScroll.querySelectorAll('.lyric-line');

            let activeIndex = -1;
            for (let i = currentLyrics.length - 1; i >= 0; i--) {
                if (currentTime >= currentLyrics[i].time) {
                    activeIndex = i;
                    break;
                }
            }

            lines.forEach((line, index) => {
                line.classList.toggle('active', index === activeIndex);
            });

                if (activeIndex >= 0 && activeIndex !== currentLyricIndex) {
                currentLyricIndex = activeIndex;
                const activeLine = lines[activeIndex];
                                const container = document.getElementById('lyricsContainer');
                if (activeLine && container) {
                    const lineTop = activeLine.offsetTop;
                    const lineHeight = activeLine.offsetHeight;
                    const containerHeight = container.clientHeight;
                    container.scrollTop = lineTop - containerHeight / 2 + lineHeight / 2;
                }

            }

        }

        // ===== 播放控制 =====
        btnPlay.addEventListener('click', function() {
            if (currentPlaylist.length === 0) {
                alert('⚠️ 请先选择歌单和歌曲！');
                return;
            }
            if (!audioPlayer.src) {
                alert('⚠️ 这首歌还没有音频！');
                return;
            }
            if (isPlaying) {
                audioPlayer.pause();
                isPlaying = false;
                btnPlay.querySelector('.play-icon').innerHTML = playIcon;
                document.querySelector('.album-cover-container').classList.remove('playing');
            } else {
                audioPlayer.play().then(() => {
                    isPlaying = true;
                    btnPlay.querySelector('.play-icon').innerHTML = pauseIcon;
                    document.querySelector('.album-cover-container').classList.add('playing');
                }).catch(err => {
                    console.error('播放失败:', err);
                });
            }
        });

        audioPlayer.addEventListener('timeupdate', function() {
            const current = audioPlayer.currentTime;
            const duration = audioPlayer.duration;
            if (!isNaN(duration) && duration > 0) {
                const percent = (current / duration) * 100;
                progressFill.style.width = percent + '%';
                progressHandle.style.left = percent + '%';
                currentTimeEl.textContent = formatTime(current);
                updateLyricHighlight(current);
            }
        });

        audioPlayer.addEventListener('loadedmetadata', function() {
            totalTimeEl.textContent = formatTime(audioPlayer.duration);
        });

        audioPlayer.addEventListener('ended', function() {
            isPlaying = false;
            btnPlay.querySelector('.play-icon').innerHTML = playIcon;
            document.querySelector('.album-cover-container').classList.remove('playing');
            const nextIndex = getNextTrackIndex();
            if (nextIndex >= 0) {
                loadTrack(nextIndex);
                setTimeout(() => {
                    audioPlayer.play().then(() => {
                        isPlaying = true;
                        btnPlay.querySelector('.play-icon').innerHTML = pauseIcon;
                        document.querySelector('.album-cover-container').classList.add('playing');
                    }).catch(err => console.error('自动播放失败:', err));
                }, 100);
            } else {
                alert('✅ 播放列表已全部播放完毕！');
            }
        });

        progressBar.addEventListener('click', function(e) {
            if (!audioPlayer.src || currentPlaylist.length === 0) return;
            const rect = progressBar.getBoundingClientRect();
            const percent = (e.clientX - rect.left) / rect.width;
            const duration = audioPlayer.duration;
            if (!isNaN(duration) && duration > 0) {
                audioPlayer.currentTime = duration * percent;
            }
        });

        // ===== 歌名编辑 =====
        songTitleBox.addEventListener('dblclick', function(e) {
            e.stopPropagation();
            songTitleText.style.display = 'none';
            songTitleInput.style.display = 'block';
            songTitleInput.value = songTitleText.textContent;
            songTitleInput.focus();
            songTitleInput.select();
        });

        songTitleInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                songTitleText.textContent = songTitleInput.value.trim() || '未选择歌曲';
                songTitleInput.style.display = 'none';
                songTitleText.style.display = 'block';
            }
        });

        // ===== 歌词导入 =====
        document.getElementById('lyricsImportBtn').addEventListener('click', function() {
            if (currentPlaylist.length === 0) {
                alert('⚠️ 请先选择并播放歌曲！');
                return;
            }
            document.getElementById('lrcUpload').click();
        });

        document.getElementById('lrcUpload').addEventListener('change', async function(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async function(e) {
        const lrcText = e.target.result;
        const lyrics = parseLRC(lrcText);
        if (lyrics.length === 0) {
            alert('❌ 文件格式不正确或没有有效歌词');
            return;
        }
        const song = currentPlaylist[currentTrackIndex];
        song.lyrics = lyrics;

        // 存进IndexedDB
        const lrcId = song.dbId || `lrc_netease_${song.id}`;
        song.lrcId = lrcId;
        await saveLyricToDB(lrcId, lrcText);

        currentLyrics = lyrics;
        currentLyricIndex = -1;
        renderLyrics(lyrics);
        saveData();
        alert(`✅ 歌词导入成功！共 ${lyrics.length} 行`);
    };
    reader.readAsText(file, 'UTF-8');
    this.value = '';
});

        // ===== 封面和头像裁剪 =====
        const coverContainer = document.getElementById('coverContainer');
        const coverImage = document.getElementById('coverImage');
        let cropTarget = '';

        coverContainer.addEventListener('click', function(e) {
            if (e.target.closest('.avatar')) return;
            cropTarget = 'cover';
            document.getElementById('coverUpload').click();
        });

        document.getElementById('coverUpload').addEventListener('change', function(event) {
            const file = event.target.files[0];
            if (!file || !file.type.startsWith('image/')) return;
            const reader = new FileReader();
            reader.onload = function(e) { openCropModal(e.target.result, 'cover'); };
            reader.readAsDataURL(file);
            this.value = '';
        });

        document.getElementById('avatarRight').addEventListener('click', function(e) {
            e.stopPropagation();
            cropTarget = 'avatarRight';
            document.getElementById('avatarUpload').click();
        });

        document.getElementById('avatarUpload').addEventListener('change', function(event) {
            const file = event.target.files[0];
            if (!file || !file.type.startsWith('image/')) return;
            const reader = new FileReader();
            reader.onload = function(e) { openCropModal(e.target.result, 'avatarRight'); };
            reader.readAsDataURL(file);
            this.value = '';
        });

        document.getElementById('avatarLeft').addEventListener('click', function(e) {
            e.stopPropagation();
            alert('🎭 角色选择功能开发中，敬请期待～');
        });

        // 统一裁剪弹窗
        function openCropModal(imageSrc, target) {
            cropTarget = target;
            currentTarget = target;
            const cropImage = document.getElementById('cropImage');
            const cropModal = document.getElementById('cropModal');
            cropImage.src = imageSrc;
            cropModal.classList.add('active');
            if (cropper) { cropper.destroy(); cropper = null; }
            cropImage.onload = function() {
                cropper = new Cropper(cropImage, {
                    aspectRatio: 1,
                    viewMode: 2,
                    dragMode: 'move',
                    autoCropArea: 0.85,
                    responsive: true,
                    zoomable: true,
                    zoomOnWheel: true
                });
            };
        }

        function confirmCrop() {
            if (!cropper) return;
            const canvas = cropper.getCroppedCanvas({ width: 400, height: 400, imageSmoothingQuality: 'high' });
            const croppedUrl = canvas.toDataURL('image/jpeg', 0.92);

            if (currentTarget === 'cover') {
                coverImage.src = croppedUrl;
            } else if (currentTarget === 'avatarRight') {
                document.getElementById('avatarRightImg').src = croppedUrl;
            } else if (currentTarget === 'avatar') {
                document.getElementById('userAvatarImg').src = croppedUrl;
            } else if (currentTarget === 'badge' && currentBadgeId) {
                window.tempBadgeImg = croppedUrl;
                document.getElementById('badgePreviewImg').src = croppedUrl;
                document.getElementById('badgePreview').classList.add('has-custom-img');
            } else if (currentTarget === 'newBadge') {
                newBadgeImg = croppedUrl;
                document.getElementById('newBadgePreviewImg').src = croppedUrl;
                document.getElementById('newBadgePreview').classList.add('has-custom-img');
            } else if (currentTarget === 'newCover') {
                document.getElementById('newCoverImg').src = croppedUrl;
                document.getElementById('newCoverUpload').classList.add('has-img');
                newPlaylistCover = croppedUrl;
            } else if (currentTarget === 'editCover') {
                document.getElementById('editCoverImg').src = croppedUrl;
                document.getElementById('editCoverUpload').classList.add('has-img');
                editPlaylistCover = croppedUrl;
            }

            closeCrop();
        }

        function closeCrop() {
            if (cropper) { cropper.destroy(); cropper = null; }
            document.getElementById('cropModal').classList.remove('active');
            setTimeout(() => { document.getElementById('cropImage').src = ''; }, 100);
        }

        document.getElementById('imageUpload').addEventListener('change', function(event) {
            const file = event.target.files[0];
            if (!file || !file.type.startsWith('image/')) return;
            const reader = new FileReader();
            reader.onload = function(e) { openCropModal(e.target.result, currentTarget); };
            reader.readAsDataURL(file);
            this.value = '';
        });

        // ===== 个人主页：页面切换 =====
        function openPlaylistDetail(playlistId) {
            currentProfilePlaylistId = playlistId;
            const playlist = playlistsData[playlistId];

            document.getElementById('detailTitle').textContent = playlist.name;
            document.getElementById('detailIcon').textContent = playlist.icon;
            document.getElementById('detailDesc').textContent = playlist.desc;
            document.getElementById('detailCount').textContent = `${playlist.songs.length} 首歌曲`;

            const coverDetail = document.getElementById('playlistCoverDetail');
            const coverImg = document.getElementById('detailCoverImg');
            if (playlist.cover) {
                coverImg.src = playlist.cover;
                coverDetail.classList.add('has-cover');
            } else {
                coverImg.src = '';
                coverDetail.classList.remove('has-cover');
            }

            renderSongList();
            document.getElementById('profilePage').classList.add('slide-left');
            document.getElementById('playlistDetailPage').classList.add('active');
        }

        function goBackToProfile() {
            // 返回时同步封面到主页和播放器
            if (currentProfilePlaylistId) {
                const playlist = playlistsData[currentProfilePlaylistId];
                const coverEl = document.getElementById(`${currentProfilePlaylistId}-cover`);
                if (coverEl) {
                    const coverBox = coverEl.parentElement;
                    if (playlist.cover) {
                        coverEl.src = playlist.cover;
                        coverBox.classList.add('has-cover');
                    } else {
                        coverEl.src = '';
                        coverBox.classList.remove('has-cover');
                    }
                }
            }
            document.getElementById('profilePage').classList.remove('slide-left');
            document.getElementById('playlistDetailPage').classList.remove('active');
            if (isManageMode) exitManageMode();
        }

        // ===== 管理模式 =====
        function enterManageMode() {
            isManageMode = true;
            selectedSongs.clear();
            document.getElementById('manageToolbar').classList.add('active');
            renderSongList();
            updateManageButtons();
        }

        function exitManageMode() {
            isManageMode = false;
            selectedSongs.clear();
            document.getElementById('manageToolbar').classList.remove('active');
            renderSongList();
        }

        function toggleSongSelect(index, checked) {
            if (checked) { selectedSongs.add(index); } else { selectedSongs.delete(index); }
            updateManageButtons();
            renderSongList();
        }

        function selectAll() {
            const playlist = playlistsData[currentProfilePlaylistId];
            if (selectedSongs.size === playlist.songs.length) {
                selectedSongs.clear();
            } else {
                selectedSongs.clear();
                for (let i = 0; i < playlist.songs.length; i++) { selectedSongs.add(i); }
            }
            updateManageButtons();
            renderSongList();
        }

        function updateManageButtons() {
            const count = selectedSongs.size;
            const deleteBtn = document.getElementById('deleteBtn');
            const moveBtn = document.getElementById('moveBtn');
            deleteBtn.textContent = `删除(${count})`;
            deleteBtn.disabled = count === 0;
            moveBtn.disabled = count === 0;
        }

        function batchDelete() {
            const count = selectedSongs.size;
            if (count === 0) return;
            if (confirm(`确定要删除选中的 ${count} 首歌曲吗？`)) {
                const playlist = playlistsData[currentProfilePlaylistId];
                const sortedIndexes = Array.from(selectedSongs).sort((a, b) => b - a);
                sortedIndexes.forEach(index => { playlist.songs.splice(index, 1); });
                selectedSongs.clear();
                saveData();
                updateSongCount();
                renderSongList();
                updateManageButtons();
                alert(`✅ 已删除 ${count} 首歌曲！`);
            }
        }

        function renderSongList() {
            if (!currentProfilePlaylistId) return;
            const playlist = playlistsData[currentProfilePlaylistId];
            const songsContainer = document.getElementById('songsContainer');
            const emptyState = document.getElementById('emptyState');

            if (playlist.songs.length === 0) {
                emptyState.classList.remove('hidden');
                songsContainer.classList.remove('active');
                songsContainer.innerHTML = '';
                return;
            }

            emptyState.classList.add('hidden');
            songsContainer.classList.add('active');
            songsContainer.innerHTML = '';

            playlist.songs.forEach((song, index) => {
                const songItem = document.createElement('div');
                songItem.className = `profile-song-item ${isManageMode ? 'manage-mode' : ''}`;
                if (selectedSongs.has(index)) songItem.classList.add('selected');

                songItem.innerHTML = `
                    <div class="song-top">
                        <input type="checkbox" class="song-checkbox"
                               ${selectedSongs.has(index) ? 'checked' : ''}
                               onchange="toggleSongSelect(${index}, this.checked)">
                        <div class="song-number">${index + 1}</div>
                        <div class="song-info">
                            <div class="song-name">${song.name}</div>
                            <div class="song-artist">${song.artist}</div>
                        </div>
                    </div>
                `;
                songsContainer.appendChild(songItem);
            });
        }

        function updateSongCount() {
            if (!currentProfilePlaylistId) return;
            const playlist = playlistsData[currentProfilePlaylistId];
            document.getElementById('detailCount').textContent = `${playlist.songs.length} 首歌曲`;
        }
        // ===== 个人信息编辑 =====
        function editUsername() {
            document.getElementById('nameBox').classList.add('editing');
            document.getElementById('editNameInput').value = document.getElementById('userName').textContent;
            document.getElementById('editNameModal').classList.add('active');
            setTimeout(() => document.getElementById('editNameInput').focus(), 100);
        }

        function saveUsername() {
            const newName = document.getElementById('editNameInput').value.trim();
            if (newName) document.getElementById('userName').textContent = newName;
            document.getElementById('nameBox').classList.remove('editing');
            closeUserEdit('name');
        }

        function editSignature() {
            document.getElementById('signatureBox').classList.add('editing');
            document.getElementById('editSigInput').value = document.getElementById('userSignature').textContent;
            document.getElementById('editSigModal').classList.add('active');
            setTimeout(() => document.getElementById('editSigInput').focus(), 100);
        }

        function saveSignature() {
            const newSig = document.getElementById('editSigInput').value.trim();
            if (newSig) document.getElementById('userSignature').textContent = newSig;
            document.getElementById('signatureBox').classList.remove('editing');
            closeUserEdit('sig');
        }

        function closeUserEdit(type) {
            if (type === 'name') {
                document.getElementById('nameBox').classList.remove('editing');
                document.getElementById('editNameModal').classList.remove('active');
            } else if (type === 'sig') {
                document.getElementById('signatureBox').classList.remove('editing');
                document.getElementById('editSigModal').classList.remove('active');
            }
        }

        function changeAvatar() {
            currentTarget = 'avatar';
            document.getElementById('imageUpload').click();
        }

        // ===== 荣誉墙统计 =====
        function openBadgeStats() {
            const unlockedList = document.getElementById('unlockedBadgesList');
            const lockedList = document.getElementById('lockedBadgesList');
            unlockedList.innerHTML = '';
            lockedList.innerHTML = '';

            Object.keys(badgesData).forEach(badgeId => {
                const badge = badgesData[badgeId];
                const item = createStatsItem(badge);
                if (badge.unlocked) {
                    unlockedList.appendChild(item);
                } else {
                    lockedList.appendChild(item);
                }
            });

            document.getElementById('badgeStatsModal').classList.add('active');
        }

        function createStatsItem(badge) {
            const item = document.createElement('div');
            item.className = `stats-item ${badge.unlocked ? '' : 'locked'}`;

            let percentage = 0;
            const match = badge.progress.match(/(\d+)\/(\d+)/);
            if (match) {
                percentage = Math.min((parseInt(match[1]) / parseInt(match[2])) * 100, 100);
            }

            item.innerHTML = `
                <div class="stats-item-header">
                    <span class="stats-icon">${badge.unlocked ? '✅' : '🔒'}</span>
                    <span class="stats-name">${badge.name}</span>
                </div>
                <div class="stats-progress-text">进度：${badge.progress}</div>
                <div class="progress-bar-bg">
                    <div class="progress-bar-fill" style="width:${percentage}%"></div>
                </div>
            `;
            return item;
        }

        function closeBadgeStats() {
            document.getElementById('badgeStatsModal').classList.remove('active');
        }

        function updateBadgeCount() {
            const unlocked = Object.values(badgesData).filter(b => b.unlocked).length;
            const total = Object.keys(badgesData).length;
            document.getElementById('badgeStatusBtn').textContent = `(${unlocked}/${total}已解锁)`;
        }

        // ===== 徽章编辑 =====
        function openBadgeEdit(badgeId) {
            currentBadgeId = badgeId;
            const data = badgesData[badgeId];

            document.getElementById('editTitle').textContent = `编辑 ${data.name}`;
            document.getElementById('badgePreviewEmoji').textContent = data.emoji;
            document.getElementById('inputName').value = data.name;
            document.getElementById('inputCondition').value = data.condition;
            document.getElementById('inputProgress').value = data.progress;

            const preview = document.getElementById('badgePreview');
            const toggleSwitch = document.getElementById('toggleSwitch');

            preview.className = `badge-preview ${data.unlocked ? 'unlocked' : 'locked'}`;
            toggleSwitch.classList.toggle('active', data.unlocked);

            if (data.customImg) {
                document.getElementById('badgePreviewImg').src = data.customImg;
                preview.classList.add('has-custom-img');
            } else {
                document.getElementById('badgePreviewImg').src = '';
                preview.classList.remove('has-custom-img');
            }

            document.getElementById('badgeEditModal').classList.add('active');
        }

        function closeBadgeEdit() {
            window.tempBadgeImg = null;
            document.getElementById('badgeEditModal').classList.remove('active');
        }

        function saveBadgeEdit() {
            if (!currentBadgeId) return;
            const data = badgesData[currentBadgeId];
            data.name = document.getElementById('inputName').value;
            data.condition = document.getElementById('inputCondition').value;
            data.progress = document.getElementById('inputProgress').value;
            data.unlocked = document.getElementById('toggleSwitch').classList.contains('active');

            if (window.tempBadgeImg) {
                data.customImg = window.tempBadgeImg;
                const honorImg = document.getElementById(`${currentBadgeId}-img`);
                if (honorImg) {
                    honorImg.src = window.tempBadgeImg;
                    honorImg.closest('.honor-badge-mini').classList.add('has-custom-img');
                }
                window.tempBadgeImg = null;
            }

            const honorBadge = document.querySelector(`[data-badge-id="${currentBadgeId}"]`);
            if (honorBadge) {
                honorBadge.querySelector('.badge-mini-name').textContent = data.name;
                honorBadge.classList.toggle('unlocked', data.unlocked);
                honorBadge.classList.toggle('locked', !data.unlocked);
            }

            updateBadgeCount();
            closeBadgeEdit();
            alert('✅ 徽章已保存！');
        }

        function toggleStatus() {
            const toggle = document.getElementById('toggleSwitch');
            const preview = document.getElementById('badgePreview');
            toggle.classList.toggle('active');
            preview.classList.toggle('unlocked', toggle.classList.contains('active'));
            preview.classList.toggle('locked', !toggle.classList.contains('active'));
        }

        function changeBadgeImage() {
            currentTarget = 'badge';
            document.getElementById('imageUpload').click();
        }

        // ===== 新增徽章 =====
        function createNewBadge() {
            document.getElementById('newBadgeName').value = '';
            document.getElementById('newBadgeEmoji').value = '🎵';
            document.getElementById('newBadgeCondition').value = '';
            document.getElementById('newBadgeProgress').value = '';
            document.getElementById('newBadgePreviewEmoji').textContent = '🎵';
            document.getElementById('newBadgePreviewImg').src = '';
            document.getElementById('newBadgePreview').className = 'badge-preview locked';
            document.getElementById('newBadgeToggle').classList.remove('active');
            newBadgeImg = '';
            closeBadgeStats();
            document.getElementById('createBadgeModal').classList.add('active');
            setTimeout(() => document.getElementById('newBadgeName').focus(), 100);
        }

        function changeNewBadgeImage() {
            currentTarget = 'newBadge';
            document.getElementById('imageUpload').click();
        }

        function toggleNewBadgeStatus() {
            const toggle = document.getElementById('newBadgeToggle');
            const preview = document.getElementById('newBadgePreview');
            toggle.classList.toggle('active');
            preview.classList.toggle('unlocked', toggle.classList.contains('active'));
            preview.classList.toggle('locked', !toggle.classList.contains('active'));
        }

        function saveNewBadge() {
            const name = document.getElementById('newBadgeName').value.trim();
            const emoji = document.getElementById('newBadgeEmoji').value.trim() || '🎵';
            const condition = document.getElementById('newBadgeCondition').value.trim();
            const progress = document.getElementById('newBadgeProgress').value.trim();
            const unlocked = document.getElementById('newBadgeToggle').classList.contains('active');

            if (!name) { alert('请输入徽章名称！'); return; }

            const badgeId = `badge${nextBadgeId}`;
            nextBadgeId++;

            badgesData[badgeId] = { name, emoji, condition, progress, unlocked, customImg: newBadgeImg };

            const honorWall = document.querySelector('.honor-wall-compact');
            const newBadge = document.createElement('div');
            newBadge.className = `honor-badge-mini ${unlocked ? 'unlocked' : 'locked'}`;
            newBadge.setAttribute('data-badge-id', badgeId);
            newBadge.onclick = function() { openBadgeEdit(badgeId); };

            if (newBadgeImg) newBadge.classList.add('has-custom-img');

            newBadge.innerHTML = `
                <div class="honor-badge-img-box">
                    <img src="${newBadgeImg}" alt="" class="badge-custom-img" id="${badgeId}-img">
                    <span class="badge-emoji">${emoji}</span>
                </div>
                <span class="badge-mini-name">${name}</span>
            `;

            honorWall.appendChild(newBadge);
            updateBadgeCount();
            closeCreateBadge();
            alert('✅ 徽章创建成功！');
        }

        function closeCreateBadge() {
            document.getElementById('createBadgeModal').classList.remove('active');
            newBadgeImg = '';
        }

        document.getElementById('newBadgeEmoji').addEventListener('input', function() {
            document.getElementById('newBadgePreviewEmoji').textContent = this.value.trim() || '🎵';
        });
        // ===== 新建歌单 =====
        function createNewPlaylist() {
            document.getElementById('newTitleInput').value = '';
            document.getElementById('newDescInput').value = '';
            document.getElementById('newCoverImg').src = '';
            document.getElementById('newCoverUpload').classList.remove('has-img');
            newPlaylistCover = '';
            document.getElementById('createPlaylistModal').classList.add('active');
            setTimeout(() => document.getElementById('newTitleInput').focus(), 100);
        }

        function changeNewCover() {
            currentTarget = 'newCover';
            document.getElementById('imageUpload').click();
        }

        function saveNewPlaylist() {
            const title = document.getElementById('newTitleInput').value.trim();
            const desc = document.getElementById('newDescInput').value.trim();
            if (!title) { alert('请输入歌单名称！'); return; }

            const playlistId = `playlist${nextPlaylistId}`;
            nextPlaylistId++;

            playlistsData[playlistId] = {
                name: title,
                icon: '🎵',
                cover: newPlaylistCover,
                desc: desc || '暂无介绍',
                songs: []
            };

            const playlistsGrid = document.getElementById('playlistsGrid');
            const newCard = document.createElement('div');
            newCard.className = 'playlist-card';
            newCard.setAttribute('data-playlist-id', playlistId);

            newCard.innerHTML = `
                <div class="playlist-cover-box ${newPlaylistCover ? 'has-cover' : ''}" onclick="openPlaylistDetail('${playlistId}')">
                    <img src="${newPlaylistCover}" alt="" class="playlist-cover" id="${playlistId}-cover">
                    <div class="playlist-icon">🎵</div>
                </div>
                <div class="playlist-name">${title}</div>
            `;

            const lastCard = playlistsGrid.querySelector('.playlist-card:last-child');
            playlistsGrid.insertBefore(newCard, lastCard);

            saveData();
            closeCreatePlaylistModal();
            alert('✅ 歌单创建成功！');
        }

        function closeCreatePlaylistModal() {
            document.getElementById('createPlaylistModal').classList.remove('active');
            newPlaylistCover = '';
        }

        // ===== 编辑歌单 =====
        function openEditPlaylistModal() {
            if (!currentProfilePlaylistId) return;
            const playlist = playlistsData[currentProfilePlaylistId];

            document.getElementById('editTitleInput').value = playlist.name;
            document.getElementById('editDescInput').value = playlist.desc;

            const coverUpload = document.getElementById('editCoverUpload');
            const editCoverImgElem = document.getElementById('editCoverImg');

            if (playlist.cover) {
                editCoverImgElem.src = playlist.cover;
                coverUpload.classList.add('has-img');
                editPlaylistCover = playlist.cover;
            } else {
                editCoverImgElem.src = '';
                coverUpload.classList.remove('has-img');
                editPlaylistCover = '';
            }

            document.getElementById('editPlaylistModal').classList.add('active');
        }

        function changeEditCover() {
            currentTarget = 'editCover';
            document.getElementById('imageUpload').click();
        }

        function saveEditPlaylist() {
            if (!currentProfilePlaylistId) return;
            const title = document.getElementById('editTitleInput').value.trim();
            const desc = document.getElementById('editDescInput').value.trim();
            const playlist = playlistsData[currentProfilePlaylistId];

            if (title) {
                playlist.name = title;
                document.getElementById('detailTitle').textContent = title;
            }

            if (desc) {
                playlist.desc = desc;
                document.getElementById('detailDesc').textContent = desc;
            }

            if (editPlaylistCover !== playlist.cover) {
                playlist.cover = editPlaylistCover;
                const detailCover = document.getElementById('playlistCoverDetail');
                const detailCoverImg = document.getElementById('detailCoverImg');
                if (editPlaylistCover) {
                    detailCoverImg.src = editPlaylistCover;
                    detailCover.classList.add('has-cover');
                } else {
                    detailCoverImg.src = '';
                    detailCover.classList.remove('has-cover');
                }

                // ← 核心！同步封面到个人主页歌单卡片
                const coverEl = document.getElementById(`${currentProfilePlaylistId}-cover`);
                if (coverEl) {
                    const coverBox = coverEl.parentElement;
                    if (editPlaylistCover) {
                        coverEl.src = editPlaylistCover;
                        coverBox.classList.add('has-cover');
                    } else {
                        coverEl.src = '';
                        coverBox.classList.remove('has-cover');
                    }
                }
            }

            saveData();
            closeEditPlaylistModal();
            alert('✅ 歌单信息已更新！');
        }

        function closeEditPlaylistModal() {
            document.getElementById('editPlaylistModal').classList.remove('active');
            editPlaylistCover = '';
        }

        // ===== 导入音乐 =====
        function openImportModal() {
            document.getElementById('importModal').classList.add('active');
        }

        function closeImportModal() {
            document.getElementById('importModal').classList.remove('active');
        }

        function importLocalMusic() {
            document.getElementById('musicUpload').click();
        }

        document.getElementById('musicUpload').addEventListener('change', async function(event) {
    const files = event.target.files;
    if (!files || files.length === 0 || !currentProfilePlaylistId) return;

    const playlist = playlistsData[currentProfilePlaylistId];
    let importedCount = 0;

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.type.startsWith('audio/')) {
            const fileName = file.name.replace(/\.[^/.]+$/, '');
            let songName = fileName;
            let artistName = '未知歌手';

            if (fileName.includes('-')) {
                const parts = fileName.split('-');
                songName = parts[0].trim();
                artistName = parts.slice(1).join('-').trim();
            }

            const dbId = `local_${Date.now()}_${i}`;
            await saveAudioToDB(dbId, file);

            playlist.songs.push({
                name: songName,
                artist: artistName,
                dbId: dbId,
                source: 'local'
            });
            importedCount++;
        }
    }

    if (importedCount > 0) {
        updateSongCount();
        renderSongList();
        saveData();
        closeImportModal();
        alert(`✅ 成功导入 ${importedCount} 首歌曲！`);
    } else {
        alert('❌ 没有选择有效的音乐文件！');
    }
    this.value = '';
});


        // ===== 网易云导入 =====
        async function importNeteasePlaylist() {
            if (!currentProfilePlaylistId) return;

            const input = prompt("请输入网易云歌单ID：\n(例如：24381616)");
            if (!input) return;

            const playlistId = input.trim().match(/\d+/)?.[0];
            if (!playlistId) { alert("没找到数字ID，请重新输入！"); return; }

            const apiUrl = `${API_BASE_URL}/playlist/track/all?id=${playlistId}`;

            try {
                alert("宝宝稍等，正在抓取中...");
                const response = await fetch(apiUrl);
                if (!response.ok) throw new Error(`服务器返回错误: ${response.status}`);

                const data = await response.json();

                if (data.songs && data.songs.length > 0) {
                    const playlist = playlistsData[currentProfilePlaylistId];
                    data.songs.forEach(s => {
                        playlist.songs.push({
                            id: s.id,
                            name: s.name,
                            artist: s.ar ? s.ar.map(a => a.name).join(' / ') : '未知歌手',
                            cover: s.al.picUrl,
                            source: 'netease'
                        });
                    });

                    updateSongCount();
                    renderSongList();
                    saveData();
                    closeImportModal();
                    alert(`✅ 成功抓取 ${data.songs.length} 首歌曲！`);
                } else {
                    alert("❌ 歌单是空的，或者这个歌单被设为隐私了！");
                }
            } catch (error) {
                console.error(error);
                alert(`❌ 连接失败！\n错误：${error.message}`);
            }
        }

        // ===== 移动歌曲 =====
        function openMoveModal() {
            const count = selectedSongs.size;
            if (count === 0) return;
            document.getElementById('moveSubtitle').textContent = `已选中 ${count} 首歌曲`;

            const container = document.getElementById('playlistListInMove');
            container.innerHTML = '';

            Object.keys(playlistsData).forEach(playlistId => {
                if (playlistId === currentProfilePlaylistId) return;
                const playlist = playlistsData[playlistId];
                const option = document.createElement('div');
                option.className = 'move-option';
                option.onclick = () => selectTargetPlaylist(playlistId);
                option.innerHTML = `
                    <div class="move-option-icon">${playlist.icon}</div>
                    <div class="move-option-info">
                        <div class="move-option-name">${playlist.name}</div>
                        <div class="move-option-count">${playlist.songs.length} 首歌曲</div>
                    </div>
                `;
                container.appendChild(option);
            });

            document.getElementById('moveModal').classList.add('active');
        }

        function closeMoveModal() {
            document.getElementById('moveModal').classList.remove('active');
        }

        function selectTargetPlaylist(targetPlaylistId) {
            const count = selectedSongs.size;
            const sourcePlaylist = playlistsData[currentProfilePlaylistId];
            const targetPlaylist = playlistsData[targetPlaylistId];

            const sortedIndexes = Array.from(selectedSongs).sort((a, b) => b - a);
            const movedSongs = [];
            sortedIndexes.forEach(index => {
                movedSongs.push(sourcePlaylist.songs[index]);
                sourcePlaylist.songs.splice(index, 1);
            });

            targetPlaylist.songs.push(...movedSongs.reverse());

            selectedSongs.clear();
            saveData();
            updateSongCount();
            renderSongList();
            updateManageButtons();
            closeMoveModal();
            exitManageMode();
            alert(`✅ 已将 ${count} 首歌曲移动到《${targetPlaylist.name}》！`);
        }
        // ===== 键盘ESC关闭弹窗 =====
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                closeCrop();
                closePlaylistModal();
                closeSongListModal();
                closeImportModal();
                closeMoveModal();
                closeBadgeStats();
                closeBadgeEdit();
                closeCreateBadge();
                closeEditPlaylistModal();
                closeCreatePlaylistModal();
                closeUserEdit('name');
                closeUserEdit('sig');
            }
        });

        // 点击空白处关闭歌名编辑
        document.addEventListener('click', function(e) {
            if (!songTitleBox.contains(e.target)) {
                if (songTitleInput.style.display === 'block') {
                    songTitleText.textContent = songTitleInput.value.trim() || '未选择歌曲';
                    songTitleInput.style.display = 'none';
                    songTitleText.style.display = 'block';
                }
            }
        });

        function deletePlaylist() {
    if (!currentProfilePlaylistId) return;
    const playlist = playlistsData[currentProfilePlaylistId];
    if (!confirm(`确定要删除歌单《${playlist.name}》吗？\n歌单内的歌曲也会一并删除！`)) return;

    // 如果播放器正在播放这个歌单，清空播放器
    if (currentPlaylistId === currentProfilePlaylistId) {
        audioPlayer.pause();
        audioPlayer.src = '';
        isPlaying = false;
        currentPlaylist = [];
        currentTrackIndex = 0;
        currentPlaylistId = null;
        btnPlay.querySelector('.play-icon').innerHTML = playIcon;
        document.querySelector('.album-cover-container').classList.remove('playing');
        songTitleText.textContent = '未选择歌曲';
        progressFill.style.width = '0%';
        progressHandle.style.left = '0%';
        currentTimeEl.textContent = '00:00';
        totalTimeEl.textContent = '00:00';
        currentLyrics = [];
        renderLyrics([]);
    }

    // 从数据里删除
    delete playlistsData[currentProfilePlaylistId];

    // 从页面网格里删除卡片
    const card = document.querySelector(`[data-playlist-id="${currentProfilePlaylistId}"]`);
    if (card) card.remove();

    saveData();
    closeEditPlaylistModal();
    goBackToProfile();
    alert('✅ 歌单已删除！');
}


        // ===== 初始化 =====
        initDB().then(() => {
    loadData();
    console.log('✅ IndexedDB 已就绪');
});

        updateBadgeCount();
        syncCoversToPlayer();
        console.log('✅ 锦玉音乐 - 完整整合版已加载！');