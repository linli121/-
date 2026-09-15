/* =========================================================================
   全局共享背景与弹幕引擎 (shared-bg.js) - 慢速与常态全屏毛玻璃重构版
   ========================================================================= */

(function() {
    // ==========================================
    // 1. 预留：背景图片路径配置表 (五张图轮播)
    // ↙↙↙ 在这里替换为您自己的 5 张高分辨率背景图片路径
    // ==========================================
    const bgImages = [
        "./img/自拍.png", 
        "./img/今汐.jpg", 
        "./img/今汐新年.jpg", 
        "./img/芙芙.jpg", 
        "./img/月下.jpg"  
    ];

    // 弹幕词库 (首位已为您预设了图 21 中的词条)
    const defaultDanmakus = [
        "写算法中",
        "睡大觉中",
        "系统运行稳定，解耦完成！",
        "有新番看了o(*￣︶￣*)o！",
        "这个毛玻璃背景好高级啊 🤍",
        "好耶ヾ(✿ﾟ▽ﾟ)ノ",
        "打卡打卡！流萤飞舞的深空...",
        "音乐板块吹爆，兰音太赞了！",
        "定格时间，封存泰拉与现实的每一次心跳"
    ];

    // ==========================================
    // 2. 初始化 DOM 容器 (全新层级夹层设计)
    // ==========================================
    document.addEventListener("DOMContentLoaded", () => {
        // [层级 1 - 底层]：创建背景轮播 DOM (z-index: -10)
        const bgContainer = document.createElement("div");
        bgContainer.className = "global-bg-container";
        bgContainer.innerHTML = `
            <div class="global-bg-slide" id="global-slide-1"></div>
            <div class="global-bg-slide" id="global-slide-2"></div>
        `;
        document.body.appendChild(bgContainer);

        // [层级 2 - 中底层]：创建弹幕运行跑道容器 (z-index: -8)
        const danmakuContainer = document.createElement("div");
        danmakuContainer.className = "global-danmaku-container";
        document.body.appendChild(danmakuContainer);

        // [层级 3 - 中顶层]：创建常态全屏毛玻璃遮罩 (z-index: -5)
        // 这一层将背景图和在其下方流动的弹幕一并进行柔和的磨砂滤镜折射
        const glassOverlay = document.createElement("div");
        glassOverlay.className = "global-glass-overlay";
        document.body.appendChild(glassOverlay);

        // [层级 4 - 顶层]：创建发送弹幕的毛玻璃模态对话框 (z-index: 9999)
        const modal = document.createElement("div");
        modal.className = "danmaku-modal-overlay";
        modal.id = "global-danmaku-modal";
        modal.innerHTML = `
            <div class="danmaku-modal-card">
                <h3 class="danmaku-modal-title">发表弹幕</h3>
                <input type="text" id="danmaku-modal-input" placeholder="输入你想发送的弹幕，回车或点击发送..." maxlength="40">
                <div class="danmaku-modal-actions">
                    <button class="danmaku-modal-btn btn-cancel" id="danmaku-modal-cancel">取消</button>
                    <button class="danmaku-modal-btn btn-submit" id="danmaku-modal-submit">发送</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // ==========================================
        // 3. 跨页面绝对时间对齐的背景轮播引擎
        // ==========================================
        const slide1 = document.getElementById("global-slide-1");
        const slide2 = document.getElementById("global-slide-2");
        
        const slideDuration = 8000; 
        const fadeDuration = 2000;  
        const totalSlides = bgImages.length;
        const totalCycle = slideDuration * totalSlides;

        function renderSynchronizedBackground() {
            const now = Date.now();
            const timeInCycle = now % totalCycle;
            
            const currentIdx = Math.floor(timeInCycle / slideDuration);
            const nextIdx = (currentIdx + 1) % totalSlides;
            const timeInCurrentSlide = timeInCycle % slideDuration;

            let opacity2 = 0;
            if (timeInCurrentSlide > (slideDuration - fadeDuration)) {
                opacity2 = (timeInCurrentSlide - (slideDuration - fadeDuration)) / fadeDuration;
            }

            slide1.style.backgroundImage = `url('${bgImages[currentIdx]}')`;
            slide2.style.backgroundImage = `url('${bgImages[nextIdx]}')`;
            slide2.style.opacity = opacity2;

            requestAnimationFrame(renderSynchronizedBackground);
        }
        renderSynchronizedBackground();

        // ==========================================
        // 4. 弹幕逻辑控制引擎 (慢速与防重叠)
        // ==========================================
        let activeParticles = [];
        const maxActiveParticles = 10; 
        const laneCount = 6;           
        const laneOccupied = new Array(laneCount).fill(false);

        function getCustomDanmakus() {
            const stored = localStorage.getItem("user_danmakus");
            return stored ? JSON.parse(stored) : [];
        }

        function sendNewDanmaku(text) {
            if (!text.trim()) return;
            const customs = getCustomDanmakus();
            customs.push(text);
            localStorage.setItem("user_danmakus", JSON.stringify(customs));
            spawnDanmaku(text, true);
        }

        function spawnDanmaku(text, isHighPriority = false) {
            let availableLanes = [];
            laneOccupied.forEach((occupied, idx) => {
                if (!occupied) availableLanes.push(idx);
            });

            if (availableLanes.length === 0) {
                if (isHighPriority) {
                    availableLanes = [Math.floor(Math.random() * laneCount)];
                } else {
                    return;
                }
            }

            const chosenLane = availableLanes[Math.floor(Math.random() * availableLanes.length)];
            laneOccupied[chosenLane] = true;

            const el = document.createElement("div");
            el.className = "danmaku-item";
            if (isHighPriority) el.classList.add("high-priority");
            el.textContent = text;
            
            const topPos = 12 + chosenLane * 12; // 调整间距，防止重叠
            el.style.top = `${topPos}%`;
            
            danmakuContainer.appendChild(el);

            const rect = el.getBoundingClientRect();
            const width = rect.width || 200;
            
            let xPos = window.innerWidth;
            
            // ↙↙↙ 【核心：大幅度降低弹幕的流速，实现慢速宁静的漂移感】
            const speed = Math.random() * 0.2 + 0.35; // 每帧平移 0.35px 到 0.55px

            const particle = {
                el: el,
                x: xPos,
                width: width,
                speed: speed,
                lane: chosenLane,
                hasLeftEntry: false
            };

            activeParticles.push(particle);
        }

        function updateDanmakus() {
            const screenWidth = window.innerWidth;
            
            for (let i = activeParticles.length - 1; i >= 0; i--) {
                const p = activeParticles[i];
                p.x -= p.speed;
                p.el.style.transform = `translateX(${p.x}px)`;

                if (!p.hasLeftEntry && p.x < screenWidth - p.width - 80) {
                    p.hasLeftEntry = true;
                    laneOccupied[p.lane] = false;
                }

                if (p.x < -p.width - 50) {
                    p.el.remove();
                    activeParticles.splice(i, 1);
                }
            }

            if (activeParticles.length < maxActiveParticles && Math.random() < 0.012) {
                const pool = [...defaultDanmakus, ...getCustomDanmakus()];
                const randomText = pool[Math.floor(Math.random() * pool.length)];
                spawnDanmaku(randomText);
            }

            requestAnimationFrame(updateDanmakus);
        }
        updateDanmakus();

        // ==========================================
        // 5. 模态框交互绑定
        // ==========================================
        const triggerBtn = document.getElementById("danmaku-trigger-btn");
        const cancelBtn = document.getElementById("danmaku-modal-cancel");
        const submitBtn = document.getElementById("danmaku-modal-submit");
        const inputField = document.getElementById("danmaku-modal-input");

        function openModal() {
            modal.classList.add("active");
            setTimeout(() => inputField.focus(), 100);
        }

        function closeModal() {
            modal.classList.remove("active");
            inputField.value = "";
        }

        function handleSend() {
            const text = inputField.value.trim();
            if (text) {
                sendNewDanmaku(text);
                closeModal();
            }
        }

        if (triggerBtn) {
            triggerBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                openModal();
            });
        }

        if (cancelBtn) cancelBtn.addEventListener("click", closeModal);
        if (submitBtn) submitBtn.addEventListener("click", handleSend);

        inputField.addEventListener("keydown", (e) => {
            if (e.key === "Enter") handleSend();
            if (e.key === "Escape") closeModal();
        });

        modal.addEventListener("click", (e) => {
            if (e.target === modal) closeModal();
        });
        // ==========================================
        // 6. 全局鼠标点击双层同心圆波纹特效 (追加在 main.js 上方的 DOM 监听内)
        // ==========================================
        window.addEventListener("mousedown", (e) => {
            // 创建涟漪节点
            const ripple = document.createElement("div");
            ripple.className = "click-ripple";
            
            // 精准定位在鼠标点击处的正中心
            ripple.style.left = `${e.clientX}px`;
            ripple.style.top = `${e.clientY}px`;
            
            document.body.appendChild(ripple);

            // 800毫秒（动画结束时间）后全自动销毁节点，零内存开销
            setTimeout(() => {
                ripple.remove();
            }, 800);
        });
    });
})();