// "/specs" — the spec catalog route. Every feature is a collapsible
// section; opening a section lazily mounts a case-card per case so
// closing the section can dispose its EditorViews and we don't pay
// for ones the user isn't looking at.
//
// Layout:
//   header           — short tagline + count summary
//   filter input     — free-text match against feature name / case label
//   feature groups   — one per feature; the group summary is the name
//                      + count, with a 1-line description on its own
//                      row when expanded.

import { createCaseCard, type Script, type CaseCard } from "../components/case-card.ts";
import { mountNav } from "../components/nav.ts";
import { onLocaleChange, t, translateTree } from "../i18n.ts";
import { collectCases } from "../../specs/features/index.ts";

const ISSUE_URL = "https://github.com/Albert-PZY/typora-web/issues/new";

type Group = {
  feature: string;
  scripts: Script[];
};

function groupByFeature(): Group[] {
  const byFeat = new Map<string, Script[]>();
  for (const c of collectCases()) {
    const arr = byFeat.get(c.feature) ?? [];
    arr.push({
      id: `${c.feature}-${c.id}`,
      label: c.label,
      seed: c.seed,
      events: c.events,
      checkpoints: c.checkpoints,
      feature: c.feature,
    });
    byFeat.set(c.feature, arr);
  }
  return [...byFeat.entries()]
    .map(([feature, scripts]) => ({ feature, scripts }))
    .sort((a, b) => a.feature.localeCompare(b.feature));
}

