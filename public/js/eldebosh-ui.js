/*
 * Eldebosh — the site's only JavaScript.
 *   1. Filter buttons above the product grid ("Alla" + one per group).
 *   2. The photo viewer on product tiles.
 *
 * Both work without JavaScript: the filter bar stays hidden and every product
 * shows; the viewer opens via :target. With JavaScript the viewer avoids
 * history entries, closes on Escape, traps focus, and moves each dialog out
 * of its tile (a tile with a transform would otherwise become the containing
 * block for position: fixed and clip the dialog).
 *
 * Served at a fixed path with a content hash in its URL (src/lib/asset-hash.ts).
 * Tested by npm run test:ui (jsdom) and npm run test:browser (Chromium).
 */
(() => {
  'use strict';

  const ready = (fn) => {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn, { once: true });
    } else {
      fn();
    }
  };

  /* ------------------------------------------------------------------ *
   * Filter
   * ------------------------------------------------------------------ */
  const initGearFilter = (root = document) => {
    const bar = root.querySelector('[data-gearbar]');
    const grid = root.querySelector('[data-gear-grid]');
    if (!bar || !grid) return;

    const countEl = root.querySelector('[data-gear-count]');
    const tiles = Array.from(grid.querySelectorAll('.tile'));
    const buttons = Array.from(bar.querySelectorAll('[data-filter]'));
    const template = grid.dataset.countTemplate || '{n}';

    // "all" or a group id; tiles carry the same id in data-category.
    let active = 'all';

    bar.hidden = false;
    if (countEl) countEl.hidden = false;

    const apply = () => {
      let shown = 0;
      for (const el of tiles) {
        const on = active === 'all' || el.dataset.category === active;
        el.hidden = !on;
        if (on) shown++;
      }
      for (const btn of buttons) {
        const on = btn.dataset.filter === active;
        btn.classList.toggle('is-on', on);
        btn.setAttribute('aria-pressed', String(on));
      }
      if (countEl) {
        countEl.textContent = template.replace('{n}', shown);
        countEl.classList.toggle('is-empty', shown === 0);
      }
    };

    for (const btn of buttons) {
      btn.addEventListener('click', () => {
        active = btn.dataset.filter || 'all';
        apply();
      });
    }

    apply();
  };

  /* ------------------------------------------------------------------ *
   * Photo viewer
   * ------------------------------------------------------------------ */
  const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

  const initViewers = () => {
    const viewers = Array.from(document.querySelectorAll('.viewer'));
    if (!viewers.length) return;

    let openViewer = null;
    let lastTrigger = null;
    let lockedScrollY = 0;

    for (const viewer of viewers) {
      // Out of the tile: .tile has overflow: hidden and a hover transform,
      // either of which would clip the fixed dialog.
      if (viewer.parentElement !== document.body) document.body.appendChild(viewer);

      viewer.setAttribute('role', 'dialog');
      viewer.setAttribute('aria-modal', 'true');

      const title = viewer.querySelector('.viewer-title');
      if (title) {
        if (!title.id) title.id = `${viewer.id}-title`;
        viewer.setAttribute('aria-labelledby', title.id);
      }
    }

    const close = () => {
      if (!openViewer) return;
      openViewer.classList.remove('is-open');
      openViewer = null;

      // release the lock and put the page back exactly where it was
      document.body.classList.remove('viewer-open');
      document.body.style.top = '';
      window.scrollTo({ top: lockedScrollY, left: 0, behavior: 'instant' });
      if (location.hash.startsWith('#v-')) {
        history.replaceState(null, '', location.pathname + location.search);
      }
      if (lastTrigger) {
        lastTrigger.focus({ preventScroll: true });
        lastTrigger = null;
      }
    };

    const open = (viewer, trigger) => {
      if (openViewer === viewer) return;
      if (openViewer) openViewer.classList.remove('is-open');

      openViewer = viewer;
      lastTrigger = trigger || null;

      // lazy images in a hidden dialog load only once shown — request them now
      for (const img of viewer.querySelectorAll('img[loading="lazy"]')) img.loading = 'eager';

      // hold the page at its offset — overflow: hidden alone is not enough
      lockedScrollY = window.scrollY;
      document.body.style.top = `-${lockedScrollY}px`;

      viewer.classList.add('is-open');
      document.body.classList.add('viewer-open');

      const closeBtn = viewer.querySelector('.viewer-close');
      if (closeBtn) closeBtn.focus({ preventScroll: true });
    };

    const viewerFor = (link) => {
      const href = link.getAttribute('href') || '';
      if (!href.startsWith('#')) return null;
      let el = null;
      try {
        el = document.getElementById(decodeURIComponent(href.slice(1)));
      } catch {
        el = document.getElementById(href.slice(1));
      }
      return el && el.classList.contains('viewer') ? el : null;
    };

    document.addEventListener('click', (event) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey ||
          event.shiftKey || event.altKey) return;

      const opener = event.target.closest('a.tile-face[href^="#v-"]');
      if (opener) {
        const viewer = viewerFor(opener);
        if (viewer) {
          event.preventDefault();
          open(viewer, opener);
        }
        return;
      }

      if (openViewer && event.target.closest('.viewer-close, .viewer-veil')) {
        event.preventDefault();
        close();
      }
    });

    document.addEventListener('keydown', (event) => {
      if (!openViewer) return;

      if (event.key === 'Escape') {
        event.preventDefault();
        close();
        return;
      }

      if (event.key !== 'Tab') return;

      const items = Array.from(openViewer.querySelectorAll(FOCUSABLE))
        .filter((el) => el.offsetParent !== null || el === document.activeElement);
      if (!items.length) return;

      const first = items[0];
      const last = items[items.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });

    // a direct link such as /sv/#v-P-01 opens the dialog as a click would
    const fromHash = () => {
      if (!location.hash.startsWith('#v-')) return;
      const viewer = document.getElementById(location.hash.slice(1));
      if (viewer && viewer.classList.contains('viewer')) open(viewer, null);
    };

    window.addEventListener('hashchange', fromHash);
    fromHash();
  };

  // Exposed for scripts/make-preview.mjs, which renders pages into a single
  // offline file and must re-run the filter after every in-page navigation.
  // Sharing this one function keeps the preview from drifting from the site.
  window.EldeboshUI = { initGearFilter };

  ready(() => {
    initGearFilter();
    initViewers();
  });
})();
