document.addEventListener('DOMContentLoaded', function() {
    console.log("📖 锦玉书动画逻辑已就绪");

    const musicFlower = document.getElementById('musicFlower');
    const bgMusics = [
        document.getElementById('bgMusic1'),
        document.getElementById('bgMusic2'),
        document.getElementById('bgMusic3')
    ];

    let currentMusic = null;
    let isPlaying = false;

    if (musicFlower) {
        console.log("🌸 栀子花已加载");
        
        musicFlower.addEventListener('click', function(e) {
            e.stopPropagation();
            console.log("🌸 栀子花被点击");
            
            if (isPlaying && currentMusic) {
                currentMusic.pause();
                musicFlower.classList.remove('playing');
                isPlaying = false;
                console.log("🎵 音乐已暂停");
            } else {
                const availableMusics = bgMusics.filter(m => m !== null);
                console.log("🎵 可用音乐数量:", availableMusics.length);
                
                if (availableMusics.length === 0) {
                    console.error("❌ 没有找到音频文件");
                    return;
                }
                
                currentMusic = availableMusics[Math.floor(Math.random() * availableMusics.length)];
                currentMusic.volume = 0.3;
                currentMusic.currentTime = 0;
                
                currentMusic.play()
                    .then(() => {
                        console.log("✅ 音乐开始播放");
                        musicFlower.classList.add('playing');
                        isPlaying = true;
                    })
                    .catch((err) => {
                        console.error("❌ 播放失败:", err);
                    });
                
                currentMusic.onended = function() {
                    musicFlower.classList.remove('playing');
                    isPlaying = false;
                    console.log("🎵 音乐播放结束");
                };
            }
        });
    } else {
        console.error("❌ 没有找到栀子花元素");
    }
});
