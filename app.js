/* Vanilla JS, in-memory state only. All numeric settings and domain data are in data.js. */
(() => {
  'use strict';
  const D = window.NYC_RENTAL_DATA;
  const N = D.config;
  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  const escape = value => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
  const money = value => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: N.decimals.whole, maximumFractionDigits: N.decimals.currency }).format(value);
  const percentage = (value, signed = false) => new Intl.NumberFormat('en-US', { style: 'percent', minimumFractionDigits: N.decimals.whole, maximumFractionDigits: N.decimals.percent, signDisplay: signed ? 'exceptZero' : 'auto' }).format(value);
  const date = value => new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(new Date(value));
  const neighborhoods = new Map(D.neighborhoods.map(item => [item.id, item]));
  const state = { neighborhoods: new Set(), types: new Set(), sources: new Set(), budget: N.budget.initial, sort: 'rent', listing: null, checked: new Set(), checklistGroups: [], mapArea: null, mapListing: null };

  function deal(neighborhoodId, unitType, rent, month = '') {
    if (!Number.isFinite(rent) || rent <= N.zero) return { invalid: true };
    const referenceData = neighborhoods.get(neighborhoodId).rents[unitType];
    if (referenceData.value === null) return { missing: true };
    const factor = month ? D.seasonalFactors[month] : N.one;
    const reference = referenceData.value * factor;
    const difference = rent - reference;
    const diff = Number((difference / reference).toFixed(N.decimals.comparison));
    let label, tone;
    if (diff <= D.thresholds.below) { label = 'Below market'; tone = 'below'; }
    else if (diff < D.thresholds.above) { label = 'Around market'; tone = 'around'; }
    else if (diff < D.thresholds.wellAbove) { label = 'Above market'; tone = 'above'; }
    else { label = 'Well above market'; tone = 'well-above'; }
    return { reference, difference, diff, label, tone, lowConfidence: referenceData.lowConfidence, factor };
  }

  function showTab(name, focus = true) {
    $$('[role="tab"]').forEach(tab => {
      const selected = tab.dataset.tab === name;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? N.zero : -N.one;
      $(`#panel-${tab.dataset.tab}`).hidden = !selected;
    });
    if (focus) $(`#tab-${name}`).focus();
  }

  function renderNeighborhoods() {
    $('#neighborhood-grid').innerHTML = D.neighborhoods.map(item => `<button type="button" class="neighborhood-card" data-neighborhood="${item.id}" aria-pressed="false">
      <span class="neighborhood-top"><span><span class="neighborhood-name">${escape(item.name)}</span><span class="location">${escape(item.location)}</span></span><span class="card-check" aria-hidden="true">✓</span></span>
      <span class="commute"><strong>${item.commute.min}–${item.commute.max} min</strong> to Columbia · approx.<span class="route">${escape(item.commute.route)}</span></span>
      <span class="rents-label">AVERAGE ASKING RENT / MONTH</span><span class="rent-grid">${D.unitTypes.map(type => `<span class="rent-cell"><span>${type}</span><strong>${item.rents[type].value === null ? '—' : money(item.rents[type].value)}${item.rents[type].lowConfidence ? '<span class="dagger" title="Source data is thin or unusual">†</span>' : ''}</strong></span>`).join('')}</span>
      <span class="neighborhood-notes">${item.notes.map(note => `<span>${escape(note)}</span>`).join('')}</span>
      <span class="safety"><span class="safety-header"><span>Safety snapshot · Overall</span><span class="grade">${item.safety.overall}</span></span><span class="safety-grades"><span>Violent <strong>${item.safety.violent}</strong></span><span>Property <strong>${item.safety.property}</strong></span></span><span class="rate">${item.safety.rate.toFixed(N.decimals.rate)} crimes per ${N.ratePopulation.toLocaleString('en-US')} residents</span><span class="third-party">Third-party estimate</span>${item.safety.cityLevel ? '<span class="city-level">City-level estimate.</span>' : ''}<span class="safety-caveat">${D.text.safetyCaveat}</span></span>
      ${item.newJersey ? `<span class="nj-note">${D.text.newJersey}</span>` : ''}<span class="selection-hint">Select neighborhood</span></button>`).join('');
    updateNeighborhoodSelection();
  }

  function updateNeighborhoodSelection() {
    $$('[data-neighborhood]').forEach(card => {
      const selected = state.neighborhoods.has(card.dataset.neighborhood);
      card.setAttribute('aria-pressed', String(selected));
      card.querySelector('.selection-hint').textContent = selected ? '✓ Selected · click to remove' : 'Select neighborhood';
    });
    $('#neighborhood-count').textContent = state.neighborhoods.size ? `${state.neighborhoods.size} selected` : `${D.neighborhoods.length} neighborhoods`;
  }

  function matchesListingFilters(listing) {
    return listing.rent <= state.budget && (!state.types.size || state.types.has(listing.type)) && (!state.sources.size || state.sources.has(listing.source));
  }

  function filteredListings() {
    return D.listings.filter(listing => matchesListingFilters(listing) && (!state.neighborhoods.size || state.neighborhoods.has(listing.neighborhoodId)))
      .sort((a, b) => state.sort === 'commute' ? neighborhoods.get(a.neighborhoodId).commute.min - neighborhoods.get(b.neighborhoodId).commute.min || a.rent - b.rent : a.rent - b.rent);
  }

  function initializeMap() {
    $('#map-artwork').innerHTML = D.map.artwork;
    $('#map-source').textContent = D.map.source;
    $('#map-markers').innerHTML = D.neighborhoods.map(area => {
      const point = D.map.markers[area.id];
      return `<button type="button" id="map-pin-${area.id}" class="map-pin" data-map-area="${area.id}" aria-pressed="false" style="left:${point.x / D.map.width * N.hundred}%;top:${point.y / D.map.height * N.hundred}%"><span class="map-pin-number">${point.number}</span><span class="map-pin-name">${area.name}</span><span class="map-pin-price"></span><span class="map-pin-check" aria-hidden="true">✓</span></button>`;
    }).join('');
    $('#map-mobile-legend').innerHTML = D.neighborhoods.map(area => `<button type="button" id="map-legend-${area.id}" class="map-legend-button" data-map-area="${area.id}" aria-pressed="false"><span class="map-legend-number">${D.map.markers[area.id].number}</span><span><strong>${area.name}</strong><span class="map-legend-count"></span></span><span class="map-legend-check" aria-hidden="true">✓</span></button>`).join('');
  }

  function updateMap(listings = filteredListings()) {
    if (state.mapListing && !listings.some(listing => listing.id === state.mapListing)) state.mapListing = null;
    D.neighborhoods.forEach(area => {
      const matches = D.listings.filter(listing => listing.neighborhoodId === area.id && matchesListingFilters(listing));
      const selected = state.neighborhoods.has(area.id);
      const startingRent = matches.length ? money(Math.min(...matches.map(listing => listing.rent))) : null;
      const count = `${matches.length} ${matches.length === N.one ? 'listing' : 'listings'}`;
      const name = `${area.name}: ${count}${startingRent ? `, from ${startingRent}` : ', no matches'}. ${selected ? 'Remove' : 'Select'} area filter.`;
      const pin = $(`#map-pin-${area.id}`);
      const legend = $(`#map-legend-${area.id}`);
      [pin, legend].forEach(control => { control.setAttribute('aria-pressed', String(selected)); control.setAttribute('aria-label', name); control.setAttribute('data-focused', String(state.mapArea === area.id)); control.setAttribute('data-empty', String(!matches.length)); });
      pin.querySelector('.map-pin-price').textContent = startingRent ? `From ${startingRent} · ${matches.length}` : 'No matches';
      legend.querySelector('.map-legend-count').textContent = startingRent ? `${count} · ${startingRent}+` : 'No matching listings';
    });
    const area = state.mapArea ? neighborhoods.get(state.mapArea) : null;
    const matches = area ? listings.filter(listing => listing.neighborhoodId === area.id) : listings;
    const preview = matches.slice(N.zero, D.map.previewLimit);
    $('#map-detail-content').innerHTML = `<p class="eyebrow">${area ? 'EXPLORE THE AREA' : 'MAKE YOURSELF AT HOME'}</p><h4 id="map-detail-title">${area ? area.name : 'A little closer to your next home.'}</h4><p class="map-detail-intro">${area ? `${area.location} · ${area.commute.min}–${area.commute.max} min to campus, approx.` : 'Find your bearings around Columbia. Select areas on the map to narrow your search.'}</p>${area ? `<p class="map-route">${area.commute.route}</p>${area.newJersey ? `<p class="map-nj-note">${D.text.newJersey}</p>` : ''}` : '<p class="map-multiple-hint">You can select more than one area.</p>'}<div class="map-results-label"><strong>${matches.length} ${matches.length === N.one ? 'matching listing' : 'matching listings'}</strong><span>${area ? 'In this area' : 'Across all selected areas'}</span></div><div class="map-listing-previews">${preview.length ? preview.map(listing => `<button type="button" class="map-listing-preview" data-map-listing="${listing.id}" aria-label="View listing: ${listing.title}, ${money(listing.rent)} per month" ${state.mapListing === listing.id ? 'aria-current="true"' : ''}><span><strong>${listing.title}</strong><span>${listing.type} · ${listing.id}${state.mapListing === listing.id ? ' · Selected' : ''}</span></span><span class="map-preview-price">${money(listing.rent)}<small>/ month</small></span></button>`).join('') : '<p class="map-no-matches">No listings match here. Try a higher budget or another area.</p>'}</div><button type="button" id="map-view-listings" class="button primary map-view-listings">See results below (${listings.length})</button><p class="map-detail-note">Prices and counts follow your budget, unit type, and source filters. All listings are fictional.</p>`;
    $('#clear-map-selection').hidden = !state.neighborhoods.size;
    highlightListing();
  }

  function toggleArea(id) {
    if (!neighborhoods.has(id)) return;
    const wasSelected = state.neighborhoods.has(id);
    wasSelected ? state.neighborhoods.delete(id) : state.neighborhoods.add(id);
    state.mapArea = wasSelected ? [...state.neighborhoods].at(-N.one) || null : id;
    state.mapListing = null;
    updateNeighborhoodSelection(); renderListings();
    $('#map-announcement').textContent = `${neighborhoods.get(id).name} ${wasSelected ? 'removed' : 'selected'}. ${filteredListings().length} listings match your filters.`;
  }

  function highlightListing() {
    $$('.listing-card').forEach(card => card.setAttribute('data-highlighted', String(card.dataset.listingId === state.mapListing)));
  }

  function showListingOnMap(id) {
    const listing = filteredListings().find(item => item.id === id);
    if (!listing) return;
    state.mapArea = listing.neighborhoodId; state.mapListing = id;
    updateMap();
    $('#map-heading').focus({ preventScroll: true });
    $('.map-section').scrollIntoView({ block: 'start' });
    $('#map-announcement').textContent = `${listing.title} highlighted in ${neighborhoods.get(listing.neighborhoodId).name}. The marker shows the area, not a property address.`;
  }

  function jumpToListing(id) {
    const listing = filteredListings().find(item => item.id === id);
    if (!listing) return;
    state.mapListing = id; state.mapArea = listing.neighborhoodId;
    updateMap();
    const card = $(`[data-listing-id="${id}"]`);
    card.focus({ preventScroll: true }); card.scrollIntoView({ block: 'center' });
  }

  function renderListings() {
    const listings = filteredListings();
    $('#result-count').textContent = `${listings.length} ${listings.length === N.one ? 'listing' : 'listings'}`;
    $('#empty-state').hidden = listings.length > N.zero;
    $('#listing-grid').innerHTML = listings.map(listing => {
      const area = neighborhoods.get(listing.neighborhoodId);
      const assessment = deal(listing.neighborhoodId, listing.type, listing.rent);
      return `<article class="surface listing-card" data-listing-id="${listing.id}" tabindex="-1"><div class="listing-card-top"><span class="pill neutral">${listing.source}</span><span class="listing-id">${listing.id}</span></div><h4>${listing.title}</h4><p class="listing-location">${area.name} · ${listing.type}</p><button type="button" class="listing-map-link" data-action="map" data-id="${listing.id}" aria-label="Show ${listing.title} area on map"><span aria-hidden="true">⌖</span> Show on map</button><p class="listing-price">${money(listing.rent)} <small>/ month</small></p>${assessment.missing ? '<span class="small-meta">No reference data</span>' : `<span class="pill deal-label ${assessment.tone}">${assessment.label}${assessment.lowConfidence ? ' †' : ''}</span>`}<div class="listing-detail"><span>${area.commute.min}–${area.commute.max} min · approx.</span><span>Available ${date(listing.available)}</span></div><p class="listing-description">${listing.description}</p><p class="requirements">${listing.incomeMultiple === 'flexible' ? 'Flexible income requirement' : `Income ${listing.incomeMultiple}× rent`} · ${listing.acceptsGuarantorService ? 'Guarantor service accepted' : 'Guarantor service not accepted'} · ${listing.requiresUSCredit ? 'US credit history required' : 'US credit history not required'}</p><div class="listing-actions"><button class="button secondary" type="button" data-action="deal" data-id="${listing.id}" aria-label="Check this deal: ${listing.title}">Check this deal</button><button class="button primary" type="button" data-action="apply" data-id="${listing.id}" aria-label="Can I apply? ${listing.title}">Can I apply?</button></div></article>`;
    }).join('');
    updateMap(listings);
  }

  function clearFilters() {
    state.neighborhoods.clear(); state.types.clear(); state.sources.clear();
    state.mapArea = null; state.mapListing = null;
    state.budget = N.budget.initial; state.sort = 'rent';
    $('#budget-range').value = N.budget.initial; $('#budget-number').value = N.budget.initial;
    $('#sort-select').value = 'rent';
    $$('#unit-filters input, #source-filters input').forEach(input => { input.checked = false; });
    $('#budget-error').hidden = true; $('#budget-number').setAttribute('aria-invalid', 'false');
    updateNeighborhoodSelection(); renderListings();
  }

  function validateMoney(selector, errorSelector, allowZero = false) {
    const input = $(selector);
    const value = input.value.trim() === '' ? NaN : Number(input.value);
    const valid = Number.isFinite(value) && (allowZero ? value >= N.zero : value > N.zero);
    input.setAttribute('aria-invalid', String(!valid));
    const error = $(errorSelector);
    error.hidden = valid;
    error.textContent = allowZero ? `Enter an annual income of ${money(N.zero)} or more.` : `Enter a monthly rent greater than ${money(N.zero)}.`;
    return valid ? value : null;
  }

  function renderDeal() {
    const rent = validateMoney('#deal-rent', '#deal-error');
    const result = $('#deal-result');
    if (rent === null) { result.innerHTML = '<div class="validation-state"><h3>Add a valid monthly rent</h3><p>Your comparison will appear here.</p></div>'; return; }
    const month = $('#deal-month').value;
    const area = neighborhoods.get($('#deal-neighborhood').value);
    const type = $('#deal-type').value;
    const value = deal(area.id, type, rent, month);
    if (value.missing) { result.innerHTML = `<p class="eyebrow">${area.name} · ${type}</p><h3 class="result-title">No reference data for this combination.</h3><p class="result-explanation">Your rent is ${money(rent)} per month. Try another unit type or neighborhood to see a comparison.</p>`; return; }
    const sentence = value.diff === N.zero ? 'This rent matches the reference average asking rent.' : `This rent is about ${percentage(Math.abs(value.diff))} ${value.diff < N.zero ? 'below' : 'above'} the reference average asking rent.`;
    const position = (Math.min(N.scale.max, Math.max(N.scale.min, value.diff)) - N.scale.min) / (N.scale.max - N.scale.min) * N.hundred;
    const boundaries = [N.scale.min, D.thresholds.below, D.thresholds.above, D.thresholds.wellAbove, N.scale.max];
    const bands = boundaries.slice(N.one).map((boundary, index) => `<span class="scale-band" style="width:${(boundary - boundaries[index]) / (N.scale.max - N.scale.min) * N.hundred}%"></span>`).join('');
    result.innerHTML = `<p class="eyebrow">${area.name} · ${type}</p><span class="pill deal-label ${value.tone}">${value.label}</span><h3 class="result-title">${value.diff === N.zero ? 'Right at the reference.' : `${percentage(Math.abs(value.diff))} ${value.diff < N.zero ? 'below' : 'above'} the reference.`}</h3><p class="result-explanation">${sentence}</p><div class="metrics"><div class="metric"><span class="metric-label">${month ? 'Adjusted reference' : 'Reference average'}</span><strong class="metric-value" id="reference-value">${money(value.reference)}</strong><span class="metric-detail">${D.sources.rents.name} · ${D.sources.rents.displayDate}</span></div><div class="metric"><span class="metric-label">Your monthly rent</span><strong class="metric-value">${money(rent)}</strong><span class="metric-detail">${type} · Whole unit</span></div><div class="metric"><span class="metric-label">Difference</span><strong class="metric-value" id="difference-value">${value.difference > N.zero ? '+' : ''}${money(value.difference)}</strong><span class="metric-detail">${percentage(value.diff, true)} from reference</span></div></div><div class="deal-scale" aria-label="Rent relative to the reference"><p class="helper">Where your rent falls</p><div class="scale-track" aria-hidden="true">${bands}<span class="scale-marker" style="left:${position}%"><span class="scale-caption" style="${position === N.zero ? 'left:0;transform:none' : position === N.hundred ? 'left:auto;right:0;transform:none' : ''}">Your rent</span></span></div><div class="scale-labels"><span>Below market</span><span>Around market</span><span>Above market</span><span>Well above</span></div></div>${month ? `<p class="result-note">${D.text.seasonalNote} · ${D.months[month]} × ${value.factor.toFixed(N.decimals.currency)}. This factor is an assumption, not sourced data.</p>` : ''}${value.lowConfidence ? `<p class="result-note warning-note">${D.text.lowConfidence}</p>` : ''}`;
  }

  function application(answers) {
    const ownRequired = answers.rent * D.rules.ownIncomeMultiple;
    const guarantorRequired = answers.rent * D.rules.guarantorIncomeMultiple;
    const baseItems = [ ['First month rent', answers.rent * D.rules.firstMonthMultiple], ['Security deposit', answers.rent * D.rules.depositMultiple], ['Broker fee', answers.broker ? answers.rent * D.rules.brokerMultiple : N.zero], ['Application fee', D.rules.applicationFee] ];
    const ownReasons = [];
    if (answers.ownIncome < ownRequired) ownReasons.push(`Needs ${money(ownRequired)} annual income; you entered ${money(answers.ownIncome)}. Income gap: ${money(ownRequired - answers.ownIncome)}.`);
    if (answers.credit === 'none') ownReasons.push('Needs some US credit history; you selected None.');
    const paths = [
      { id: 'A', title: 'Apply on your own', eligible: answers.ownIncome >= ownRequired && answers.credit !== 'none', reason: ownReasons.length ? ownReasons.join(' ') : `Your income meets ${money(ownRequired)}, and you have US credit history.`, items: baseItems },
      { id: 'B', title: 'Use a US-based personal guarantor', eligible: answers.guarantor && answers.guarantorIncome >= guarantorRequired, reason: !answers.guarantor ? `No US-based guarantor selected. This path needs a guarantor earning ${money(guarantorRequired)} annually.` : answers.guarantorIncome < guarantorRequired ? `Needs ${money(guarantorRequired)} annual income; guarantor has ${money(answers.guarantorIncome)}. Income gap: ${money(guarantorRequired - answers.guarantorIncome)}.` : `Your guarantor’s income meets the ${money(guarantorRequired)} annual requirement.`, items: baseItems },
      { id: 'C', title: 'Use a third-party guarantor service', eligible: true, reason: 'Eligible under a sample assumption. Acceptance varies by building. Ask before you apply.', items: [...baseItems, ['Guarantor service fee', answers.rent * D.rules.guarantorServiceMultiple]] }
    ];
    paths.forEach(path => { path.total = path.items.reduce((total, [, cost]) => total + cost, N.zero); });
    return { paths, ownRequired, guarantorRequired, lowest: Math.min(...paths.filter(path => path.eligible).map(path => path.total)) };
  }

  function renderApplication() {
    const rent = validateMoney('#apply-rent', '#apply-rent-error');
    const ownIncome = validateMoney('#own-income', '#own-income-error', true);
    const hasGuarantor = $('input[name="guarantor"]:checked').value === 'yes';
    $('#guarantor-income-field').hidden = !hasGuarantor;
    const guarantorIncome = hasGuarantor ? validateMoney('#guarantor-income', '#guarantor-income-error', true) : N.zero;
    const valid = rent !== null && ownIncome !== null && guarantorIncome !== null;
    $('#checklist-section').hidden = !valid;
    $('#apply-estimate-notes').hidden = !valid;
    if (!valid) { $('#income-requirement').textContent = ''; $('#apply-results').innerHTML = '<div class="surface validation-state"><h3>Check your money amounts</h3><p>Enter a positive monthly rent and an annual income of zero or more to see your sample paths.</p></div>'; return; }
    const result = application({ rent, ownIncome, guarantorIncome, guarantor: hasGuarantor, credit: $('input[name="credit"]:checked').value, broker: $('#broker-toggle').checked });
    $('#income-requirement').textContent = `Annual income needed: ${money(result.ownRequired)} for you (${D.rules.ownIncomeMultiple}× rent), or ${money(result.guarantorRequired)} for a guarantor (${D.rules.guarantorIncomeMultiple}× rent).`;
    $('#apply-results').innerHTML = result.paths.map(path => `<article class="surface path-card ${path.eligible && path.total === result.lowest ? 'lowest' : ''}" data-path="${path.id}"><div class="path-header"><span class="path-letter">${path.id}</span><span class="pill ${path.eligible ? 'eligible-badge' : 'ineligible-badge'}">${path.eligible ? '✓ Eligible' : '– Not eligible'}</span></div><h4>${path.title}</h4><p class="path-reason">${path.reason}</p>${path.id === 'C' && state.listing && !state.listing.acceptsGuarantorService ? '<p class="result-note warning-note">This listing does not accept guarantor services (sample data).</p>' : ''}${path.eligible ? `${path.total === result.lowest ? '<p class="lowest-label">Lowest-cost option</p>' : `<p class="extra-cost">${money(path.total - result.lowest)} more than the lowest-cost option</p>`}<p class="cost-total">${money(path.total)}</p><p class="cost-caption">Estimated upfront cost</p><dl class="cost-breakdown">${path.items.map(([label, cost]) => `<div><dt>${label}</dt><dd>${money(cost)}</dd></div>`).join('')}</dl>` : ''}</article>`).join('') + '<article class="surface path-card" data-path="D"><div class="path-header"><span class="path-letter">D</span><span class="pill info-badge">Information</span></div><h4>Ask about alternatives</h4><p class="path-reason">Some buildings may accept other proof of funds or extra prepayment. Rules vary by building and by law. Ask, and check current rules.</p></article>';
    state.checklistGroups = [{ key: 'common', label: 'Common documents & steps', items: D.checklist.common }, ...result.paths.filter(path => path.eligible).map(path => ({ key: path.id, label: `Path ${path.id} · ${path.title}`, items: D.checklist[path.id] }))];
    renderChecklist();
  }

  function renderChecklist() {
    $('#checklist').innerHTML = state.checklistGroups.map(group => `<div class="checklist-group"><h4>${group.label}</h4>${group.items.map(([id, label]) => `<label class="check-label"><input type="checkbox" data-check="${id}" ${state.checked.has(id) ? 'checked' : ''}><span>${escape(label)}</span></label>`).join('')}</div>`).join('');
    $('#copy-status').textContent = ''; $('#copy-fallback').hidden = true;
  }

  function syncCredit() {
    const noSSN = $('input[name="ssn"]:checked').value === 'no';
    if (noSSN) $('input[name="credit"][value="none"]').checked = true;
    $('#credit-field').disabled = noSSN;
  }

  async function copyChecklist() {
    const content = ['NYC Rental Navigator — Preparation checklist', ...state.checklistGroups.flatMap(group => ['', group.label, ...group.items.map(([id, label]) => `${state.checked.has(id) ? '[x]' : '[ ]'} ${label}`)])].join('\n');
    let copied = false;
    if (navigator.clipboard && window.isSecureContext) {
      try { await navigator.clipboard.writeText(content); copied = true; } catch { /* file:// may not grant clipboard permission; use local fallback below. */ }
    }
    if (!copied) {
      const text = $('#copy-fallback');
      text.value = content; text.hidden = false; text.focus(); text.select();
      try { copied = document.execCommand('copy'); } catch { copied = false; }
      if (copied) { text.hidden = true; $('#copy-checklist').focus(); }
    }
    $('#copy-status').textContent = copied ? 'Checklist copied.' : 'Automatic copying is unavailable in this browser. The checklist text is selected below; use your usual copy shortcut.';
  }

  function initialize() {
    $('#prototype-copy').innerHTML = escape(D.text.banner).replace('see sources', '<a href="#sources">see sources</a>');
    $('#source-copy').textContent = D.text.footer;
    $('#deal-footnote').textContent = D.text.dealFootnote;
    $('#budget-min').textContent = money(N.budget.min); $('#budget-max').textContent = money(N.budget.max);
    ['#budget-range', '#budget-number'].forEach(selector => { const input = $(selector); input.min = N.budget.min; input.max = N.budget.max; input.step = selector === '#budget-range' ? N.budget.step : N.budget.numberStep; input.value = N.budget.initial; });
    $('#unit-filters').innerHTML = D.unitTypes.map(type => `<label class="choice"><input type="checkbox" value="${type}"><span>${type}</span></label>`).join('');
    $('#source-filters').innerHTML = D.channels.map(channel => `<label class="check-label"><input type="checkbox" value="${channel}"><span>${channel}</span></label>`).join('');
    $('#deal-neighborhood').innerHTML = D.neighborhoods.map(area => `<option value="${area.id}">${area.name}</option>`).join('');
    $('#deal-type').innerHTML = D.unitTypes.map(type => `<option>${type}</option>`).join('');
    $('#deal-month').insertAdjacentHTML('beforeend', Object.entries(D.months).map(([key, label]) => `<option value="${key}">${label}</option>`).join(''));
    $('#deal-neighborhood').value = N.defaults.neighborhoodId; $('#deal-type').value = N.defaults.unitType;
    ['#deal-rent', '#apply-rent'].forEach(selector => { $(selector).min = N.money.minPositive; $(selector).step = N.money.step; $(selector).value = N.defaults.rent; });
    ['#own-income', '#guarantor-income'].forEach(selector => { $(selector).min = N.zero; $(selector).step = N.money.step; $(selector).value = selector === '#own-income' ? N.defaults.ownIncome : N.defaults.guarantorIncome; });
    ['ssn', 'credit', 'guarantor'].forEach(name => { $(`input[name="${name}"][value="${N.defaults[name]}"]`).checked = true; });
    $('#broker-toggle').checked = N.defaults.broker;
    $('#document-options').innerHTML = D.documents.map(doc => `<label class="check-label"><input type="checkbox" data-document="${doc.id}"><span>${doc.label}</span></label>`).join('');
    ['own', 'guarantor'].forEach(kind => { $(`#${kind}-quick-picks`).innerHTML = N.quickPicks.map(amount => `<button type="button" data-income-target="${kind}-income" data-amount="${amount}">${money(amount)}</button>`).join(''); });
    initializeMap(); renderNeighborhoods(); renderListings(); renderDeal(); syncCredit(); renderApplication();

    $$('[role="tab"]').forEach(tab => {
      tab.addEventListener('click', () => showTab(tab.dataset.tab));
      tab.addEventListener('keydown', event => {
        const tabs = $$('[role="tab"]'); let next = tabs.indexOf(tab);
        if (event.key === 'ArrowRight') next = (next + N.one) % tabs.length;
        else if (event.key === 'ArrowLeft') next = (next - N.one + tabs.length) % tabs.length;
        else if (event.key === 'Home') next = N.zero;
        else if (event.key === 'End') next = tabs.length - N.one;
        else return;
        event.preventDefault(); showTab(tabs[next].dataset.tab);
      });
    });
    $('#neighborhood-grid').addEventListener('click', event => { const card = event.target.closest('[data-neighborhood]'); if (card) toggleArea(card.dataset.neighborhood); });
    ['#map-markers', '#map-mobile-legend'].forEach(selector => $(selector).addEventListener('click', event => { const button = event.target.closest('[data-map-area]'); if (button) toggleArea(button.dataset.mapArea); }));
    $('#clear-map-selection').addEventListener('click', () => { state.neighborhoods.clear(); state.mapArea = null; state.mapListing = null; updateNeighborhoodSelection(); renderListings(); $('#map-heading').focus({ preventScroll: true }); });
    $('#map-detail-content').addEventListener('click', event => {
      const listing = event.target.closest('[data-map-listing]');
      if (listing) { jumpToListing(listing.dataset.mapListing); return; }
      if (event.target.closest('#map-view-listings')) { $('#listings-heading').focus({ preventScroll: true }); $('#listings-heading').scrollIntoView({ block: 'start' }); }
    });
    [['#unit-filters', state.types], ['#source-filters', state.sources]].forEach(([selector, set]) => { $(selector).addEventListener('change', event => { event.target.checked ? set.add(event.target.value) : set.delete(event.target.value); renderListings(); }); });
    $('#sort-select').addEventListener('change', event => { state.sort = event.target.value; renderListings(); });
    ['#budget-range', '#budget-number'].forEach(selector => $(selector).addEventListener('input', event => {
      const value = event.target.value === '' ? NaN : Number(event.target.value);
      const valid = Number.isFinite(value) && value >= N.budget.min && value <= N.budget.max;
      $('#budget-error').hidden = valid; $('#budget-number').setAttribute('aria-invalid', String(!valid));
      if (!valid) { $('#budget-error').textContent = `Enter a budget from ${money(N.budget.min)} to ${money(N.budget.max)}. Showing the last valid budget.`; return; }
      state.budget = value; $('#budget-number').value = value; $('#budget-range').value = value; renderListings();
    }));
    $('#clear-filters').addEventListener('click', clearFilters);
    $('#empty-clear').addEventListener('click', () => { clearFilters(); $('#clear-filters').focus(); });
    $('#listing-grid').addEventListener('click', event => {
      const button = event.target.closest('[data-action]'); if (!button) return;
      const listing = D.listings.find(item => item.id === button.dataset.id);
      if (button.dataset.action === 'map') { showListingOnMap(listing.id); return; }
      if (button.dataset.action === 'deal') { $('#deal-neighborhood').value = listing.neighborhoodId; $('#deal-type').value = listing.type; $('#deal-rent').value = listing.rent; $('#deal-month').value = ''; renderDeal(); showTab('deal'); }
      else { state.listing = listing; $('#apply-rent').value = listing.rent; $('#listing-context').hidden = false; $('#listing-context').textContent = `${listing.title} · ${neighborhoods.get(listing.neighborhoodId).name} · ${listing.id}. Calculations use the sample application rules below.`; renderApplication(); showTab('apply'); }
      $('.tab-nav').scrollIntoView({ block: 'start' });
    });
    $('#deal-form').addEventListener('input', renderDeal);
    $('#deal-form').addEventListener('change', renderDeal);
    $('#deal-form').addEventListener('submit', event => { event.preventDefault(); renderDeal(); });
    $('#apply-form').addEventListener('submit', event => { event.preventDefault(); renderApplication(); });
    $('#apply-form').addEventListener('input', event => { if (event.target.type === 'number') renderApplication(); });
    $('#apply-form').addEventListener('change', event => {
      if (event.target.name === 'ssn') syncCredit();
      if (event.target.dataset.document) { const doc = D.documents.find(item => item.id === event.target.dataset.document); doc.checks.forEach(id => event.target.checked ? state.checked.add(id) : state.checked.delete(id)); }
      renderApplication();
    });
    $('#apply-form').addEventListener('click', event => { const button = event.target.closest('[data-income-target]'); if (!button) return; $(`#${button.dataset.incomeTarget}`).value = button.dataset.amount; renderApplication(); });
    $('#checklist').addEventListener('change', event => { if (!event.target.dataset.check) return; event.target.checked ? state.checked.add(event.target.dataset.check) : state.checked.delete(event.target.dataset.check); $('#copy-status').textContent = ''; $('#copy-fallback').hidden = true; });
    $('#copy-checklist').addEventListener('click', copyChecklist);
  }
  initialize();
})();
