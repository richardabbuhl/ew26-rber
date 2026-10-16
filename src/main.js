import { bids } from "./data/bids.js";
import { deployments } from "./data/deployments.js";
import { providers } from "./data/providers.js";
import { qualityGates } from "./data/quality-gates.js";
import { specifications } from "./data/specifications.js";

const root = document.querySelector("#root");
const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const dates = new Intl.DateTimeFormat("en-US", { month: "short", day: "2-digit", year: "numeric", timeZone: "UTC" });
const state = { filter: "All", query: "", selectedBidId: "", confirmed: false, mobileNavOpen: false };
const esc = (value) => String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
const formatDate = (value) => dates.format(new Date(`${value}T00:00:00Z`));
const bidsFor = (id) => bids.filter((bid) => bid.specificationId === id);
const providerFor = (bid) => providers.find((provider) => provider.id === bid.providerId);
const statusClass = (status) => status.toLowerCase().replace(/ /g, "-");
const glyph = (value, className = "") => `<span class="glyph ${className}" aria-hidden="true">${value}</span>`;

function statusTag(status) {
  const mark = status === "Bidding" ? "◉" : status === "Under Review" ? "◷" : "✓";
  return `<span class="status-tag status-${statusClass(status)}">${mark} ${esc(status)}</span>`;
}

function footer(left, right) {
  return `<footer class="page-footer"><span>${left}</span><span>${right}</span></footer>`;
}

function shell(page, route) {
  const active = (prefix) => route === prefix || (prefix !== "/" && route.startsWith(prefix));
  root.innerHTML = `
    <div class="app-shell">
      <aside class="sidebar ${state.mobileNavOpen ? "sidebar-open" : ""}">
        <a class="brand" href="#/"><img class="brand-mark" src="./logo/rber-logo.jpg" alt=""><span>rber<span class="brand-period">.</span></span></a>
        <div class="workspace-select"><span class="workspace-glyph">R</span><span class="workspace-copy"><strong>Rabobank</strong><small>Product studio</small></span><span>⌄</span></div>
        <div class="nav-label">WORKSPACE</div>
        <nav class="primary-nav" aria-label="Main navigation">
          <a class="nav-link ${active("/") ? "nav-link-active" : ""}" href="#/">${glyph("▦")}<span>Overview</span><span class="nav-key">01</span></a>
          <a class="nav-link ${active("/marketplace") ? "nav-link-active" : ""}" href="#/marketplace">${glyph("◇")}<span>Marketplace</span><span class="nav-count">03</span></a>
          <a class="nav-link ${active("/specifications") ? "nav-link-active" : ""}" href="#/specifications/spec-001">${glyph("▤")}<span>Specifications</span></a>
          <a class="nav-link ${active("/compare") ? "nav-link-active" : ""}" href="#/compare/spec-001">${glyph("⇄")}<span>Bid comparison</span><span class="nav-dot"></span></a>
        </nav>
        <div class="sidebar-spacer"></div>
        <div class="sidebar-status"><div class="sidebar-status-top"><span class="live-dot"></span> MARKET LIVE <span class="status-time">SYNCED</span></div><div class="sidebar-sparkline" aria-hidden="true">${Array.from({ length: 12 }, () => "<i></i>").join("")}</div><div class="sidebar-status-bottom"><span>4 providers online</span><span>99.8%</span></div></div>
        <div class="profile-button"><span class="profile-avatar">RA</span><span class="profile-copy"><strong>Richard Abbuhl</strong><small>Product owner</small></span><span class="more-dots">•••</span></div>
      </aside>
      ${state.mobileNavOpen ? '<button class="nav-backdrop" data-close-nav aria-label="Close navigation"></button>' : ""}
      <div class="main-shell"><header class="topbar"><button class="icon-button menu-trigger" data-menu aria-label="Toggle navigation">${state.mobileNavOpen ? "×" : "☰"}</button><div class="breadcrumbs"><span>Rber</span><span>›</span><strong>Outcome exchange</strong></div><div class="topbar-right"><span class="topbar-environment"><span class="live-dot"></span> DEMO ENVIRONMENT</span><span class="icon-button notification-button" aria-label="Notifications">♧<i></i></span><span class="topbar-avatar">RA</span></div></header><main class="page-main">${page}</main></div>
    </div>`;
}

function metric(label, value, detail, symbol, tone) {
  return `<div class="metric metric-${tone}"><div class="metric-top"><span>${label}</span><span class="metric-icon">${symbol}</span></div><strong>${value}</strong><small>${detail}</small></div>`;
}

