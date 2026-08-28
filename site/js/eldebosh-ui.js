/*
 * Eldebosh — delad UI-logik / shared UI behaviour.
 *   1. Filterchips ovanför produktrutnätet ("Alla" / "Finns att prova").
 *   2. Bildvisaren (lightbox) på produktkorten.
 *
 * Bildvisaren fungerar utan JS via :target. Med JS tar vi över för att slippa
 * hash-hopp i historiken, för att kunna stänga med Escape och för att flytta
 * dialogen ut ur kortet (ett kort med transform blir annars containing block
 * för position:fixed och klipper dialogen).
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
   * Filterchips
   * ------------------------------------------------------------------ */
  const initGearFilter = () => {
    const bar = document.querySelector('[data-gearbar]');
    const grid = document.querySelector('[data-gear-grid]');
    if (!bar || !grid) return;

    const countEl = document.querySelector('[data-gear-count]');
    const tiles = Array.from(grid.querySelectorAll('.tile'));
    const allBtn = bar.querySelector('[data-filter="all"]');
    const testedBtn = bar.querySelector('[data-toggle="tested"]');
    const template = grid.dataset.countTemplate || '{n}';

    let testedOnly = false;

    bar.hidden = false;
    if (countEl) countEl.hidden = false;

    const apply = () => {
      let shown = 0;
      for (const el of tiles) {
        const on = !testedOnly || el.dataset.tested === 'true';
        el.hidden = !on;
        if (on) shown++;
      }
      if (allBtn) {
        allBtn.classList.toggle('is-on', !testedOnly);
        allBtn.setAttribute('aria-pressed', String(!testedOnly));
      }
      if (testedBtn) {
        testedBtn.classList.toggle('is-on', testedOnly);
        testedBtn.setAttribute('aria-pressed', String(testedOnly));
      }
      if (countEl) {
        countEl.textContent = template.replace('{n}', shown);
        countEl.classList.toggle('is-empty', shown === 0);
      }
    };

    if (allBtn) allBtn.addEventListener('click', () => { testedOnly = false; apply(); });
    if (testedBtn) testedBtn.addEventListener('click', () => { testedOnly = !testedOnly; apply(); });

    apply();
  };

  /* ------------------------------------------------------------------ *
   * Bildvisare
   * ------------------------------------------------------------------ */
  const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

  const initViewers = () => {
    const viewers = Array.from(document.querySelectorAll('.viewer'));
    if (!viewers.length) return;

    let openViewer = null;
    let lastTrigger = null;
    let lockedScrollY = 0;

    for (const viewer of viewers) {
      // Ut ur kortet: .tile har overflow:hidden och transform vid hover,
      // vilket annars klipper den fixerade dialogen inuti kortet.
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

      // Lazy-bilder i en dold dialog laddas först när den visas — be om dem nu.
      for (const img of viewer.querySelectorAll('img[loading="lazy"]')) img.loading = 'eager';

      viewer.classList.add('is-open');

      // Lås sidan på plats. Enbart overflow:hidden räcker inte: iOS Safari
      // rullar ändå, och Chrome ignorerar focus({preventScroll}) när fokus
      // hamnar i en rullbar ruta — sidan hoppade ~300 px vid varje öppning.
      lockedScrollY = window.scrollY;
      document.body.style.top = `-${lockedScrollY}px`;
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

    // Direktlänk: /sv/#v-P-01 ska öppna dialogen i samma läge som ett klick.
    const fromHash = () => {
      if (!location.hash.startsWith('#v-')) return;
      const viewer = document.getElementById(location.hash.slice(1));
      if (viewer && viewer.classList.contains('viewer')) open(viewer, null);
    };

    window.addEventListener('hashchange', fromHash);
    fromHash();
  };

  ready(() => {
    initGearFilter();
    initViewers();
  });
})();
