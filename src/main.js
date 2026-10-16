import { bids } from "./data/bids.js";
import { deployments } from "./data/deployments.js";
import { providers } from "./data/providers.js";
import { qualityGates } from "./data/quality-gates.js";
import { specifications } from "./data/specifications.js";

const root = document.querySelector("#root");
const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const dates = new Intl.DateTimeFormat("en-US", { month: "short", day: "2-digit", year: "numeric", timeZone: "UTC" });
const state = { filter: "All", query: "", selectedBidId: "", selectedSpecificationId: "spec-001", confirmed: false, mobileNavOpen: false };
const esc = (value) => String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
const formatDate = (value) => dates.format(new Date(`${value}T00:00:00Z`));
const bidsFor = (id) => bids.filter((bid) => bid.specificationId === id);
const providerFor = (bid) => providers.find((provider) => provider.id === bid.providerId);
const statusClass = (status) => status.toLowerCase().replace(/ /g, "-");
const iconPaths = {
  grid: '<rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="8" rx="1.5"/><rect x="3" y="13" width="8" height="8" rx="1.5"/><rect x="13" y="13" width="8" height="8" rx="1.5"/>',
  layers: '<path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5M3 16l9 5 9-5"/>',
  file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h8"/>',
  compare: '<path d="M4 7h13l-3-3M20 17H7l3 3"/><path d="M17 4 14 7l3 3M7 14l3 3-3 3"/>',
  chevronDown: '<path d="m6 9 6 6 6-6"/>',
  chevronRight: '<path d="m9 18 6-6-6-6"/>',
  close: '<path d="m18 6-12 12M6 6l12 12"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>',
  activity: '<path d="M3 12h4l3-8 4 16 3-8h4"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  sparkles: '<path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-2-5.8L4 11l6-2.2L12 3Z"/><path d="m19 14 1.2 2.4L23 17l-2.8 1-1.2 2-1.2-2-2.8-1 2.8-.6L19 14Z"/>',
  arrowRight: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  arrowLeft: '<path d="M19 12H5M11 18l-6-6 6-6"/>',
  arrowUpRight: '<path d="M7 17 17 7M7 7h10v10"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  dollar: '<path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
  shield: '<path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z"/><path d="m9 12 2 2 4-4"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  award: '<circle cx="12" cy="8" r="6"/><path d="m8.2 13-1 8 4.8-2 4.8 2-1-8"/><path d="m9.5 8 1.7 1.7L14.8 6"/>',
  more: '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
};
const icon = (name, className = "") => `<svg class="ui-icon ${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${iconPaths[name]}</svg>`;

function statusTag(status) {
  const mark = status === "Bidding" ? "activity" : status === "Under Review" ? "clock" : "check";
  return `<span class="status-tag status-${statusClass(status)}">${icon(mark)} ${esc(status)}</span>`;
}

function footer(left, right) {
  return `<footer class="page-footer"><span>${left}</span><span>${right}</span></footer>`;
}