function specificationRow(specification, index) {
  const count = bidsFor(specification.id).length;
  return `<a class="spec-row" href="#/specifications/${specification.id}"><span class="spec-number spec-number-${index}">${String(index + 1).padStart(2, "0")}</span><span class="spec-row-main"><strong>${esc(specification.title)}</strong><small>${esc(specification.complexity)} complexity <i></i> Due ${formatDate(specification.dueDate)}</small></span><span class="spec-row-budget"><strong>${money.format(specification.budget)}</strong><small>${count ? `${count} bids received` : "Awaiting proposals"}</small></span>${statusTag(specification.status)}<span class="spec-row-chevron">›</span></a>`;
}

function providerLine(provider, index) {
  const initials = provider.name.split(" ").map((part) => part[0]).slice(0, 2).join("");
  return `<div class="provider-line"><span class="provider-monogram monogram-${index}">${esc(initials)}</span><span class="provider-line-copy"><strong>${esc(provider.name)}</strong><small>${esc(provider.type)} · ${esc(provider.averageDeliveryTime)}</small></span><span class="provider-rating">✧ ${provider.rating.toFixed(1)}</span></div>`;
}

function deliverySignal() {
  const deployment = deployments[0];
  const passed = qualityGates.filter((gate) => gate.status === "Passed").length;
  return `<section class="delivery-signal"><div class="delivery-copy"><div class="eyebrow">DELIVERY SIGNAL / DEMO</div><h2>${esc(deployment.implementation)}<span> · </span>${esc(deployment.provider)}</h2><p>Environment progression and verification evidence from the static demo data.</p></div><div class="environment-flow">${deployment.environments.map((environment) => `<div class="environment-step"><span class="environment-icon ${environment.status.toLowerCase()}">${environment.status === "Running" ? "◉" : "✓"}</span><span><strong>${esc(environment.name)}</strong><small>${esc(environment.status)}</small></span></div><i class="environment-connector"></i>`).join("").replace(/<i class="environment-connector"><\/i>$/, "")}</div><div class="gate-summary"><span class="gate-summary-icon">▣</span><strong>${String(passed).padStart(2, "0")}</strong><span>quality gates<br>passed</span><span>↗</span></div></section>`;
}

function overviewPage() {
  const total = specifications.reduce((sum, specification) => sum + specification.budget, 0);
  const awarded = specifications.filter((specification) => specification.status === "Awarded").length;
  return `<div class="page-content overview-page"><div class="welcome-line"><span>THURSDAY, OCTOBER 16, 2026</span><span class="welcome-divider"></span><span>RABOBANK / PRODUCT STUDIO</span></div>
    <section class="overview-hero"><div class="hero-copy"><div class="eyebrow">✧ THE OUTCOME EXCHANGE</div><h1 aria-label="From intent to outcome.">From intent<br><em> to outcome.</em></h1><p>Software specs meet the world's best implementation teams. Compare the work, verify the evidence, choose what wins.</p><a class="button button-lime" href="#/marketplace">Explore marketplace <span>→</span></a><div class="hero-footnote"><span class="live-dot"></span> LIVE SPECIFICATIONS <strong>03</strong><span>/</span> PROVIDERS <strong>04</strong></div></div><div class="hero-visual" aria-label="Intent, market, and proof"><div class="orbit"></div><div class="orbit orbit-two"></div><div class="visual-center"><span class="center-mark">R</span><strong>RBER</strong><small>OUTCOME ENGINE</small></div><div class="visual-node node-intent"><span class="node-index">01</span>▤ INTENT<i></i></div><div class="visual-node node-market"><span class="node-index">02</span>◇ MARKET<i></i></div><div class="visual-node node-proof"><span class="node-index">03</span>✓ PROOF<i></i></div><div class="visual-caption">SPECIFICATION<br>IS THE SOURCE</div><div class="visual-coordinate">52°05' N<br>05°07' E</div></div><span class="hero-index">01 — 03</span></section>
    <section class="metric-strip">${metric("Specifications", "03", "Across the portfolio", "▤", "lime")}${metric("Open proposals", String(bids.length).padStart(2, "0"), "Mortgage Portal · live", "⇄", "coral")}${metric("Pipeline value", money.format(total), "Total specification budgets", "$", "aqua")}${metric("Awarded", String(awarded).padStart(2, "0"), "Moving into delivery", "◎", "gold")}</section>
    <section class="overview-lower"><div class="portfolio-panel"><div class="section-heading"><div><div class="eyebrow">LIVE PORTFOLIO</div><h2>Specifications in motion</h2></div><a class="text-link" href="#/marketplace">All specifications →</a></div><div class="spec-list">${specifications.map(specificationRow).join("")}</div></div><aside class="market-pulse"><div class="pulse-heading"><div><div class="eyebrow">MARKET PULSE</div><h2>Provider network</h2></div><span class="pulse-live">● LIVE</span></div><div class="provider-stack">${providers.slice(0, 3).map(providerLine).join("")}</div><a class="provider-footer" href="#/marketplace">VIEW NETWORK <span>↗</span></a></aside></section>
    ${deliverySignal()}${footer("RBER OUTCOME EXCHANGE", "SPECIFICATION-FIRST DELIVERY · BUILT FOR BETTER OUTCOMES")}</div>`;
}

