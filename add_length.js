function main() {
    const badgeSelector = '.yt-total-duration-fixed';

    if (document.querySelector(badgeSelector)) return;

    function parseDuration(timeStr) {
        const parts = timeStr.split(':').map(Number);
        if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
        if (parts.length === 2) return parts[0] * 60 + parts[1];
        return parts[0];
    }

    function formatDuration(seconds) {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return [
            h > 0 ? h.toString().padStart(1, '0') : null,
            m.toString().padStart(2, '0'),
            s.toString().padStart(2, '0')
        ].filter(Boolean).join(':');
    }

    function renderBadge(totalFormatted) {
        const badge = document.createElement('div');
        badge.className = 'yt-total-duration-fixed';
        badge.textContent = `⏱ Total Duration: ${totalFormatted}`;

        Object.assign(badge.style, {
            position: 'fixed',
            top: '12px',
            right: '12px',
            zIndex: 10000,
            backgroundColor: '#212121',
            color: '#fff',
            padding: '8px 12px',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '500',
            boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
            opacity: '0',
            cursor: 'move',
            userSelect: 'none',
            transition: 'opacity 0.5s ease'
        });

        const closeBtn = document.createElement('span');
        closeBtn.textContent = ' ×';
        closeBtn.style.marginLeft = '8px';
        closeBtn.style.cursor = 'pointer';
        closeBtn.style.fontWeight = 'bold';
        closeBtn.onclick = () => badge.remove();
        badge.appendChild(closeBtn);

        let isDragging = false, offsetX, offsetY;
        badge.addEventListener('mousedown', (e) => {
            isDragging = true;
            offsetX = e.clientX - badge.offsetLeft;
            offsetY = e.clientY - badge.offsetTop;
            e.preventDefault();
        });
        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                badge.style.left = `${e.clientX - offsetX}px`;
                badge.style.top = `${e.clientY - offsetY}px`;
                badge.style.right = 'auto';
            }
        });
        document.addEventListener('mouseup', () => isDragging = false);

        document.body.appendChild(badge);
        requestAnimationFrame(() => badge.style.opacity = '1');
    }

    function tryCalculate() {
        const durationEls = Array.from(document.querySelectorAll('ytd-playlist-video-renderer #text.ytd-thumbnail-overlay-time-status-renderer'));
        const durations = durationEls.map(el => el.textContent.trim()).filter(Boolean);

        const totalCount = document.querySelectorAll('ytd-playlist-video-renderer').length;
        if (durations.length < totalCount) return false;

        const totalSeconds = durations.reduce((sum, str) => sum + parseDuration(str), 0);
        renderBadge(formatDuration(totalSeconds));
        return true;
    }

    const container = document.querySelector('ytd-playlist-video-list-renderer');

    if (container) {
        const observer = new MutationObserver(() => {
            if (tryCalculate()) observer.disconnect();
        });
        observer.observe(container, { childList: true, subtree: true });
        tryCalculate();
    } else {
        // Fallback observer if container not yet available
        const fallbackObserver = new MutationObserver(() => {
            const newContainer = document.querySelector('ytd-playlist-video-list-renderer');
            if (newContainer) {
                fallbackObserver.disconnect();
                main(); // Re-run main
            }
        });

        const appRoot = document.querySelector('ytd-app');
        if (appRoot) {
            fallbackObserver.observe(appRoot, { childList: true, subtree: true });
        }
    }
}

main();