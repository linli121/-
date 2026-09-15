/* ==========================================
   页面交互与主逻辑脚本 (main.js)
   ========================================== */
document.addEventListener('DOMContentLoaded', () => {
    
    // ==========================================
    // 1. Canvas 粒子物理效果引擎 (樱花与萤火虫)
    // ==========================================
    const canvas = document.getElementById('bg-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    let particles = [];
    let animationId = null;

    // 自适应屏幕大小
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        initParticles(); // 缩放后重新洗牌粒子
    }

    // 粒子实体类
    class Particle {
        constructor(isDark) {
            this.reset(isDark, true);
        }

        reset(isDark, initPhase = false) {
            this.isDark = isDark;
            this.x = Math.random() * canvas.width;
            
            if (this.isDark) {
                // --- 萤火虫参数 ---
                this.y = initPhase ? Math.random() * canvas.height : canvas.height + 20; // 向上漂移
                this.size = Math.random() * 2.5 + 1.5; // 光点大小
                this.speedX = (Math.random() - 0.5) * 0.4;
                this.speedY = -(Math.random() * 0.5 + 0.2); // 向上
                this.opacity = Math.random() * 0.5 + 0.2;
                this.fadeSpeed = Math.random() * 0.015 + 0.005; // 渐变呼吸速度
                this.angle = Math.random() * Math.PI * 2;
                this.oscillationSpeed = Math.random() * 0.02 + 0.01; // 左右摇摆
            } else {
                // --- 樱花瓣参数 ---
                this.y = initPhase ? Math.random() * canvas.height : -20; // 向下飘落
                this.size = Math.random() * 6 + 6; // 花瓣尺度
                this.speedX = Math.random() * 0.8 + 0.4; // 随风向右倾斜
                this.speedY = Math.random() * 1.0 + 0.8; // 向下落
                this.opacity = Math.random() * 0.4 + 0.5;
                this.angle = Math.random() * Math.PI * 2; // 初始旋转角
                this.spin = (Math.random() - 0.5) * 0.02; // 自旋速度
            }
        }

        update() {
            if (this.isDark) {
                // 萤火虫物理更新：微幅漂移和忽明忽暗的呼吸灯
                this.y += this.speedY;
                this.angle += this.oscillationSpeed;
                this.x += this.speedX + Math.sin(this.angle) * 0.3;
                
                // 产生明暗呼吸闪烁
                this.opacity += this.fadeSpeed;
                if (this.opacity > 0.8 || this.opacity < 0.1) {
                    this.fadeSpeed = -this.fadeSpeed;
                }

                // 边界检测
                if (this.y < -10 || this.x < -10 || this.x > canvas.width + 10) {
                    this.reset(this.isDark, false);
                }
            } else {
                // 樱花更新：受重力下降和自旋
                this.y += this.speedY;
                this.angle += this.spin;
                this.x += this.speedX + Math.sin(this.angle) * 0.2;

                // 边界检测
                if (this.y > canvas.height + 10 || this.x > canvas.width + 10) {
                    this.reset(this.isDark, false);
                }
            }
        }

        draw() {
            ctx.save();
            if (this.isDark) {
                // 绘制萤火虫光点 (带柔边径向渐变)
                ctx.beginPath();
                const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size * 3);
                grad.addColorStop(0, `rgba(163, 230, 53, ${this.opacity})`); // 亮绿色
                grad.addColorStop(0.3, `rgba(52, 211, 153, ${this.opacity * 0.5})`);
                grad.addColorStop(1, 'rgba(52, 211, 153, 0)');
                ctx.fillStyle = grad;
                ctx.arc(this.x, this.y, this.size * 3, 0, Math.PI * 2);
                ctx.fill();
            } else {
                // 绘制精致的樱花花瓣 (旋转的桃粉色扁椭圆)
                ctx.translate(this.x, this.y);
                ctx.rotate(this.angle);
                ctx.beginPath();
                // 画椭圆代表旋转的花瓣
                ctx.ellipse(0, 0, this.size, this.size * 0.6, 0, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 182, 193, ${this.opacity})`; // 经典樱粉色
                ctx.fill();
                
                // 增加花瓣淡淡的描边增加精致感
                ctx.strokeStyle = `rgba(255, 150, 170, ${this.opacity * 0.3})`;
                ctx.stroke();
            }
            ctx.restore();
        }
    }

    // 初始化粒子群
    function initParticles() {
        const isDark = document.documentElement.classList.contains('dark');
        particles = [];
        const count = isDark ? 40 : 35; // 控制粒子总数以维持性能
        for (let i = 0; i < count; i++) {
            particles.push(new Particle(isDark));
        }
    }

    // 动画自循环核心
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const isDark = document.documentElement.classList.contains('dark');
        
        particles.forEach(p => {
            // 如果粒子类型与全局模式不符，渐进式重置
            if (p.isDark !== isDark) {
                p.reset(isDark, false);
            }
            p.update();
            p.draw();
        });
        animationId = requestAnimationFrame(animate);
    }

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas(); // 初始化画布尺寸
    animate();      // 激活渲染链

    // ==========================================
    // 2. 简易数字时钟
    // ==========================================
    function updateClock() {
        const clockEl = document.getElementById('live-clock');
        if (!clockEl) return;
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        clockEl.textContent = `${hours}:${minutes}:${seconds}`;
    }
    setInterval(updateClock, 1000);
    updateClock();

    // ==========================================
    // 3. 主题切换与 UI 同步管理
    // ==========================================
    const toggleBtn = document.getElementById('theme-toggle-btn');
    const themeIcon = document.getElementById('theme-icon');
    const themeTitle = document.getElementById('theme-title');
    const themeDesc = document.getElementById('theme-desc');

    function syncThemeUI() {
        const isDark = document.documentElement.classList.contains('dark');
        if (isDark) {
            if (themeIcon) themeIcon.textContent = '☀️';
            if (themeTitle) themeTitle.textContent = '日间模式';
            if (themeDesc) themeDesc.textContent = '清晨明媚的阳光';
        } else {
            if (themeIcon) themeIcon.textContent = '🌙';
            if (themeTitle) themeTitle.textContent = '夜间模式';
            if (themeDesc) themeDesc.textContent = '流萤飞舞的深空';
        }
    }

    function toggleTheme() {
        const html = document.documentElement;
        if (html.classList.contains('dark')) {
            html.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        } else {
            html.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        }
        syncThemeUI();
        
        // 触发粒子重组，平滑过渡
        initParticles();
    }

    // 初始化按钮显示
    syncThemeUI();

    // 绑定事件
    if (toggleBtn) {
        toggleBtn.addEventListener('click', toggleTheme);
    }
});

// ==========================================
    // 4. 主要文章特色卡 - 轮播图控制系统
    // ==========================================
    const carousel = document.getElementById('feature-carousel');
    if (carousel) {
        const slides = carousel.querySelectorAll('.carousel-slide');
        const dots = carousel.querySelectorAll('.dot');
        let currentIndex = 0;
        let slideInterval = null;
        const intervalTime = 4000; // 每 4 秒自动切换一次

        // 核心切页函数
        function goToSlide(index) {
            // 撤销上一个 Active 态
            slides[currentIndex].classList.remove('active');
            dots[currentIndex].classList.remove('active');

            // 设为新 index
            currentIndex = index;

            // 赋予新 Active 态
            slides[currentIndex].classList.add('active');
            dots[currentIndex].classList.add('active');
        }

        function nextSlide() {
            let nextIndex = (currentIndex + 1) % slides.length;
            goToSlide(nextIndex);
        }

        // 启动轮播定时器
        function startSlideShow() {
            if (!slideInterval) {
                slideInterval = setInterval(nextSlide, intervalTime);
            }
        }

        // 终止轮播定时器
        function stopSlideShow() {
            clearInterval(slideInterval);
            slideInterval = null;
        }

        // 圆点点击交互
        dots.forEach((dot, index) => {
            dot.addEventListener('click', (e) => {
                e.stopPropagation(); // 防止按钮事件穿透
                goToSlide(index);
                // 触发点击后重置计时器，获得更好的交互手感
                stopSlideShow();
                startSlideShow();
            });
        });

        // 鼠标移入卡片时暂停，移出时重新开启，方便细看
        carousel.addEventListener('mouseenter', stopSlideShow);
        carousel.addEventListener('mouseleave', startSlideShow);

        // 启动轮播
        startSlideShow();
        // ==========================================
    // 5. 右下角记录卡 - 轮播图控制系统
    // ==========================================
    const recordsCarousel = document.getElementById('records-carousel');
    if (recordsCarousel) {
        const slides = recordsCarousel.querySelectorAll('.carousel-slide');
        const dots = recordsCarousel.querySelectorAll('.dot');
        let currentIndex = 0;
        let slideInterval = null;
        const intervalTime = 4000; // 每 4 秒自动切换一次

        function goToSlide(index) {
            // 撤销前一个 Active
            slides[currentIndex].classList.remove('active');
            dots[currentIndex].classList.remove('active');

            // 锁定新 index
            currentIndex = index;

            // 赋予新 Active
            slides[currentIndex].classList.add('active');
            dots[currentIndex].classList.add('active');
        }

        function nextSlide() {
            let nextIndex = (currentIndex + 1) % slides.length;
            goToSlide(nextIndex);
        }

        // 定时播放控制
        function startSlideShow() {
            if (!slideInterval) {
                slideInterval = setInterval(nextSlide, intervalTime);
            }
        }

        function stopSlideShow() {
            clearInterval(slideInterval);
            slideInterval = null;
        }

        // 小圆点绑定点击
        dots.forEach((dot, index) => {
            dot.addEventListener('click', (e) => {
                e.stopPropagation();
                goToSlide(index);
                // 交互重置
                stopSlideShow();
                startSlideShow();
            });
        });

        // 鼠标移入暂停，移出继续
        recordsCarousel.addEventListener('mouseenter', stopSlideShow);
        recordsCarousel.addEventListener('mouseleave', startSlideShow);

        // 启动轮播
        startSlideShow();
    }
    }