function marketplaceRows() {
  const matches = specifications.filter((specification) => {
    const matchesStatus = state.filter === "All" || specification.status === state.filter;
    const haystack = `${specification.title} ${specification.businessObjective}`.toLowerCase();
    return matchesStatus && haystack.includes(state.query.toLowerCase());
  });
  if (!matches.length) return '<div class="empty-state"><strong>No matching specifications</strong><span>Try another title or status filter.</span></div>';
  return matches.map((specification, index) => {
    const count = bidsFor(specification.id).length;
    return `<article class="market-card"><div class="market-card-title"><span class="spec-number spec-number-${index}">${String(index + 1).padStart(2, "0")}</span><div><a href="#/specifications/${specification.id}"><h3>${esc(specification.title)}</h3></a><p>${esc(specification.businessObjective)}</p></div></div><div class="market-cell market-status-cell">${statusTag(specification.status)}</div><div class="market-cell market-budget"><strong>${money.format(specification.budget)}</strong><small>${esc(specification.complexity)} scope</small></div><div class="market-cell market-due">◷ ${formatDate(specification.dueDate)}</div><div class="market-card-actions">${count ? `<a class="compare-link" href="#/compare/${specification.id}">⇄ ${count} bids</a>` : ""}<a class="round-link" href="#/specifications/${specification.id}" aria-label="View ${esc(specification.title)}">→</a></div></article>`;
  }).join("");
}

function providerCard(provider, index) {
  const initials = provider.name.split(" ").map((part) => part[0]).slice(0, 2).join("");
  return `<article class="provider-card"><div class="provider-card-top"><span class="provider-monogram monogram-${index}">${esc(initials)}</span><span class="provider-card-type">${esc(provider.type)}</span><span class="provider-rating">✧ ${provider.rating.toFixed(1)}</span></div><h3>${esc(provider.name)}</h3><p>${esc(provider.tagline)}</p><div class="provider-card-metrics"><span><strong>${provider.averageQualityScore}</strong><small>quality</small></span><span><strong>${provider.averageSecurityScore}</strong><small>security</small></span><span><strong>${esc(provider.averageDeliveryTime)}</strong><small>avg. delivery</small></span></div><div class="strength-list">${provider.strengths.slice(0, 2).map((strength) => `<span>${esc(strength)}</span>`).join("")}</div></article>`;
}