export function specsRoute(root: HTMLElement): () => void {
  const cleanupNav = mountNav(root, "/specs");

  const groups = groupByFeature();
  const totalCases = groups.reduce((n, g) => n + g.scripts.length, 0);

  const main = document.createElement("main");
  main.className = "page page-specs";
  main.innerHTML = `
    <header class="specs-header">
      <h1 data-i18n="specs.title"></h1>
      <p class="specs-meta" data-i18n-html="specs.metaObject"></p>
      <p class="specs-meta specs-counts"></p>
      <details class="specs-format">
        <summary data-i18n="specs.howTo"></summary>
        <div class="specs-format-body">
          <p data-i18n-html="specs.formatIntro"></p>
          <ul>
            <li data-i18n-html="specs.formatChar"></li>
            <li data-i18n-html="specs.formatString"></li>
            <li data-i18n-html="specs.formatKey"></li>
            <li data-i18n-html="specs.formatCombo"></li>
          </ul>
          <p data-i18n-html="specs.checkpointIntro"></p>
          <table class="specs-format-table">
            <thead><tr><th data-i18n="specs.tableTag"></th><th data-i18n="specs.tableMeaning"></th></tr></thead>
            <tbody>
              <tr><td>plain text</td><td data-i18n="specs.meaningPlain"></td></tr>
              <tr><td><code>&lt;i&gt;...&lt;/i&gt;</code></td><td data-i18n="specs.meaningEm"></td></tr>
              <tr><td><code>&lt;b&gt;...&lt;/b&gt;</code></td><td data-i18n="specs.meaningStrong"></td></tr>
              <tr><td><code>&lt;c&gt;...&lt;/c&gt;</code></td><td data-i18n="specs.meaningCode"></td></tr>
              <tr><td><code>&lt;s&gt;...&lt;/s&gt;</code></td><td data-i18n="specs.meaningStrike"></td></tr>
              <tr><td><code>&lt;l:url&gt;...&lt;/l&gt;</code></td><td data-i18n="specs.meaningLink"></td></tr>
              <tr><td><code>&lt;a:url&gt;...&lt;/a&gt;</code></td><td data-i18n="specs.meaningAutolink"></td></tr>
              <tr><td><code>&lt;mark&gt;...&lt;/mark&gt;</code> · <code>&lt;sub&gt;...&lt;/sub&gt;</code> · <code>&lt;sup&gt;...&lt;/sup&gt;</code></td><td data-i18n="specs.meaningMarks"></td></tr>
              <tr><td><code>&lt;g&gt;*&lt;/g&gt;</code> · <code>&lt;g&gt;**&lt;/g&gt;</code> · <code>&lt;g&gt;\`&lt;/g&gt;</code></td><td data-i18n="specs.meaningDelim"></td></tr>
              <tr><td><code>|</code></td><td data-i18n="specs.meaningCaret"></td></tr>
              <tr><td><code>[...]</code></td><td data-i18n="specs.meaningSelection"></td></tr>
              <tr><td><code># </code> · <code>## </code></td><td data-i18n="specs.meaningHeading"></td></tr>
              <tr><td><code>- </code> · <code>1. </code></td><td data-i18n="specs.meaningList"></td></tr>
              <tr><td><code>&gt; </code></td><td data-i18n="specs.meaningQuote"></td></tr>
              <tr><td><code>&lt;hr/&gt;</code> · <code>&lt;br/&gt;</code> · <code>&lt;toc/&gt;</code></td><td data-i18n="specs.meaningBlocks"></td></tr>
              <tr><td><code>&lt;checkbox/&gt;</code> · <code>&lt;checkbox checked/&gt;</code></td><td data-i18n="specs.meaningCheckbox"></td></tr>
            </tbody>
          </table>
        </div>
      </details>
      <div class="specs-toolbar">
        <input
          id="specs-filter"
          class="specs-filter"
          type="search"
          data-i18n-placeholder="specs.filterPlaceholder"
          autocomplete="off"
          spellcheck="false"
        />
      </div>
    </header>
    <div class="specs-groups"></div>
    <footer class="specs-footer">
      <span data-i18n="specs.footerPrompt"></span>
      <a href="${ISSUE_URL}" target="_blank" rel="noopener" data-i18n="specs.footerIssue"></a>
      <span data-i18n="specs.footerSuffix"></span>
    </footer>
  `;
  root.append(main);

  const $groups = main.querySelector(".specs-groups") as HTMLElement;
  const $filter = main.querySelector("#specs-filter") as HTMLInputElement;
  const $counts = main.querySelector(".specs-counts") as HTMLElement;

  const allCards: CaseCard[] = [];

  type GroupHandle = {
    feature: string;
    detail: HTMLDetailsElement;
    scripts: Script[];
    cardEls: HTMLElement[];
    mountCards: () => void;
  };
  const handles: GroupHandle[] = [];

  for (const [i, g] of groups.entries()) {
    const det = document.createElement("details") as HTMLDetailsElement;
    det.className = "spec-group";
    if (i === 0) det.open = true;
    det.innerHTML = `
      <summary>
        <span class="spec-group-name"></span>
        <span class="spec-group-count">${g.scripts.length}</span>
      </summary>
      <p class="spec-group-desc" data-feature-desc="${g.feature}"></p>
      <div class="spec-group-body"></div>
    `;
    (det.querySelector(".spec-group-name") as HTMLElement).textContent = g.feature;
    const body = det.querySelector(".spec-group-body") as HTMLElement;
    let mountedCards: CaseCard[] | null = null;
    const cardEls: HTMLElement[] = [];

    const mountCards = (): void => {
      if (mountedCards) return;
      mountedCards = g.scripts.map((s) => {
        const c = createCaseCard(s);
        c.el.dataset.featureId = g.feature;
        c.el.dataset.caseLabel = s.label.toLowerCase();
        body.append(c.el);
        cardEls.push(c.el);
        return c;
      });
      allCards.push(...mountedCards);
      applyFilter($filter.value);
    };
    const unmountCards = (): void => {
      if (!mountedCards) return;
      for (const c of mountedCards) c.destroy();
      body.innerHTML = "";
      cardEls.length = 0;
      mountedCards = null;
    };

    if (det.open) mountCards();
    det.addEventListener("toggle", () => {
      if (det.open) mountCards();
      else unmountCards();
    });
    $groups.append(det);

    handles.push({
      feature: g.feature,
      detail: det,
      scripts: g.scripts,
      cardEls,
      mountCards,
    });
  }

  function applyFilter(q: string): void {
    const needle = q.trim().toLowerCase();
    if (!needle) {
      for (const h of handles) {
        h.detail.classList.remove("hidden");
        for (const el of h.cardEls) el.classList.remove("hidden");
      }
      return;
    }
    for (const h of handles) {
      const featHit = h.feature.toLowerCase().includes(needle);
      const matchedScripts = h.scripts.filter(
        (s) => featHit || s.label.toLowerCase().includes(needle),
      );
      if (matchedScripts.length === 0) {
        h.detail.classList.add("hidden");
        continue;
      }
      h.detail.classList.remove("hidden");
      if (!h.detail.open) {
        h.detail.open = true;
      } else {
        h.mountCards();
      }
      for (const el of h.cardEls) {
        const lbl = el.dataset.caseLabel ?? "";
        const show = featHit || lbl.includes(needle);
        el.classList.toggle("hidden", !show);
      }
    }
  }

  let filterTimer: number | null = null;
  $filter.addEventListener("input", () => {
    if (filterTimer !== null) clearTimeout(filterTimer);
    filterTimer = window.setTimeout(() => applyFilter($filter.value), 80);
  });

  const applyLocale = (): void => {
    translateTree(main);
    $counts.innerHTML = t("specs.metaCounts", {
      cases: totalCases,
      features: groups.length,
    });
    for (const desc of main.querySelectorAll<HTMLElement>("[data-feature-desc]")) {
      desc.textContent = t(`feature.${desc.dataset.featureDesc ?? ""}`);
    }
  };
  applyLocale();
  const cleanupLocale = onLocaleChange(applyLocale);

  return () => {
    cleanupLocale();
    cleanupNav();
    if (filterTimer !== null) clearTimeout(filterTimer);
    for (const c of allCards) c.destroy();
  };
}
