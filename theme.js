/* ==========================================
   优先主题状态切换脚本 (theme.js)
   ========================================== */
(function() {
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'light') {
        document.documentElement.classList.remove('dark');
    } else if (savedTheme === 'dark' || systemPrefersDark) {
        document.documentElement.classList.add('dark');
    }
})();