function marketplacePage() {
  const total = specifications.reduce((sum, specification) => sum + specification.budget, 0);
  const filters = ["All", "Bidding", "Under Review", "Awarded"];
  return `<div class="page-content marketplace-page"><div class="page-title-row"><div><div class="eyebrow">SPECIFICATION MARKETPLACE / 01</div><h1>Find the right outcome.</h1><p>Every brief is an invitation to compete. Review the need, then compare what the network can deliver.</p></div><a class="button button-dark" href="#/specifications/spec-001">＋ Open a brief</a></div>
    <section class="marketplace-overview-bar"><div class="marketplace-stat"><span class="market-stat-number">03</span><span><strong>Active briefs</strong><small>Across 3 stages</small></span></div><span class="market-divider"></span><div class="marketplace-stat"><span class="market-stat-number">04</span><span><strong>Verified providers</strong><small>Ready to compete</small></span></div><span class="market-divider"></span><div class="marketplace-stat"><span class="market-stat-number">${money.format(total)}</span><span><strong>Total opportunity</strong><small>Portfolio budget</small></span></div><div class="marketplace-bar-mark"><span>R</span><small>SELECT WITH<br>EVIDENCE</small></div></section>
    <section class="market-controls"><div class="segmented-control" aria-label="Filter by status">${filters.map((filter) => `<button type="button" data-filter="${filter}" class="${state.filter === filter ? "segment-active" : ""}">${filter}<span>${filter === "All" ? specifications.length : specifications.filter((specification) => specification.status === filter).length}</span></button>`).join("")}</div><label class="search-field"><span>⌕</span><input id="market-search" type="search" placeholder="Search specifications" value="${esc(state.query)}"></label></section>
    <section class="market-list"><div class="market-list-heading"><span>SPECIFICATION / BUSINESS NEED</span><span>STATUS</span><span>BUDGET</span><span>DELIVERY BY</span><span></span></div><div id="market-rows">${marketplaceRows()}</div></section>
    <section class="provider-network-section"><div class="section-heading"><div><div class="eyebrow">IMPLEMENTATION NETWORK</div><h2>Four ways to build better</h2></div><span class="network-count">04 PROVIDERS · ALL VERIFIED</span></div><div class="provider-grid">${providers.map(providerCard).join("")}</div></section>${footer("RBER OUTCOME EXCHANGE", "PROVIDER-NEUTRAL · EVIDENCE-LED")}</div>`;
}

function detailPage(id) {
  const specification = specifications.find((item) => item.id === id);
  if (!specification) return notFound();
  const offers = bidsFor(id);
  const first = offers[0];
  const isAwarded = specification.status === "Awarded";
  const panelStatus = offers.length ? "BIDDING LIVE" : isAwarded ? "AWARD COMPLETE" : "UNDER REVIEW";
  const panelCount = offers.length ? String(offers.length).padStart(2, "0") : isAwarded ? "✓" : "00";
  const panelTitle = offers.length ? `${offers.length === 1 ? "proposal" : "proposals"} received` : isAwarded ? "implementation awarded" : "proposals in review";
  const panelCopy = first ? `Latest from ${providerFor(first).name}.` : isAwarded ? "Award status is provided by the static specification mock." : "Provider responses are being evaluated.";
  return `<div class="page-content detail-page"><a class="back-link" href="#/marketplace">↙ BACK TO MARKETPLACE</a><div class="detail-heading"><div><div class="eyebrow">SPECIFICATION / ${esc(id.toUpperCase())}</div><h1>${esc(specification.title)}</h1><p>${esc(specification.description)}</p></div>${statusTag(specification.status)}</div>
    <div class="detail-meta-grid"><div class="meta-item meta-wide"><span class="meta-icon">◎</span><span><small>Business objective</small><strong>${esc(specification.businessObjective)}</strong></span></div><div class="meta-item"><span class="meta-icon">$</span><span><small>Budget ceiling</small><strong>${money.format(specification.budget)}</strong></span></div><div class="meta-item"><span class="meta-icon">◷</span><span><small>Delivery target</small><strong>${formatDate(specification.dueDate)}</strong></span></div><div class="meta-item"><span class="meta-icon">◉</span><span><small>Complexity</small><strong>${esc(specification.complexity)}</strong></span></div></div>
    <div class="detail-columns"><div class="detail-main-column"><section class="detail-section"><div class="section-heading"><div><div class="eyebrow">01 / SCOPE</div><h2>What needs to happen</h2></div><span class="section-count">${String(specification.requirements.length).padStart(2, "0")} REQUIREMENTS</span></div><div class="requirement-list">${specification.requirements.map((requirement, index) => `<div class="requirement-item"><span>${String(index + 1).padStart(2, "0")}</span><strong>${esc(requirement)}</strong><span>✓</span></div>`).join("")}</div></section>
    <section class="detail-section"><div class="section-heading"><div><div class="eyebrow">02 / QUALITY BAR</div><h2>Constraints & success</h2></div></div><div class="quality-columns"><div><h3>▣ Guardrails</h3>${specification.nonFunctionalRequirements.map((item) => `<p class="check-line"><span>✓</span>${esc(item)}</p>`).join("")}</div><div><h3>◎ Success looks like</h3>${specification.successCriteria.map((item) => `<p class="check-line"><span>✓</span>${esc(item)}</p>`).join("")}</div></div></section></div>
    <aside class="detail-side-column"><section class="tech-panel"><div class="eyebrow">DELIVERY CONTEXT</div><h2>Preferred stack</h2><div class="tech-tags">${specification.technologies.map((technology) => `<span>${esc(technology)}</span>`).join("")}</div><div class="tech-panel-rule"></div><div class="context-row"><span>Business case</span><strong>${esc(specification.complexity)} complexity</strong></div><div class="context-row"><span>Due date</span><strong>${formatDate(specification.dueDate)}</strong></div></section><section class="proposal-panel"><div class="proposal-panel-heading"><span class="proposal-icon">✦</span><span class="proposal-live">${panelStatus}</span></div><strong class="proposal-count">${panelCount}</strong><h2>${panelTitle}</h2><p>${panelCopy}</p>${offers.length ? `<a class="button button-lime button-full" href="#/compare/${id}">Compare proposals →</a>` : ""}</section></aside></div>${footer("SPECIFICATION VERSION 1.0", "LAST REVIEWED OCT 16, 2026 · OWNER: PRODUCT STUDIO")}</div>`;
}

