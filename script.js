document.addEventListener('DOMContentLoaded', () => {
    // Theme Toggle logic
    const themeToggle = document.querySelector('.theme-toggle');
    const currentTheme = localStorage.getItem('theme');

    if (currentTheme) {
        document.documentElement.setAttribute('data-theme', currentTheme);
    } else {
        // Default to dark mode for enterprise visual depth
        document.documentElement.setAttribute('data-theme', 'dark');
    }

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            let theme = document.documentElement.getAttribute('data-theme');
            if (theme === 'light') {
                document.documentElement.setAttribute('data-theme', 'dark');
                localStorage.setItem('theme', 'dark');
            } else {
                document.documentElement.setAttribute('data-theme', 'light');
                localStorage.setItem('theme', 'light');
            }
        });
    }

    // Mobile Menu Toggle
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');

    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            const icon = mobileMenuBtn.querySelector('i');
            if (navLinks.classList.contains('active')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-times');
            } else {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        });
    }

    // Mobile Dropdown Toggle
    const navDropdowns = document.querySelectorAll('.nav-dropdown');
    navDropdowns.forEach(dropdown => {
        const toggle = dropdown.querySelector('.nav-dropdown-toggle');
        if (toggle && window.innerWidth <= 768) {
            toggle.addEventListener('click', (e) => {
                e.preventDefault();
                dropdown.classList.toggle('active');
            });
        }
    });

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // Enterprise Mission Control Console Tab Switcher
    window.switchConsoleTab = function(tab) {
        if (!tab) return;
        const targetId = tab.getAttribute('data-pane') || tab.getAttribute('data-tab');
        if (!targetId) return;

        const consoleBox = tab.closest('.enterprise-console');
        if (!consoleBox) return;

        consoleBox.querySelectorAll('.c-tab').forEach(t => t.classList.remove('active'));
        consoleBox.querySelectorAll('.c-pane').forEach(p => p.classList.remove('active'));

        tab.classList.add('active');
        const targetPane = consoleBox.querySelector('#' + targetId);
        if (targetPane) {
            targetPane.classList.add('active');
        }
    };

    const consoleTabs = document.querySelectorAll('.c-tab');
    consoleTabs.forEach(tab => {
        tab.addEventListener('click', () => window.switchConsoleTab(tab));
    });

    // Add scroll effect to header
    const header = document.querySelector('header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.style.padding = '10px 0';
            header.style.background = 'var(--header-scroll-bg)';
        } else {
            header.style.padding = '0';
            header.style.background = 'var(--header-bg)';
        }
    });

    // ========================================
    // SCROLL ANIMATIONS
    // ========================================
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const animationObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);

    // Observe all animated elements
    const animatedElements = document.querySelectorAll('.fade-in, .fade-in-left, .fade-in-right, .scale-in');
    animatedElements.forEach(el => animationObserver.observe(el));

    // Observe cards in card-grid
    const cards = document.querySelectorAll('.card-grid .card');
    cards.forEach(card => animationObserver.observe(card));

    // Enterprise Code Terminal Tab Switcher
    const terminalTabs = document.querySelectorAll('.terminal-tab-btn');
    terminalTabs.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-target');
            if (!targetId) return;

            const parentWindow = btn.closest('.terminal-window');
            if (!parentWindow) return;

            parentWindow.querySelectorAll('.terminal-tab-btn').forEach(b => b.classList.remove('active'));
            parentWindow.querySelectorAll('.terminal-panel').forEach(p => p.classList.remove('active'));

            btn.classList.add('active');
            const targetPanel = parentWindow.querySelector('#' + targetId);
            if (targetPanel) {
                targetPanel.classList.add('active');
            }
        });
    });

    // ========================================
    // STATS COUNTER ANIMATION
    // ========================================
    const statNumbers = document.querySelectorAll('.stat-number');
    const statsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = entry.target;
                const finalValue = target.textContent;
                const numericValue = parseInt(finalValue.replace(/\D/g, ''));
                const suffix = finalValue.replace(/[0-9]/g, '');

                if (!target.classList.contains('counted')) {
                    target.classList.add('counted');
                    animateCounter(target, 0, numericValue, 1500, suffix);
                }
            }
        });
    }, { threshold: 0.5 });

    statNumbers.forEach(stat => statsObserver.observe(stat));

    function animateCounter(element, start, end, duration, suffix) {
        const range = end - start;
        const startTime = performance.now();

        function updateCounter(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const current = Math.floor(start + (range * easeOut));

            element.textContent = current + suffix;

            if (progress < 1) {
                requestAnimationFrame(updateCounter);
            } else {
                element.textContent = end + suffix;
            }
        }

        requestAnimationFrame(updateCounter);
    }

    // ========================================
    // BACK TO TOP BUTTON
    // ========================================
    const backToTop = document.querySelector('.back-to-top');
    if (backToTop) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 500) {
                backToTop.classList.add('visible');
            } else {
                backToTop.classList.remove('visible');
            }
        });

        backToTop.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    // ========================================
    // TOC ACCORDION FUNCTIONALITY
    // ========================================
    const accordionHeaders = document.querySelectorAll('.toc-section-header');
    accordionHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const section = header.parentElement;
            const isActive = section.classList.contains('active');

            // Close all sections
            document.querySelectorAll('.toc-section').forEach(s => {
                s.classList.remove('active');
            });

            // If it wasn't active before, open it now
            if (!isActive) {
                section.classList.add('active');

                // Scroll to the header after a brief delay
                setTimeout(() => {
                    const headerOffset = 100;
                    const elementPosition = section.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                    window.scrollTo({
                        top: offsetPosition,
                        behavior: "smooth"
                    });
                }, 300);
            }
        });
    });

    // ========================================
    // BUTTON RIPPLE EFFECT
    // ========================================
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const ripple = document.createElement('span');
            ripple.className = 'ripple';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';

            this.appendChild(ripple);

            setTimeout(() => ripple.remove(), 600);
        });
    });

    // ========================================
    // LINKEDIN FOLLOW MODAL - REUSABLE COMPONENT
    // ========================================
    // Auto-initialize LinkedIn modal if data attribute exists
    const linkedinModalTrigger = document.querySelector('[data-linkedin-modal]');
    if (linkedinModalTrigger) {
        const config = {
            linkedinUrl: linkedinModalTrigger.getAttribute('data-linkedin-url') || 'https://www.linkedin.com/in/your-profile',
            title: linkedinModalTrigger.getAttribute('data-linkedin-title') || 'Join Our LinkedIn Community!',
            message: linkedinModalTrigger.getAttribute('data-linkedin-message') || 'Get exclusive access to premium content, updates, and resources.',
            showDelay: parseInt(linkedinModalTrigger.getAttribute('data-linkedin-delay')) || 2000,
            expiryDays: parseInt(linkedinModalTrigger.getAttribute('data-linkedin-expiry')) || 7,
            followerCount: linkedinModalTrigger.getAttribute('data-linkedin-followers') || null,
            storageKey: linkedinModalTrigger.getAttribute('data-linkedin-storage-key') || 'vibetestq-linkedin-modal'
        };

        setTimeout(() => {
            showLinkedInModal(config);
        }, config.showDelay);
    }
});