function shell(page, route) {
  const active = (prefix) => route === prefix || (prefix !== "/" && route.startsWith(prefix));
  const selectedId = state.selectedSpecificationId;
  root.innerHTML = `
    <div class="app-shell">
      <aside class="sidebar ${state.mobileNavOpen ? "sidebar-open" : ""}">
        <a class="brand" href="#/"><img class="brand-mark" src="./logo/rber-logo.jpg" alt=""><span>rber<span class="brand-period">.</span></span></a>
        <div class="workspace-select"><span class="workspace-glyph">R</span><span class="workspace-copy"><strong>Rabobank</strong><small>Product studio</small></span>${icon("chevronDown")}</div>
        <div class="nav-label">WORKSPACE</div>
        <nav class="primary-nav" aria-label="Main navigation">
          <a class="nav-link ${active("/") ? "nav-link-active" : ""}" href="#/">${icon("grid")}<span>Overview</span><span class="nav-key">01</span></a>
          <a class="nav-link ${active("/marketplace") ? "nav-link-active" : ""}" href="#/marketplace">${icon("layers")}<span>Marketplace</span><span class="nav-count">03</span></a>
          <a class="nav-link ${active("/specifications") ? "nav-link-active" : ""}" href="#/specifications/${selectedId}">${icon("file")}<span>Specifications</span></a>
          <a class="nav-link ${active("/compare") ? "nav-link-active" : ""}" href="#/compare/${selectedId}">${icon("compare")}<span>Bid comparison</span><span class="nav-dot"></span></a>
        </nav>
        <div class="sidebar-spacer"></div>
        <div class="sidebar-status"><div class="sidebar-status-top">${icon("activity")} SAMPLE DATA <span class="status-time">STATIC</span></div><div class="sidebar-sparkline" aria-hidden="true">${Array.from({ length: 12 }, () => "<i></i>").join("")}</div><div class="sidebar-status-bottom"><span>4 sample providers</span><span>DEMO</span></div></div>
        <div class="profile-button"><span class="profile-avatar">RA</span><span class="profile-copy"><strong>Richard Abbuhl</strong><small>Demo product owner</small></span>${icon("more")}</div>
      </aside>
      ${state.mobileNavOpen ? '<button class="nav-backdrop" data-close-nav aria-label="Close navigation"></button>' : ""}
      <div class="main-shell"><header class="topbar"><button class="icon-button menu-trigger" data-menu aria-label="Toggle navigation">${icon(state.mobileNavOpen ? "close" : "menu")}</button><div class="breadcrumbs"><span>Rber</span>${icon("chevronRight")}<strong>Outcome exchange</strong></div><div class="topbar-right"><span class="topbar-environment">SAMPLE DATA</span><span class="icon-button notification-button" aria-label="Demo notification status">${icon("bell")}<i></i></span><span class="topbar-avatar">RA</span></div></header><main class="page-main">${page}</main></div>
    </div>`;
}

function metric(label, value, detail, iconName, tone) {
  return `<div class="metric metric-${tone}"><div class="metric-top"><span>${label}</span><span class="metric-icon">${icon(iconName)}</span></div><strong>${value}</strong><small>${detail}</small></div>`;
}

function specificationRow(specification, index) {
  const count = bidsFor(specification.id).length;
  return `<a class="spec-row" href="#/specifications/${specification.id}"><span class="spec-number spec-number-${index}">${String(index + 1).padStart(2, "0")}</span><span class="spec-row-main"><strong>${esc(specification.title)}</strong><small>${esc(specification.complexity)} complexity <i></i> Due ${formatDate(specification.dueDate)}</small></span><span class="spec-row-budget"><strong>${money.format(specification.budget)}</strong><small>${count ? `${count} sample bids` : "No sample bids"}</small></span>${statusTag(specification.status)}<span class="spec-row-chevron">${icon("chevronRight")}</span></a>`;
}

function providerLine(provider, index) {
  const initials = provider.name.split(" ").map((part) => part[0]).slice(0, 2).join("");
  return `<div class="provider-line"><span class="provider-monogram monogram-${index}">${esc(initials)}</span><span class="provider-line-copy"><strong>${esc(provider.name)}</strong><small>${esc(provider.type)} · ${esc(provider.averageDeliveryTime)}</small></span><span class="provider-rating">${icon("sparkles")} ${provider.rating.toFixed(1)} sample rating</span></div>`;
}