function score(bid) {
  return Math.round(bid.qualityScore * 0.4 + bid.securityScore * 0.25 + bid.complianceScore * 0.2 + bid.confidenceScore * 0.15);
}

function comparePage(id) {
  const specification = specifications.find((item) => item.id === id);
  if (!specification) return notFound();
  const offers = bidsFor(id).sort((a, b) => score(b) - score(a));
  if (!offers.length) return `<div class="page-content"><div class="empty-comparison"><div class="empty-comparison-mark">⇄</div><div class="eyebrow">DECISION ROOM</div><h1>No proposals to compare yet.</h1><p>${esc(specification.title)} is currently ${statusTag(specification.status)}. When providers respond, their offers will appear here.</p><a class="button button-dark" href="#/specifications/${id}">View specification →</a></div></div>`;
  const recommended = offers[0];
  if (!offers.some((offer) => offer.id === state.selectedBidId)) state.selectedBidId = recommended.id;
  const selected = offers.find((offer) => offer.id === state.selectedBidId);
  const metrics = [["Quality score", "qualityScore"], ["Security", "securityScore"], ["Compliance", "complianceScore"], ["Performance", "performanceScore"], ["Maintainability", "maintainabilityScore"], ["Confidence", "confidenceScore"]];
  const headings = offers.map((offer, index) => { const provider = providerFor(offer); const initials = provider.name.split(" ").map((word) => word[0]).slice(0, 2).join(""); return `<th class="${offer.id === recommended.id ? "bid-best-column" : ""}"><span class="provider-monogram monogram-${index}">${esc(initials)}</span><span class="bid-head-name"><strong>${esc(provider.name)}</strong><small>${esc(provider.type)}</small></span>${offer.id === recommended.id ? '<span class="best-fit-tag">BEST FIT</span>' : ""}</th>`; }).join("");
  const metricRows = metrics.map(([label, key]) => `<tr><th>${label}<span>automated review</span></th>${offers.map((offer) => `<td><span class="score-line"><strong>${offer[key]}</strong><small>/100</small><span class="score-track"><i class="${offer[key] >= 96 ? "score-high" : offer[key] < 93 ? "score-watch" : ""}" style="width:${offer[key]}%"></i></span></span></td>`).join("")}</tr>`).join("");
  const columns = offers.map((offer) => `<td><button class="select-bid ${offer.id === selected.id ? "select-bid-active" : ""}" data-select-bid="${offer.id}">${offer.id === selected.id ? "✓ Selected" : "Select bid"}</button></td>`).join("");
  const selectedProvider = providerFor(selected);
  return `<div class="page-content comparison-page"><a class="back-link" href="#/specifications/${id}">↙ BACK TO SPECIFICATION</a><div class="page-title-row"><div><div class="eyebrow">DECISION ROOM / BID ANALYSIS</div><h1>Compare the outcomes.</h1><p>${esc(specification.title)} · ${offers.length} implementations evaluated against one shared brief.</p></div><span class="analysis-stamp">✓ EVIDENCE VERIFIED</span></div>
    <section class="recommendation-band"><div class="recommendation-copy"><span class="recommendation-kicker">✧ RBER RECOMMENDS</span><h2>${esc(providerFor(recommended).name)}</h2><p>${esc(recommended.summary)}</p><span class="recommendation-score">${score(recommended)}<small> / 100 composite fit</small></span></div><div class="recommendation-stats"><span><small>PRICE</small><strong>${money.format(recommended.cost)}</strong><i>of ${money.format(specification.budget)} ceiling</i></span><span><small>DELIVERY</small><strong>${esc(recommended.deliveryTime)}</strong><i>target ${formatDate(specification.dueDate)}</i></span><span><small>QUALITY</small><strong>${recommended.qualityScore}<em>/100</em></strong><i>top score in field</i></span></div><div class="recommendation-mark">✓<span>BEST<br>FIT</span></div></section>
    <section class="compare-section"><div class="section-heading"><div><div class="eyebrow">02 / SIDE-BY-SIDE</div><h2>Three ways to deliver</h2></div><span class="compare-metadata">${offers.length} BIDS · ONE SPECIFICATION · STATIC MOCK DATA</span></div><div class="bid-table-wrap"><table class="bid-table"><thead><tr><th>EVALUATION</th>${headings}</tr></thead><tbody><tr class="price-row"><th>Total cost<span>vs. ${money.format(specification.budget)} ceiling</span></th>${offers.map((offer) => `<td><strong>${money.format(offer.cost)}</strong><div class="cost-track"><i style="width:${Math.min(offer.cost / specification.budget * 100, 100)}%"></i></div></td>`).join("")}</tr><tr><th>Delivery estimate<span>time to production-ready</span></th>${offers.map((offer) => `<td>◷ <strong>${esc(offer.deliveryTime)}</strong></td>`).join("")}</tr>${metricRows}<tr class="composite-row"><th>Composite fit<span>quality · security · compliance</span></th>${offers.map((offer) => `<td><span class="composite-score">${score(offer)}<small>/100</small></span></td>`).join("")}</tr><tr class="select-row"><th>Decision<span>final selection stays with you</span></th>${columns}</tr></tbody></table></div></section>
    <section class="selected-outcome"><span class="selected-outcome-icon">◎</span><div class="selected-outcome-copy"><span>YOUR SELECTION</span><strong>${esc(selectedProvider.name)}</strong><small>${esc(selected.summary)}</small></div><div class="selected-outcome-price"><small>PROPOSAL VALUE</small><strong>${money.format(selected.cost)}</strong></div><button class="button button-dark selection-confirm" data-confirm>${state.confirmed ? "✓ Recommendation saved" : "Approve selection →"}</button></section><p class="local-state-note">▣ Demo decision only. Selection stays on this page and is not sent to a server.</p>${footer("ANALYSIS MODEL 1.4", "HUMAN APPROVAL REQUIRED · STATIC MOCK DATA")}</div>`;
}