// ========================================
// LINKEDIN MODAL FUNCTION - GLOBAL REUSABLE
// ========================================
/**
 * Show LinkedIn Follow Modal
 * @param {Object} config - Configuration object
 * @param {string} config.linkedinUrl - Your LinkedIn profile URL
 * @param {string} config.title - Modal title
 * @param {string} config.message - Modal message
 * @param {number} config.expiryDays - Days before showing modal again (default: 7)
 * @param {string} config.followerCount - Optional follower count to display
 * @param {string} config.storageKey - LocalStorage key (default: 'vibetestq-linkedin-modal')
 * 
 * Usage Example:
 * showLinkedInModal({
 *   linkedinUrl: 'https://www.linkedin.com/in/your-profile',
 *   title: 'Follow me on LinkedIn',
 *   message: 'Stay updated with the latest testing insights!',
 *   expiryDays: 7,
 *   followerCount: '5K+'
 * });
 */
function showLinkedInModal(config = {}) {
    // Default configuration
    const defaults = {
        linkedinUrl: 'https://www.linkedin.com/in/your-profile',
        title: 'Join Our LinkedIn Community!',
        message: 'Follow me on LinkedIn to get exclusive access to premium Playwright content, AI Testing updates, and career guidance.',
        expiryDays: 7,
        followerCount: null,
        storageKey: 'vibetestq-linkedin-modal'
    };

    const settings = { ...defaults, ...config };

    // Check if modal was already shown and not expired
    const modalData = localStorage.getItem(settings.storageKey);
    if (modalData) {
        const { timestamp } = JSON.parse(modalData);
        const daysSinceShown = (Date.now() - timestamp) / (1000 * 60 * 60 * 24);
        
        if (daysSinceShown < settings.expiryDays) {
            return; // Don't show modal yet
        }
    }

    // Create modal HTML
    const modalHTML = `
        <div class="linkedin-modal-overlay" id="linkedinModalOverlay">
            <div class="linkedin-modal">
                <div class="linkedin-modal-header">
                    <button class="linkedin-modal-close" id="linkedinModalClose">
                        <i class="fas fa-times"></i>
                    </button>
                    <div class="linkedin-modal-icon">
                        <i class="fab fa-linkedin-in"></i>
                    </div>
                    <h2>${settings.title}</h2>
                    <p>Unlock Premium Content & Stay Updated</p>
                    ${settings.followerCount ? `
                        <div class="linkedin-follower-count">
                            <i class="fas fa-users"></i>
                            <span><strong>${settings.followerCount}</strong> followers already connected</span>
                        </div>
                    ` : ''}
                </div>
                
                <div class="linkedin-modal-body">
                    <div class="linkedin-modal-content">
                        <h3>Why Follow on LinkedIn?</h3>
                        <p>${settings.message}</p>
                    </div>
                    
                    <div class="linkedin-modal-benefits">
                        <div class="linkedin-modal-benefit">
                            <i class="fas fa-book-open"></i>
                            <div class="linkedin-modal-benefit-text">
                                <strong>Exclusive Content</strong><br>
                                Access premium guides & tutorials
                            </div>
                        </div>
                        <div class="linkedin-modal-benefit">
                            <i class="fas fa-bell"></i>
                            <div class="linkedin-modal-benefit-text">
                                <strong>Latest Updates</strong><br>
                                Be first to know about new courses
                            </div>
                        </div>
                        <div class="linkedin-modal-benefit">
                            <i class="fas fa-lightbulb"></i>
                            <div class="linkedin-modal-benefit-text">
                                <strong>Pro Tips</strong><br>
                                Daily testing insights & best practices
                            </div>
                        </div>
                        <div class="linkedin-modal-benefit">
                            <i class="fas fa-comments"></i>
                            <div class="linkedin-modal-benefit-text">
                                <strong>Community Support</strong><br>
                                Connect with QA professionals
                            </div>
                        </div>
                    </div>
                    
                    <div class="linkedin-modal-actions">
                        <a href="${settings.linkedinUrl}" target="_blank" rel="noopener noreferrer" 
                           class="linkedin-modal-btn linkedin-modal-btn-primary" id="linkedinFollowBtn">
                            <i class="fab fa-linkedin-in"></i>
                            Follow on LinkedIn
                        </a>
                        <button class="linkedin-modal-btn linkedin-modal-btn-secondary" id="linkedinContinueBtn">
                            I'll do it later
                        </button>
                    </div>
                </div>
                
                <div class="linkedin-modal-footer">
                    <p>
                        <i class="fas fa-shield-alt"></i>
                        Your support helps us create <strong>free quality content</strong> for the QA community
                    </p>
                </div>
            </div>
        </div>
    `;

    // Insert modal into DOM
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Get modal elements
    const overlay = document.getElementById('linkedinModalOverlay');
    const closeBtn = document.getElementById('linkedinModalClose');
    const continueBtn = document.getElementById('linkedinContinueBtn');
    const followBtn = document.getElementById('linkedinFollowBtn');

    // Show modal with animation
    setTimeout(() => {
        overlay.classList.add('active');
    }, 100);

    // Function to close modal and save state
    function closeModal(action = 'closed') {
        overlay.classList.remove('active');
        setTimeout(() => {
            overlay.remove();
        }, 300);

        // Save modal state to localStorage
        localStorage.setItem(settings.storageKey, JSON.stringify({
            timestamp: Date.now(),
            action: action
        }));
    }

    // Event listeners
    closeBtn.addEventListener('click', () => closeModal('dismissed'));
    continueBtn.addEventListener('click', () => closeModal('later'));
    followBtn.addEventListener('click', () => closeModal('followed'));

    // Close on overlay click (outside modal)
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            closeModal('dismissed');
        }
    });

    // Close on Escape key
    document.addEventListener('keydown', function escapeHandler(e) {
        if (e.key === 'Escape' && overlay) {
            closeModal('dismissed');
            document.removeEventListener('keydown', escapeHandler);
        }
    });
}