function deliverySignal() {
  const deployment = deployments[0];
  const passed = qualityGates.filter((gate) => gate.status === "Passed").length;
  return `<section class="delivery-signal"><div class="delivery-copy"><div class="eyebrow">SAMPLE DEPLOYMENT / STATIC DATA</div><h2>${esc(deployment.implementation)}<span> · </span>${esc(deployment.provider)}</h2><p>Example rollout and reference quality checks. This is not a live deployment.</p></div><div class="environment-flow">${deployment.environments.map((environment) => `<div class="environment-step"><span class="environment-icon ${environment.status.toLowerCase()}">${icon(environment.status === "Running" ? "activity" : "check")}</span><span><strong>${esc(environment.name)}</strong><small>Sample · ${esc(environment.status)}</small></span></div><i class="environment-connector"></i>`).join("").replace(/<i class="environment-connector"><\/i>$/, "")}</div><div class="gate-summary"><span class="gate-summary-icon">${icon("shield")}</span><strong>${String(passed).padStart(2, "0")}</strong><span>sample gates<br>passed</span></div></section>`;
}

function mortgageJourney() {
  const mortgage = specifications.find((specification) => specification.id === "spec-001");
  const mortgageBids = bidsFor(mortgage.id);
  const gateCount = qualityGates.filter((gate) => gate.specificationId === mortgage.id).length;
  const steps = [
    { label: "Specify", detail: `${mortgage.title} · ${mortgage.status}`, iconName: "file", href: `#/specifications/${mortgage.id}` },
    { label: "Compete", detail: `${mortgageBids.length} sample bids`, iconName: "compare", href: `#/compare/${mortgage.id}` },
    { label: "Verify", detail: `${gateCount} separate reference checks`, iconName: "shield", href: `#/specifications/${mortgage.id}` },
    { label: "Select", detail: "Compare trade-offs", iconName: "target", href: `#/compare/${mortgage.id}` },
  ];
  return `<section class="mortgage-journey" aria-labelledby="journey-title"><div class="journey-heading"><div><div class="eyebrow">ONE BRIEF / FOUR STEPS</div><h2 id="journey-title">Mortgage Portal walkthrough</h2><p>Follow one sample specification from intent to an informed choice.</p></div><a class="text-link" href="#/specifications/${mortgage.id}">Open sample brief ${icon("arrowRight")}</a></div><ol class="journey-steps">${steps.map((step, index) => `<li><a href="${step.href}"><span class="journey-number">0${index + 1}</span><span class="journey-icon">${icon(step.iconName)}</span><span class="journey-step-copy"><strong>${step.label}</strong><small>${esc(step.detail)}</small></span>${icon("arrowRight", "journey-arrow")}</a></li>`).join("")}</ol></section>`;
}