function notFound() {
  return `<div class="page-content"><div class="not-found"><span>404 / UNKNOWN SPECIFICATION</span><h1>This brief isn't in the portfolio.</h1><a class="button button-dark" href="#/marketplace">Back to marketplace →</a></div></div>`;
}

function render() {
  const route = location.hash.slice(1) || "/";
  const [section, id] = route.split("/").filter(Boolean);
  let page = overviewPage();
  if (section === "marketplace") page = marketplacePage();
  if (section === "specifications") page = detailPage(id);
  if (section === "compare") page = comparePage(id);
  shell(page, route);
}

function updateMarketRows() {
  const rows = document.querySelector("#market-rows");
  if (rows) rows.innerHTML = marketplaceRows();
}

root.addEventListener("click", (event) => {
  const target = event.target.closest("[data-menu], [data-close-nav], [data-filter], [data-select-bid], [data-confirm], a[href^='#']");
  if (!target) return;
  if (target.matches("[data-menu]")) {
    event.preventDefault();
    state.mobileNavOpen = !state.mobileNavOpen;
    render();
  } else if (target.matches("[data-close-nav]")) {
    state.mobileNavOpen = false;
    render();
  } else if (target.matches("[data-filter]")) {
    state.filter = target.dataset.filter;
    document.querySelectorAll("[data-filter]").forEach((button) => button.classList.toggle("segment-active", button.dataset.filter === state.filter));
    updateMarketRows();
  } else if (target.matches("[data-select-bid]")) {
    state.selectedBidId = target.dataset.selectBid;
    state.confirmed = false;
    render();
  } else if (target.matches("[data-confirm]")) {
    state.confirmed = true;
    render();
  } else {
    state.mobileNavOpen = false;
  }
});

root.addEventListener("input", (event) => {
  if (event.target.matches("#market-search")) {
    state.query = event.target.value;
    updateMarketRows();
  }
});

window.addEventListener("hashchange", render);
render();