// Make function globally available
window.showLinkedInModal = showLinkedInModal;

// ========================================
// CENTRALIZED TRAINING POPUP INJECTION
// Injects popup HTML/styles and handles fetching + interactions
// Works across pages that include `script.js`.
// ========================================
(function() {
    const STORAGE_KEY = 'trainingPopupShown';
    const POPUP_ID = 'trainingPopup';

    function createPopupHTML() {
        return `
<!-- Training Announcement Popup (injected) -->
<div id="${POPUP_ID}" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.75); z-index: 10000; align-items: center; justify-content: center; backdrop-filter: blur(5px); overflow-y: auto;">
    <div class="popup-content" style="background: var(--bg-card); border-radius: 20px; max-width: 600px; width: 90%; margin: 1rem auto; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3); position: relative; overflow: hidden; animation: popupSlideIn 0.4s ease;">
        <div class="popup-header" style="background: linear-gradient(135deg, var(--primary), rgba(139, 92, 246, 0.9)); padding: 2rem; color: white; position: relative;">
            <button id="trainingPopupClose" style="position: absolute; top: 1rem; right: 1rem; background: rgba(255, 255, 255, 0.2); border: none; color: white; width: 35px; height: 35px; border-radius: 50%; cursor: pointer; font-size: 1.5rem; display: flex; align-items: center; justify-content: center; transition: all 0.3s; backdrop-filter: blur(10px);">&times;</button>
            <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 0.5rem;">
                <i class="fas fa-calendar-star" style="font-size: 2rem;"></i>
                <h2 style="margin: 0; font-size: 1.5rem;">Upcoming Training Session</h2>
            </div>
            <p style="margin: 0; opacity: 0.9; font-size: 0.95rem;">Join our free demo session!</p>
        </div>

        <div style="padding: 2rem;">
            <div style="margin-bottom: 1.5rem;">
                <h3 id="popup-title" style="color: var(--text); margin-bottom: 0.8rem; font-size: 1.1rem;">
                    🎯 Loading...
                </h3>
                <div style="display: flex; flex-direction: column; gap: 0.8rem; font-size: 0.95rem;">
                    <div style="display: flex; align-items: center; gap: 0.8rem;">
                        <i class="fas fa-calendar" style="color: var(--primary); width: 20px;"></i>
                        <span><strong>Date:</strong> <span id="popup-date"></span></span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 0.8rem;">
                        <i class="fas fa-clock" style="color: var(--primary); width: 20px;"></i>
                        <span><strong>Time:</strong> <span id="popup-time"></span></span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 0.8rem;">
                        <i class="fas fa-user-tie" style="color: var(--primary); width: 20px;"></i>
                        <span><strong>Trainer:</strong> <span id="popup-trainer"></span></span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 0.8rem;">
                        <i class="fas fa-hourglass-half" style="color: var(--primary); width: 20px;"></i>
                        <span><strong>Duration:</strong> <span id="popup-duration"></span></span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 0.8rem;">
                        <i class="fas fa-play-circle" style="color: #10b981; width: 20px;"></i>
                        <span><strong>Training Starts:</strong> <span id="popup-start-date"></span></span>
                    </div>
                </div>
            </div>

            <div style="padding: 1rem; background: rgba(99, 102, 241, 0.05); border-radius: 10px; margin-bottom: 1.5rem; border-left: 3px solid var(--primary);">
                <p style="margin: 0; font-size: 0.9rem; color: var(--text-muted);">
                    <strong style="color: var(--text);">What You'll Learn:</strong> AI-native SDLC workflows, Playwright automation with AI agents, and our practice-first training methodology.
                </p>
            </div>

            <div style="display: flex; flex-direction: column; gap: 0.8rem;">
                <a id="popup-register-btn" href="#" target="_blank" rel="noopener noreferrer"
                   class="btn btn-primary"
                   style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 0.5rem; text-decoration: none; padding: 1rem;">
                    <i class="fas fa-user-plus"></i> Contact on WhatsApp
                </a>
                <a id="popup-viewall-btn" href="/upcoming-trainings"
                   class="btn btn-secondary"
                   style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 0.5rem; text-decoration: none; padding: 0.9rem;">
                    <i class="fas fa-info-circle"></i> View All Sessions
                </a>
            </div>

            <div style="text-align: center; margin-top: 1rem;">
                <button id="popup-maybe-later" style="background: none; border: none; color: var(--text-muted); cursor: pointer; font-size: 0.85rem; text-decoration: underline; padding: 0.5rem;">
                    Maybe later
                </button>
            </div>
        </div>
    </div>
</div>

<style id="training-popup-styles">
    @keyframes popupSlideIn {
        from {
            opacity: 0;
            transform: translateY(-30px) scale(0.95);
        }
        to {
            opacity: 1;
            transform: translateY(0) scale(1);
        }
    }

    /* Mobile responsive styles for popup */
    @media (max-width: 768px) {
        #trainingPopup {
            padding: 0.5rem;
        }
        
        .popup-content {
            width: 95% !important;
            margin: 0.5rem auto !important;
        }
        
        .popup-header {
            padding: 1.2rem 1rem !important;
        }
        
        .popup-header h2 {
            font-size: 1.1rem !important;
        }
        
        .popup-header p {
            font-size: 0.85rem !important;
        }
        
        .popup-header .fa-calendar-star {
            font-size: 1.5rem !important;
        }
        
        .popup-header button {
            width: 30px !important;
            height: 30px !important;
            font-size: 1.2rem !important;
            top: 0.8rem !important;
            right: 0.8rem !important;
        }
        
        #trainingPopup h3 {
            font-size: 1rem !important;
        }
        
        #trainingPopup .btn, 
        #trainingPopup .btn-primary,
        #trainingPopup .btn-secondary {
            font-size: 0.85rem !important;
            padding: 0.7rem 1rem !important;
        }
        
        #trainingPopup .info-item {
            font-size: 0.9rem;
        }
    }
    
    @media (max-width: 480px) {
        .popup-content {
            width: 98% !important;
            margin: 0.25rem auto !important;
        }
        
        .popup-header {
            padding: 1rem 0.8rem !important;
        }
        
        .popup-header > div {
            gap: 0.5rem !important;
        }
        
        .popup-header h2 {
            font-size: 1rem !important;
        }
        
        #trainingPopup .btn, 
        #trainingPopup .btn-primary,
        #trainingPopup .btn-secondary {
            font-size: 0.8rem !important;
            padding: 0.6rem 0.8rem !important;
        }
    }
</style>
        `;
    }

    function attachPopupHandlers() {
        const popup = document.getElementById(POPUP_ID);
        if (!popup) return;

        const closeBtn = document.getElementById('trainingPopupClose');
        const overlay = popup;
        const registerBtn = document.getElementById('popup-register-btn');
        const viewAllBtn = document.getElementById('popup-viewall-btn');
        const maybeLaterBtn = document.getElementById('popup-maybe-later');

        function closeTrainingPopup() {
            const p = document.getElementById(POPUP_ID);
            if (p) {
                p.style.display = 'none';
                document.body.style.overflow = '';
                try { sessionStorage.setItem(STORAGE_KEY, 'true'); } catch (e) {}
            }
        }

        // expose for compatibility
        window.closeTrainingPopup = closeTrainingPopup;

        if (closeBtn) closeBtn.addEventListener('click', closeTrainingPopup);
        if (overlay) overlay.addEventListener('click', function(e) { if (e.target === overlay) closeTrainingPopup(); });
        if (maybeLaterBtn) maybeLaterBtn.addEventListener('click', closeTrainingPopup);
        if (viewAllBtn) viewAllBtn.addEventListener('click', function() { closeTrainingPopup(); });

        if (registerBtn) {
            registerBtn.addEventListener('click', function(e) {
                const href = this.href || this.getAttribute('data-href');
                if (href && href !== '#' && href !== window.location.href) {
                    try {
                        window.open(href, '_blank');
                    } catch (err) {
                        // fallback to navigating
                        window.location.href = href;
                    }
                }
                closeTrainingPopup();
                e.preventDefault();
            });
        }
    }

    // If a page provides its own training modal (legacy), attach a safe handler
    // to ensure the Register button reliably opens a new tab without changing UI.
    function attachLegacyModalHandlers() {
        const modal = document.getElementById('training-modal');
        if (!modal) return;

        // Ensure we don't re-attach handlers multiple times
        try {
            if (modal.dataset.vibetestqAttached) return;
            modal.dataset.vibetestqAttached = '1';
        } catch (e) {}

        const registerBtn = modal.querySelector('#modal-register-btn');
        if (registerBtn) {
            registerBtn.addEventListener('click', function(e) {
                const href = this.href || this.getAttribute('data-href');
                if (href && href !== '#' && href !== window.location.href) {
                    try {
                        window.open(href, '_blank');
                    } catch (err) {
                        window.location.href = href;
                    }
                }

                // Prefer calling existing page close function if present
                if (typeof window.closeTrainingModal === 'function') {
                    try { window.closeTrainingModal(); } catch (err) {}
                } else if (typeof window.closeTrainingPopup === 'function') {
                    try { window.closeTrainingPopup(); } catch (err) {}
                } else {
                    modal.style.display = 'none';
                }

                try { sessionStorage.setItem(STORAGE_KEY, 'true'); } catch (err) {}
                e.preventDefault();
            });
        }

        // When clicking on overlay, set the session flag (page may already handle closing)
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                try { sessionStorage.setItem(STORAGE_KEY, 'true'); } catch (err) {}
            }
        });
    }

    // Try multiple locations for the JSON (root absolute first, then script-relative, then page-relative)
    async function fetchTrainingJson() {
        const t = Date.now();
        const tried = [];
        // absolute root (best for hosted site)
        tried.push('/upcoming-trainings.json?v=' + t);

        // script-relative
        try {
            const currentScript = document.currentScript || Array.from(document.getElementsByTagName('script')).pop();
            if (currentScript && currentScript.src) {
                tried.push(new URL('upcoming-trainings.json?v=' + t, currentScript.src).href);
            }
        } catch (e) {}

        // page-relative
        try { tried.push(new URL('upcoming-trainings.json?v=' + t, window.location.href).href); } catch (e) { tried.push('upcoming-trainings.json?v=' + t); }

        for (const u of tried) {
            try {
                const res = await fetch(u);
                if (!res.ok) continue;
                const j = await res.json();
                return j;
            } catch (e) {
                // ignore and try next
            }
        }
        return null;
    }

    async function init() {
        // Disabled on corporate enterprise website to maintain professional B2B evaluation UX
        return;

        // create/inject popup only if not present
        if (!document.getElementById(POPUP_ID)) {
            const html = createPopupHTML();
            document.body.insertAdjacentHTML('beforeend', html);
        }

        attachPopupHandlers();

        const data = await fetchTrainingJson();
        const first = data && data.trainings && data.trainings[0];
        if (!first) return;

        const setText = (id, value) => { const el = document.getElementById(id); if (el) el.textContent = value || ''; };

        setText('popup-title', '🎯 ' + (first.name || ''));
        setText('popup-date', first.trainingStartDate || '');
        setText('popup-time', first.sessionTime || '');
        setText('popup-trainer', first.trainer || '');
        setText('popup-duration', (first.duration ? first.duration : '') + (first.sessionTime ? ' (' + first.sessionTime + ')' : ''));
        setText('popup-start-date', first.trainingStartDate || '');

        const registerBtn = document.getElementById('popup-register-btn');
        if (registerBtn) {
            registerBtn.href = first.contactUrl || '#';
        }

        // show after short delay (preserve UX)
        setTimeout(function() {
            const popup = document.getElementById(POPUP_ID);
            if (popup) {
                popup.style.display = 'flex';
                document.body.style.overflow = 'hidden';
            }
        }, 1500);
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();

})();