function overviewPage() {
  const total = specifications.reduce((sum, specification) => sum + specification.budget, 0);
  const awarded = specifications.filter((specification) => specification.status === "Awarded").length;
  return `<div class="page-content overview-page"><div class="welcome-line"><span>THURSDAY, OCTOBER 16, 2026</span><span class="welcome-divider"></span><span>RABOBANK / PRODUCT STUDIO · SAMPLE DATA</span></div>
    <section class="overview-hero"><div class="hero-copy"><div class="eyebrow">${icon("sparkles")} THE OUTCOME EXCHANGE</div><h1 aria-label="From intent to outcome.">From intent<br><em> to outcome.</em></h1><p>Turn one clear specification into competing implementations, evidence you can inspect, and a decision you can explain.</p><a class="button button-lime" href="#/specifications/spec-001">Follow Mortgage Portal ${icon("arrowRight")}</a><div class="hero-footnote">SAMPLE SPECIFICATIONS <strong>03</strong><span>/</span> SAMPLE PROVIDERS <strong>04</strong></div></div><div class="hero-visual" aria-label="Intent, market, and proof"><div class="orbit"></div><div class="orbit orbit-two"></div><div class="visual-center"><span class="center-mark">R</span><strong>RBER</strong><small>OUTCOME ENGINE</small></div><div class="visual-node node-intent"><span class="node-index">01</span>${icon("file")} INTENT<i></i></div><div class="visual-node node-market"><span class="node-index">02</span>${icon("layers")} MARKET<i></i></div><div class="visual-node node-proof"><span class="node-index">03</span>${icon("shield")} PROOF<i></i></div><div class="visual-caption">SPECIFICATION<br>IS THE SOURCE</div><div class="visual-coordinate">52°05' N<br>05°07' E</div></div><span class="hero-index">01 — 03</span></section>
    ${mortgageJourney()}
    <section class="metric-strip">${metric("Specifications", "03", "Static demo portfolio", "file", "lime")}${metric("Sample bids", String(bids.length).padStart(2, "0"), "Mortgage Portal", "compare", "coral")}${metric("Pipeline value", money.format(total), "Sample specification budgets", "dollar", "aqua")}${metric("Awarded briefs", String(awarded).padStart(2, "0"), "Sample status field", "target", "gold")}</section>
    <section class="overview-lower"><div class="portfolio-panel"><div class="section-heading"><div><div class="eyebrow">SAMPLE PORTFOLIO</div><h2>Specifications in motion</h2></div><a class="text-link" href="#/marketplace">All specifications ${icon("arrowRight")}</a></div><div class="spec-list">${specifications.map(specificationRow).join("")}</div></div><aside class="market-pulse"><div class="pulse-heading"><div><div class="eyebrow">PROVIDER SNAPSHOT</div><h2>Provider network</h2></div><span class="pulse-live">STATIC SAMPLE</span></div><div class="provider-stack">${providers.slice(0, 3).map(providerLine).join("")}</div><a class="provider-footer" href="#/marketplace">VIEW SAMPLE NETWORK ${icon("arrowUpRight")}</a></aside></section>
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
    return `<article class="market-card"><div class="market-card-title"><span class="spec-number spec-number-${index}">${String(index + 1).padStart(2, "0")}</span><div><a href="#/specifications/${specification.id}"><h3>${esc(specification.title)}</h3></a><p>${esc(specification.businessObjective)}</p></div></div><div class="market-cell market-status-cell">${statusTag(specification.status)}</div><div class="market-cell market-budget"><strong>${money.format(specification.budget)}</strong><small>${esc(specification.complexity)} scope</small></div><div class="market-cell market-due">${icon("clock")} ${formatDate(specification.dueDate)}</div><div class="market-card-actions">${count ? `<a class="compare-link" href="#/compare/${specification.id}">${icon("compare")} ${count} sample bids</a>` : ""}<a class="round-link" href="#/specifications/${specification.id}" aria-label="View ${esc(specification.title)}">${icon("arrowRight")}</a></div></article>`;
  }).join("");
}

function providerCard(provider, index) {
  const initials = provider.name.split(" ").map((part) => part[0]).slice(0, 2).join("");
  return `<article class="provider-card"><div class="provider-card-top"><span class="provider-monogram monogram-${index}">${esc(initials)}</span><span class="provider-card-type">${esc(provider.type)} · sample</span><span class="provider-rating">${icon("sparkles")} ${provider.rating.toFixed(1)} sample</span></div><h3>${esc(provider.name)}</h3><p>${esc(provider.tagline)}</p><div class="provider-card-metrics"><span><strong>${provider.averageQualityScore}</strong><small>sample quality</small></span><span><strong>${provider.averageSecurityScore}</strong><small>sample security</small></span><span><strong>${esc(provider.averageDeliveryTime)}</strong><small>sample estimate</small></span></div><div class="strength-list">${provider.strengths.slice(0, 2).map((strength) => `<span>${esc(strength)}</span>`).join("")}</div></article>`;
}

function marketplacePage() {
  const total = specifications.reduce((sum, specification) => sum + specification.budget, 0);
  const filters = ["All", "Bidding", "Under Review", "Awarded"];
  return `<div class="page-content marketplace-page"><div class="page-title-row"><div><div class="eyebrow">SPECIFICATION MARKETPLACE / SAMPLE</div><h1>Find the right outcome.</h1><p>Every brief is an invitation to compete. Review the need, then compare what the sample network could deliver.</p></div><a class="button button-dark" href="#/specifications/spec-001">${icon("plus")} Open a brief</a></div>
    <section class="marketplace-overview-bar"><div class="marketplace-stat"><span class="market-stat-number">03</span><span><strong>Sample briefs</strong><small>Three sample stages</small></span></div><span class="market-divider"></span><div class="marketplace-stat"><span class="market-stat-number">04</span><span><strong>Sample providers</strong><small>Mock provider data</small></span></div><span class="market-divider"></span><div class="marketplace-stat"><span class="market-stat-number">${money.format(total)}</span><span><strong>Sample budget</strong><small>Portfolio mock data</small></span></div><div class="marketplace-bar-mark"><span>R</span><small>SAMPLE DATA<br>NOT LIVE</small></div></section>
    <section class="market-controls"><div class="segmented-control" role="group" aria-label="Filter sample specifications by status">${filters.map((filter) => `<button type="button" data-filter="${filter}" aria-pressed="${state.filter === filter}" class="${state.filter === filter ? "segment-active" : ""}">${filter}<span>${filter === "All" ? specifications.length : specifications.filter((specification) => specification.status === filter).length}</span></button>`).join("")}</div><label class="search-field"><span>${icon("search")}</span><input id="market-search" type="search" aria-label="Search sample specifications" placeholder="Search sample specifications" value="${esc(state.query)}"></label></section>
    <section class="market-list"><div class="market-list-heading"><span>SPECIFICATION / BUSINESS NEED</span><span>STATUS / SAMPLE</span><span>BUDGET</span><span>DELIVERY BY</span><span></span></div><div id="market-rows">${marketplaceRows()}</div></section>
    <section class="provider-network-section"><div class="section-heading"><div><div class="eyebrow">SAMPLE IMPLEMENTATION NETWORK</div><h2>Four ways to build better</h2></div><span class="network-count">04 MOCK PROVIDERS · NOT VERIFIED</span></div><div class="provider-grid">${providers.map(providerCard).join("")}</div></section>${footer("RBER OUTCOME EXCHANGE", "PROVIDER-NEUTRAL · STATIC DEMO DATA")}</div>`;
}

function detailPage(id) {
  const specification = specifications.find((item) => item.id === id);
  if (!specification) return notFound();
  const offers = bidsFor(id);
  const first = offers[0];
  const isAwarded = specification.status === "Awarded";
  const panelStatus = offers.length ? "SAMPLE BID DATA" : isAwarded ? "AWARDED · SAMPLE" : "REVIEW · SAMPLE";
  const panelCount = offers.length ? String(offers.length).padStart(2, "0") : isAwarded ? "01" : "00";
  const panelTitle = offers.length ? `${offers.length === 1 ? "proposal" : "proposals"} received` : isAwarded ? "implementation awarded" : "proposals in review";
  const panelCopy = first ? `Sample bid from ${providerFor(first).name}.` : isAwarded ? "Award status is a static field in the sample specification." : "No sample bid records are attached to this brief.";
  return `<div class="page-content detail-page"><a class="back-link" href="#/marketplace">${icon("arrowLeft")} BACK TO SAMPLE MARKETPLACE</a><div class="detail-heading"><div><div class="eyebrow">SAMPLE SPECIFICATION / ${esc(id.toUpperCase())}</div><h1>${esc(specification.title)}</h1><p>${esc(specification.description)}</p></div>${statusTag(specification.status)}</div>
    <div class="detail-meta-grid"><div class="meta-item meta-wide"><span class="meta-icon">${icon("target")}</span><span><small>Business objective</small><strong>${esc(specification.businessObjective)}</strong></span></div><div class="meta-item"><span class="meta-icon">${icon("dollar")}</span><span><small>Sample budget</small><strong>${money.format(specification.budget)}</strong></span></div><div class="meta-item"><span class="meta-icon">${icon("clock")}</span><span><small>Sample target date</small><strong>${formatDate(specification.dueDate)}</strong></span></div><div class="meta-item"><span class="meta-icon">${icon("activity")}</span><span><small>Sample complexity</small><strong>${esc(specification.complexity)}</strong></span></div></div>
    <div class="detail-columns"><div class="detail-main-column"><section class="detail-section"><div class="section-heading"><div><div class="eyebrow">01 / SCOPE</div><h2>What needs to happen</h2></div><span class="section-count">${String(specification.requirements.length).padStart(2, "0")} SAMPLE REQUIREMENTS</span></div><div class="requirement-list">${specification.requirements.map((requirement, index) => `<div class="requirement-item"><span>${String(index + 1).padStart(2, "0")}</span><strong>${esc(requirement)}</strong>${icon("check")}</div>`).join("")}</div></section>
    <section class="detail-section"><div class="section-heading"><div><div class="eyebrow">02 / SAMPLE QUALITY BAR</div><h2>Constraints & success</h2></div></div><div class="quality-columns"><div><h3>${icon("shield")} Sample guardrails</h3>${specification.nonFunctionalRequirements.map((item) => `<p class="check-line">${icon("check")}${esc(item)}</p>`).join("")}</div><div><h3>${icon("target")} Sample success criteria</h3>${specification.successCriteria.map((item) => `<p class="check-line">${icon("check")}${esc(item)}</p>`).join("")}</div></div></section></div>
    <aside class="detail-side-column"><section class="tech-panel"><div class="eyebrow">SAMPLE DELIVERY CONTEXT</div><h2>Example technology stack</h2><div class="tech-tags">${specification.technologies.map((technology) => `<span>${esc(technology)}</span>`).join("")}</div><div class="tech-panel-rule"></div><div class="context-row"><span>Sample complexity</span><strong>${esc(specification.complexity)}</strong></div><div class="context-row"><span>Sample target date</span><strong>${formatDate(specification.dueDate)}</strong></div></section><section class="proposal-panel"><div class="proposal-panel-heading"><span class="proposal-icon">${icon("sparkles")}</span><span class="proposal-live">${panelStatus}</span></div><strong class="proposal-count">${panelCount}</strong><h2>${panelTitle}</h2><p>${panelCopy}</p>${offers.length ? `<a class="button button-lime button-full" href="#/compare/${id}">Compare sample bids ${icon("arrowRight")}</a>` : ""}</section></aside></div>${footer("SAMPLE SPECIFICATION VERSION 1.0", "STATIC MOCK DATA · NOT OPERATIONAL")}</div>`;
}

const scoreFactors = [
  { label: "Quality", key: "qualityScore", weight: 25 },
  { label: "Security", key: "securityScore", weight: 20 },
  { label: "Compliance", key: "complianceScore", weight: 20 },
  { label: "Performance", key: "performanceScore", weight: 15 },
  { label: "Maintainability", key: "maintainabilityScore", weight: 10 },
  { label: "Confidence", key: "confidenceScore", weight: 10 },
];

function score(bid) {
  return scoreFactors.reduce((total, factor) => total + bid[factor.key] * factor.weight / 100, 0);
}

function scoreLabel(value) {
  return (Math.round((value + Number.EPSILON) * 10) / 10).toFixed(1);
}

function scoreExplanation(bid, specification) {
  const gates = qualityGates.filter((gate) => gate.specificationId === specification.id);
  const passed = gates.filter((gate) => gate.status === "Passed").length;
  const deployment = deployments.find((item) => item.specificationId === specification.id);
  return `<section class="score-explainer"><div class="score-explainer-heading"><div class="eyebrow">RANKING METHOD / STATIC DEMO</div><h2>How the recommendation is scored</h2><p>A weighted average of six score fields in each sample bid. Cost and delivery are shown separately and do not affect this score.</p></div><div class="score-factor-grid">${scoreFactors.map((factor) => `<div class="score-factor"><span>${factor.label}<small>${factor.weight}% weight</small></span><strong>${bid[factor.key]}<small>/100</small></strong><i>${(bid[factor.key] * factor.weight / 100).toFixed(2)} weighted points</i></div>`).join("")}</div><aside class="score-evidence"><div><h3>Input provenance</h3><p>These scores are static provider-submitted demo values, not independently verified measurements.</p></div>${gates.length ? `<div><h3>Separate reference check</h3><p>${deployment ? `${esc(deployment.implementation)} · ${esc(deployment.provider)} · ` : ""}${passed}/${gates.length} sample quality gates passed. This reference run is not tied to the competing bids and is not included in their scores.</p><span>${gates.map((gate) => `${esc(gate.name)}: ${esc(gate.status)}`).join(" · ")}</span></div>` : ""}</aside></section>`;
}

function comparePage(id) {
  const specification = specifications.find((item) => item.id === id);
  if (!specification) return notFound();
  const offers = bidsFor(id).sort((a, b) => score(b) - score(a));
  if (!offers.length) return `<div class="page-content"><div class="empty-comparison"><div class="empty-comparison-mark">${icon("compare")}</div><div class="eyebrow">SAMPLE DECISION ROOM</div><h1>No sample bids to compare.</h1><p>${esc(specification.title)} has a ${statusTag(specification.status)} status in the static data set. No offers are included for this brief.</p><a class="button button-dark" href="#/specifications/${id}">View sample specification ${icon("arrowRight")}</a></div></div>`;
  const recommended = offers[0];
  if (!offers.some((offer) => offer.id === state.selectedBidId)) state.selectedBidId = recommended.id;
  const selected = offers.find((offer) => offer.id === state.selectedBidId);
  const metrics = [["Quality score", "qualityScore"], ["Security", "securityScore"], ["Compliance", "complianceScore"], ["Performance", "performanceScore"], ["Maintainability", "maintainabilityScore"], ["Confidence", "confidenceScore"]];
  const headings = offers.map((offer, index) => { const provider = providerFor(offer); const initials = provider.name.split(" ").map((word) => word[0]).slice(0, 2).join(""); return `<th class="${offer.id === recommended.id ? "bid-best-column" : ""}"><span class="provider-monogram monogram-${index}">${esc(initials)}</span><span class="bid-head-name"><strong>${esc(provider.name)}</strong><small>${esc(provider.type)}</small></span>${offer.id === recommended.id ? '<span class="best-fit-tag">BEST FIT</span>' : ""}</th>`; }).join("");
  const metricRows = metrics.map(([label, key]) => `<tr><th>${label}<span>provider-submitted sample</span></th>${offers.map((offer) => `<td><span class="score-line"><strong>${offer[key]}</strong><small>/100</small><span class="score-track"><i class="${offer[key] >= 96 ? "score-high" : offer[key] < 93 ? "score-watch" : ""}" style="width:${offer[key]}%"></i></span></span></td>`).join("")}</tr>`).join("");
  const columns = offers.map((offer) => `<td><button class="select-bid ${offer.id === selected.id ? "select-bid-active" : ""}" data-select-bid="${offer.id}">${offer.id === selected.id ? `${icon("check")} Selected` : "Select sample bid"}</button></td>`).join("");
  const selectedProvider = providerFor(selected);
  return `<div class="page-content comparison-page"><a class="back-link" href="#/specifications/${id}">${icon("arrowLeft")} BACK TO SAMPLE SPECIFICATION</a><div class="page-title-row"><div><div class="eyebrow">SAMPLE DECISION ROOM / BID ANALYSIS</div><h1>Compare the outcomes.</h1><p>${esc(specification.title)} · ${offers.length} sample bids compared against one brief.</p></div><span class="analysis-stamp">${icon("activity")} STATIC MOCK SCORES</span></div>
    <section class="recommendation-band"><div class="recommendation-copy"><span class="recommendation-kicker">${icon("sparkles")} TOP SAMPLE SCORE</span><h2>${esc(providerFor(recommended).name)}</h2><p>${esc(recommended.summary)}</p><span class="recommendation-score">${scoreLabel(score(recommended))}<small> / 100 weighted sample score</small></span></div><div class="recommendation-stats"><span><small>SAMPLE PRICE</small><strong>${money.format(recommended.cost)}</strong><i>of ${money.format(specification.budget)} sample ceiling</i></span><span><small>SAMPLE DELIVERY</small><strong>${esc(recommended.deliveryTime)}</strong><i>sample target ${formatDate(specification.dueDate)}</i></span><span><small>SAMPLE QUALITY</small><strong>${recommended.qualityScore}<em>/100</em></strong><i>provider-submitted field</i></span></div><div class="recommendation-mark">${icon("award")}<span>TOP<br>SCORE</span></div></section>
    ${scoreExplanation(recommended, specification)}
    <section class="compare-section"><div class="section-heading"><div><div class="eyebrow">02 / SIDE-BY-SIDE</div><h2>${offers.length} sample bids compared</h2></div><span class="compare-metadata">SAMPLE INPUTS · WEIGHTED SCORE · NO LIVE VERIFICATION</span></div><div class="bid-table-wrap"><table class="bid-table"><thead><tr><th>EVALUATION</th>${headings}</tr></thead><tbody><tr class="price-row"><th>Sample cost<span>vs. ${money.format(specification.budget)} sample ceiling</span></th>${offers.map((offer) => `<td><strong>${money.format(offer.cost)}</strong><div class="cost-track"><i style="width:${Math.min(offer.cost / specification.budget * 100, 100)}%"></i></div></td>`).join("")}</tr><tr><th>Sample delivery<span>provider estimate</span></th>${offers.map((offer) => `<td>${icon("clock")} <strong>${esc(offer.deliveryTime)}</strong></td>`).join("")}</tr>${metricRows}<tr class="composite-row"><th>Weighted sample score<span>six provider-submitted factors</span></th>${offers.map((offer) => `<td><span class="composite-score">${scoreLabel(score(offer))}<small>/100</small></span></td>`).join("")}</tr><tr class="select-row"><th>Local demo selection<span>not sent to a service</span></th>${columns}</tr></tbody></table></div></section>
    <section class="selected-outcome"><span class="selected-outcome-icon">${icon("target")}</span><div class="selected-outcome-copy"><span>YOUR LOCAL DEMO SELECTION</span><strong>${esc(selectedProvider.name)}</strong><small>${esc(selected.summary)}</small></div><div class="selected-outcome-price"><small>SAMPLE BID VALUE</small><strong>${money.format(selected.cost)}</strong></div><button class="button button-dark selection-confirm" data-confirm>${state.confirmed ? `${icon("check")} Selection saved locally` : `Select sample bid ${icon("arrowRight")}`}</button></section><p class="local-state-note">${icon("shield")} Demo only. This choice stays in the page and is not saved to a server.</p>${footer("SAMPLE RANKING MODEL 1.0", "STATIC MOCK DATA · NOT OPERATIONAL")}</div>`;
}

function notFound() {
  return `<div class="page-content"><div class="not-found"><span>404 / UNKNOWN SPECIFICATION</span><h1>This brief isn't in the portfolio.</h1><a class="button button-dark" href="#/marketplace">Back to marketplace ${icon("arrowRight")}</a></div></div>`;
}

function render() {
  const route = location.hash.slice(1) || "/";
  const [section, id] = route.split("/").filter(Boolean);
  if ((section === "specifications" || section === "compare") && id) state.selectedSpecificationId = id;
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
    const routeMatch = target.getAttribute("href")?.match(/^#\/(?:specifications|compare)\/([^/?#]+)/);
    if (routeMatch) state.selectedSpecificationId = routeMatch[1];
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
