/**
 * @file        assets/js/main.js
 * @project     Smalltalk Speech Therapy — Single-Page Website
 * @description Progressive enhancement for accessibility and interactions:
 *              - Sticky header elevation on scroll
 *              - Mobile hamburger menu with ARIA + focus trap
 *              - Smooth-scrolling fallback with sticky-header offset
 *              - Email obfuscation hydration (data-user + data-domain)
 *              - Footer year injection
 *
 * @dependencies  None (vanilla JS only)
 *
 * @notes
 * - Smooth scroll uses CSS by default; JS fallback triggers only if needed.
 * - Reduced-motion users get instant jumps (no smooth behavior).
 * - Focus trapping is active only while the mobile menu is open.
 */

(() => {
  /** Utility: test reduced motion preference */
  const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /** Cache DOM references */
  const header = document.querySelector('.site-header');
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.getElementById('primary-nav');

  /**
   * 1) Header elevation on scroll
   * Adds/removes a subtle shadow when content scrolls under the header.
   */
  const onScroll = () => {
    if (!header) return;
    if (window.scrollY > 0) header.classList.add('is-elevated');
    else header.classList.remove('is-elevated');
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // initialize on load

  /**
   * 2) Mobile menu toggle + accessibility
   * - Toggle .is-open on the nav and aria-expanded on the button
   * - Trap focus within the nav when open; close on ESC or link click
   * - Ensure state resets on viewport resize back to desktop
   */
  let isOpen = false;

  /** Return all focusable elements within the nav (links/buttons) */
  const getFocusable = () => (nav ? nav.querySelectorAll('a, button, [tabindex]:not([tabindex="-1"])') : []);

  /** Focus the first menu item for better SR/keyboard experience */
  const focusFirstMenuItem = () => {
    const f = getFocusable();
    if (f && f.length) f[0].focus();
  };

  const openMenu = () => {
    if (!nav || !toggle) return;
    isOpen = true;
    nav.classList.add('is-open');
    toggle.setAttribute('aria-expanded', 'true');

    // Defer focus to ensure DOM visibility
    setTimeout(focusFirstMenuItem, 0);
    document.addEventListener('keydown', onKeydown);
  };

  const closeMenu = () => {
    if (!nav || !toggle) return;
    isOpen = false;
    nav.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.focus();
    document.removeEventListener('keydown', onKeydown);
  };

  const toggleMenu = () => (isOpen ? closeMenu() : openMenu());

  /** Keydown handler for ESC closing and focus trapping */
  function onKeydown(e) {
    if (!isOpen) return;

    if (e.key === 'Escape') {
      e.preventDefault();
      closeMenu();
      return;
    }

    if (e.key === 'Tab') {
      const f = Array.from(getFocusable());
      if (!f.length) return;

      const first = f[0];
      const last = f[f.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  if (toggle) toggle.addEventListener('click', toggleMenu);
  if (nav) {
    // Close on link click
    nav.addEventListener('click', (e) => {
      const a = e.target instanceof Element ? e.target.closest('a') : null;
      if (a) closeMenu();
    });
  }

  // Close the menu if switching back to desktop layout
  window.addEventListener('resize', () => {
    if (window.innerWidth >= 1024 && isOpen) {
      closeMenu();
    }
  });

  /**
   * 3) Smooth scroll fallback with sticky header offset
   * - Use CSS smooth scroll where supported. Else, intercept anchor clicks and scroll manually.
   * - Respect reduced motion preference by disabling smooth behavior.
   */
  const supportsCssSmooth = 'scrollBehavior' in document.documentElement.style;
  const headerHeight = () => (header ? header.offsetHeight : 0) + 16; // extra space below header

  document.addEventListener('click', (e) => {
    const target = e.target instanceof Element ? e.target.closest('a[href^="#"]') : null;
    if (!target) return;

    const id = target.getAttribute('href');
    if (!id || id === '#') return;
    const sectionId = id.slice(1);
    const section = document.getElementById(sectionId);
    if (!section) return;

    if (!supportsCssSmooth) {
      // Prevent default only when we run our own scroll
      e.preventDefault();
      const y = section.getBoundingClientRect().top + window.scrollY - headerHeight();
      window.scrollTo({ top: y, behavior: prefersReduced ? 'auto' : 'smooth' });
    }
  });

  /**
   * 4) Email obfuscation hydration
   * - Replace span.ob-email (with data-user/domain) by a clickable <a href="mailto:...">
   * - If attributes are missing, leave noscript fallback visible.
   */
  const ob = document.querySelector('.ob-email');
  if (ob && ob instanceof HTMLElement) {
    const user = ob.dataset.user;
    const domain = ob.dataset.domain;

    if (user && domain) {
      const addr = `${user}@${domain}`;
      const a = document.createElement('a');
      a.href = `mailto:${addr}`;
      a.textContent = addr;
      a.className = 'email';
      ob.replaceWith(a);
    }
  }

  /**
   * 5) Footer year injection
   */
  const yearEl = document.querySelector('[data-year]');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
})();
