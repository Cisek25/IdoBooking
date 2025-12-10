// ============================================
// PREVIEW.JS - Live preview w iframe
// ============================================

const Preview = {
    iframe: null,
    currentView: 'desktop',

    init() {
        this.iframe = document.getElementById('preview-iframe');
        this.setupViewControls();
        this.render();
    },

    setupViewControls() {
        document.querySelectorAll('.preview-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.preview-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                this.currentView = btn.dataset.view;
                this.updateViewport();
            });
        });
    },

    updateViewport() {
        const frame = document.getElementById('preview-frame');

        switch (this.currentView) {
            case 'mobile':
                frame.style.maxWidth = '375px';
                frame.style.margin = '0 auto';
                break;
            case 'tablet':
                frame.style.maxWidth = '768px';
                frame.style.margin = '0 auto';
                break;
            default:
                frame.style.maxWidth = '100%';
                frame.style.margin = '0';
        }
    },

    render() {
        if (!this.iframe) return;

        const settings = window.appState?.globalSettings || {};
        const objects = window.appState?.objects || [];
        const enabledSections = window.appState?.enabledSections || ['intro', 'rooms', 'amenities', 'cta'];

        // Generate HTML
        const head = TemplateEngine.generateHead(settings);
        const body = TemplateEngine.generateSections(settings, objects, enabledSections);
        const effectsSettings = window.appState?.effectsSettings || {};
        const sectionBackgrounds = window.appState?.sectionBackgrounds || {};
        const css = CSSEngine.generate(settings, effectsSettings, sectionBackgrounds);
        const scripts = this.generateScripts();

        const html = `<!DOCTYPE html>
<html lang="pl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    ${head}
    <style>${css}</style>
</head>
<body>
    ${body}
    ${scripts}
</body>
</html>`;

        // Write to iframe
        const doc = this.iframe.contentDocument || this.iframe.contentWindow.document;
        doc.open();
        doc.write(html);
        doc.close();
    },

    generateScripts() {
        return `<script>
// Lightbox functions
function openLightbox(element) {
    var img = element.querySelector('img');
    var lightbox = document.getElementById('lightbox');
    var lightboxImg = document.getElementById('lightbox-img');
    if (lightbox && lightboxImg && img) {
        lightboxImg.src = img.src;
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeLightbox() {
    var lightbox = document.getElementById('lightbox');
    if (lightbox) {
        lightbox.classList.remove('active');
        document.body.style.overflow = '';
    }
}

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') closeLightbox();
});

// Room Slider functions - INFINITE SCROLL
var currentSlide = 0;
var isTransitioning = false;

function slideRooms(direction) {
    if (isTransitioning) return; // Prevent multiple clicks during transition
    
    var track = document.querySelector('.rooms-slider-track');
    var cards = document.querySelectorAll('.rooms-slider .room-card');
    var dots = document.querySelectorAll('.slider-dot');
    
    if (!track || !cards.length) return;
    
    var totalRooms = parseInt(track.dataset.totalRooms) || cards.length;
    var cloneCount = parseInt(track.dataset.cloneCount) || 0;
    
    isTransitioning = true;
    currentSlide += direction;
    
    updateSliderPosition(track, cards, dots, totalRooms, cloneCount, true);
}

function goToSlide(index) {
    var track = document.querySelector('.rooms-slider-track');
    var cards = document.querySelectorAll('.rooms-slider .room-card');
    var dots = document.querySelectorAll('.slider-dot');
    
    if (!track || !cards.length) return;
    
    var totalRooms = parseInt(track.dataset.totalRooms) || cards.length;
    var cloneCount = parseInt(track.dataset.cloneCount) || 0;
    
    currentSlide = cloneCount + index; // Account for clones at start
    updateSliderPosition(track, cards, dots, totalRooms, cloneCount, true);
}

function updateSliderPosition(track, cards, dots, totalRooms, cloneCount, animate) {
    var cardWidth = cards[0].offsetWidth;
    var gap = 32;
    var offset = -(currentSlide * (cardWidth + gap));
    
    // Apply transition if animating
    if (animate) {
        track.style.transition = 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
    } else {
        track.style.transition = 'none';
    }
    
    track.style.transform = 'translateX(' + offset + 'px)';
    
    // Handle infinite loop - reset position after animation
    if (animate) {
        setTimeout(function() {
            var needsReset = false;
            var newPosition = currentSlide;
            
            // If we're at or past the end clones, jump back to real start
            if (currentSlide >= cloneCount + totalRooms) {
                newPosition = cloneCount;
                needsReset = true;
            }
            // If we're at or before the start clones, jump to real end
            else if (currentSlide < cloneCount) {
                newPosition = cloneCount + totalRooms - 1;
                needsReset = true;
            }
            
            if (needsReset) {
                currentSlide = newPosition;
                updateSliderPosition(track, cards, dots, totalRooms, cloneCount, false);
            }
            
            isTransitioning = false;
        }, 400); // Match transition duration
    }
    
    // Update dots (only for real slides, not clones)
    var realIndex = ((currentSlide - cloneCount) % totalRooms + totalRooms) % totalRooms;
    dots.forEach(function(dot, i) {
        dot.classList.toggle('active', i === realIndex);
    });
}

// Initialize slider position on load
document.addEventListener('DOMContentLoaded', function() {
    var track = document.querySelector('.rooms-slider-track');
    if (track) {
        var cards = document.querySelectorAll('.rooms-slider .room-card');
        var dots = document.querySelectorAll('.slider-dot');
        var cloneCount = parseInt(track.dataset.cloneCount) || 0;
        var totalRooms = parseInt(track.dataset.totalRooms) || cards.length;
        
        // Start at first real slide (after clones)
        currentSlide = cloneCount;
        updateSliderPosition(track, cards, dots, totalRooms, cloneCount, false);
    }
});


</script>`;
    },

    // Debounced render for performance
    debouncedRender: (function () {
        let timeout;
        return function () {
            clearTimeout(timeout);
            timeout = setTimeout(() => Preview.render(), 300);
        };
    })()
};

// Expose to window
window.Preview = Preview;
