/* User-supplied course-project snapshots. No live data or external requests. */
window.NYC_RENTAL_DATA = (() => {
  const rentSource = { name: 'RentCafe', measure: 'average asking rent', asOf: '2026-08-31', displayDate: 'Aug 31, 2026' };
  const safetySource = { name: 'CrimeGrade.org', asOf: '2025', methodology: '2025 projected', official: false };
  const rent = (value, lowConfidence = false) => ({ value, lowConfidence, source: { ...rentSource } });
  const neighborhood = (id, name, location, min, max, route, rents, grades, notes, cityLevel = false) => ({
    id, name, location, commute: { min, max, route, approximate: true },
    rents: { Studio: rent(rents[0]), '1BR': rent(rents[1]), '2BR': rent(rents[2], id === 'harlem' || id === 'upper-west-side') },
    safety: { overall: grades[0], violent: grades[1], property: grades[2], rate: grades[3], cityLevel, source: { ...safetySource } },
    notes, newJersey: cityLevel
  });
  const neighborhoods = [
    neighborhood('morningside-heights', 'Morningside Heights', 'Manhattan, NY', 5, 15, 'walk or 1 train', [3987, 4202, 5013], ['A-', 'B-', 'A-', 22.02], ['Closest to campus.', 'Older building stock, limited new construction.']),
    neighborhood('upper-west-side', 'Upper West Side', 'Manhattan, NY', 15, 25, '1 train', [3499, 5379, 9055], ['A-', 'B+', 'A-', 22.38], ['Wide range of building types.', 'Direct 1 train to campus.']),
    neighborhood('harlem', 'Harlem', 'Manhattan, NY', 15, 25, 'subway or bus', [2192, 2505, 2399], ['B+', 'D+', 'B+', 26.74], ['Wide range of prices.', 'Several subway and bus options to campus.']),
    neighborhood('washington-heights', 'Washington Heights', 'Manhattan, NY', 25, 35, '1 train', [2100, 3003, 4055], ['A', 'C+', 'A', 21.24], ['Larger units at lower prices than areas closer to campus.', 'Direct 1 train to campus.']),
    neighborhood('astoria', 'Astoria', 'Queens, NY', 45, 60, 'N/W line, transfer needed', [null, 2909, 4458], ['A-', 'B', 'A-', 23.91], ['Queens neighborhood with a large dining scene.', 'Needs a subway transfer to reach campus.']),
    neighborhood('long-island-city', 'Long Island City', 'Queens, NY', 40, 55, '7/E/N/W line, transfer needed', [3729, 4382, 6615], ['B+', 'B-', 'B+', 26.80], ['Newer high-rise buildings near the waterfront.', 'Needs a transfer to reach campus.']),
    neighborhood('jersey-city', 'Jersey City', 'NJ', 45, 65, 'PATH + subway', [2981, 3399, 4627], ['C+', 'B-', 'C+', 25.04], ['Newer buildings with PATH access to Manhattan.', 'New Jersey rules apply.'], true),
    neighborhood('fort-lee', 'Fort Lee', 'NJ', 45, 60, 'bus to GW Bridge Bus Station, then subway', [2768, 2975, 4089], ['C-', 'B-', 'D+', 30.39], ['High-rise buildings near the George Washington Bridge.', 'Commuter bus into Manhattan; New Jersey rules apply.'], true)
  ];
  const listingRows = [
    ['MH-01', 'morningside-heights', 'Studio', 3450, 'Building website', '2026-11-01', 40, true, true, 'A', 'Elevator building, laundry on site.'],
    ['MH-02', 'morningside-heights', '1BR', 4290, 'Listing site', '2026-10-15', 40, true, true, 'B', 'Separate bedroom, close to campus.'],
    ['MH-03', 'morningside-heights', '2BR', 5650, 'Private landlord', '2026-12-01', 'flexible', false, false, 'C', 'Walk-up apartment with a separate living room.'],
    ['UWS-01', 'upper-west-side', 'Studio', 3300, 'Listing site', '2026-11-15', 40, true, true, 'D', 'Compact layout near a subway stop.'],
    ['UWS-02', 'upper-west-side', '1BR', 4750, 'Building website', '2026-10-20', 40, true, true, 'E', 'Elevator building with shared laundry.'],
    ['UWS-03', 'upper-west-side', '1BR', 6600, 'Building website', '2027-01-01', 40, false, true, 'F', 'Separate kitchen and building lobby.'],
    ['HAR-01', 'harlem', 'Studio', 1950, 'Social group', '2026-10-10', 'flexible', false, false, 'G', 'Walk-up studio with an open living area.'],
    ['HAR-02', 'harlem', 'Studio', 2260, 'Listing site', '2026-11-01', 40, true, false, 'H', 'Studio near neighborhood shops.'],
    ['HAR-03', 'harlem', '1BR', 2850, 'Building website', '2026-12-01', 40, true, true, 'I', 'Separate bedroom, laundry on site.'],
    ['WH-01', 'washington-heights', 'Studio', 2015, 'Private landlord', '2026-10-15', 'flexible', false, false, 'J', 'Walk-up studio near a bus route.'],
    ['WH-02', 'washington-heights', '1BR', 3245, 'Listing site', '2026-11-01', 40, true, true, 'K', 'Separate kitchen in an elevator building.'],
    ['WH-03', 'washington-heights', '2BR', 3400, 'Social group', '2026-11-20', 'flexible', false, false, 'L', 'Shared living area and separate bedrooms.'],
    ['AST-01', 'astoria', '1BR', 2600, 'Private landlord', '2026-10-25', 'flexible', false, false, 'M', 'Low-rise building near local shops.'],
    ['AST-02', 'astoria', '1BR', 3425, 'Building website', '2026-11-15', 40, true, true, 'N', 'Elevator building with bike storage.'],
    ['AST-03', 'astoria', '2BR', 4635, 'Listing site', '2026-12-01', 40, true, true, 'O', 'Separate bedrooms and shared laundry.'],
    ['LIC-01', 'long-island-city', 'Studio', 3250, 'Social group', '2026-10-30', 'flexible', false, false, 'P', 'Open-plan studio in an elevator building.'],
    ['LIC-02', 'long-island-city', '1BR', 4600, 'Building website', '2026-11-01', 40, true, true, 'Q', 'High-rise apartment with laundry on site.'],
    ['LIC-03', 'long-island-city', '2BR', 5950, 'Listing site', '2026-12-15', 40, true, false, 'R', 'Separate bedrooms near transit connections.'],
    ['JC-01', 'jersey-city', 'Studio', 2745, 'Building website', '2026-11-01', 40, true, true, 'S', 'Elevator building with PATH access nearby.'],
    ['JC-02', 'jersey-city', '1BR', 3840, 'Building website', '2026-12-01', 40, true, true, 'T', 'Separate bedroom and shared building amenities.'],
    ['JC-03', 'jersey-city', '2BR', 4070, 'Private landlord', '2026-11-10', 'flexible', false, false, 'U', 'Low-rise apartment with a shared living room.'],
    ['FL-01', 'fort-lee', 'Studio', 2350, 'Listing site', '2026-10-20', 40, true, false, 'V', 'Studio near a commuter bus route.'],
    ['FL-02', 'fort-lee', '1BR', 3095, 'Building website', '2026-11-15', 40, true, true, 'W', 'High-rise apartment with laundry on site.'],
    ['FL-03', 'fort-lee', '2BR', 4540, 'Social group', '2026-12-01', 'flexible', false, false, 'X', 'Separate bedrooms in an elevator building.']
  ];
  return {
    neighborhoods,
    // Hand-drawn orientation diagram, not geographic boundary or address data.
    // Marker callouts identify areas only; none of the fictional listings has a location.
    map: {
      width: 960, height: 680, previewLimit: 3,
      source: 'Illustrative area map · Not to scale. Markers represent neighborhoods, not listing addresses.',
      markers: {
        'morningside-heights': { number: 1, x: 455, y: 340 },
        'upper-west-side': { number: 2, x: 455, y: 470 },
        'harlem': { number: 3, x: 665, y: 250 },
        'washington-heights': { number: 4, x: 660, y: 105 },
        'astoria': { number: 5, x: 830, y: 350 },
        'long-island-city': { number: 6, x: 745, y: 520 },
        'jersey-city': { number: 7, x: 230, y: 545 },
        'fort-lee': { number: 8, x: 285, y: 135 }
      },
      artwork: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 680" preserveAspectRatio="none" role="img" aria-label="Illustrative map: New Jersey west of Manhattan, Queens east of Manhattan, and Columbia University marked on upper Manhattan. Not to scale.">
        <defs>
          <pattern id="map-blocks" width="32" height="22" patternUnits="userSpaceOnUse" patternTransform="rotate(-25)"><rect width="32" height="22" fill="#f4f4ef"/><path d="M0 0H32M0 0V22" stroke="#e2e6df" stroke-width="2"/></pattern>
          <pattern id="map-fine-blocks" width="19" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(24)"><rect width="19" height="12" fill="#f8f7f1"/><path d="M0 0H19M0 0V12" stroke="#e2e7df" stroke-width="1.4"/></pattern>
        </defs>
        <rect width="960" height="680" fill="#d9eaf0"/>
        <path d="M0 0H489C472 57 440 101 416 156L388 244 365 333 334 410 307 480 263 589 228 680H0Z" fill="url(#map-blocks)" stroke="#c4d8cf" stroke-width="2"/>
        <path d="M447 618C429 610 425 587 432 565L477 457 537 322 585 221 626 106 664 50 714 16 721 46 682 130 654 232 609 316 587 398 543 490 490 582Z" fill="url(#map-fine-blocks)" stroke="#c4d8cf" stroke-width="2"/>
        <path d="M735 0H960V206L872 224 797 208 729 170 702 141 736 73 751 32Z" fill="url(#map-blocks)" stroke="#c4d8cf" stroke-width="2"/>
        <path d="M960 249L906 238 854 259 823 287 787 307 757 345 713 365 679 411 627 456 586 515 554 578 524 633 530 680H960Z" fill="url(#map-blocks)" stroke="#c4d8cf" stroke-width="2"/>
        <path d="M160 44L231 32 213 190 172 229 133 210Z M52 310L115 284 147 321 111 369 63 365Z" fill="#dce8d4"/>
        <path d="M568 328L589 339 536 451 515 439Z" fill="#cedfbd" stroke="#b6cda8" stroke-width="1.5"/>
        <path d="M636 166L650 135 660 124 648 168 632 200Z M559 293L570 296 538 366 528 362Z M838 288L867 264 907 272 886 307 856 319Z" fill="#d5e3c7"/>
        <path d="M588 627L615 580 661 555 717 561 730 602 689 630Z" fill="#dce8d4"/>
        <g fill="none" stroke="#fff" stroke-width="5" opacity=".9"><path d="M35 578L360 62M18 462L313 21M80 680L333 266M666 628L866 301M762 672L949 388M565 596L935 441M683 510L958 391"/><path d="M442 580L484 484 544 351 598 237 650 104" stroke-width="3.5"/></g>
        <path d="M388 181L625 177M284 565L439 570" fill="none" stroke="#c0d0d5" stroke-width="5"/>
        <path d="M388 181L625 177M284 565L439 570" fill="none" stroke="#f7fbfc" stroke-width="2"/>
        <g fill="#708792" font-family="Arial,Helvetica,sans-serif" font-size="15" letter-spacing="4"><text x="97" y="400" transform="rotate(-65 97 400)">NEW JERSEY</text><text x="493" y="568" transform="rotate(-65 493 568)">MANHATTAN</text><text x="795" y="615">QUEENS</text><text x="802" y="104">BRONX</text></g>
        <g fill="#789ba9" font-family="Arial,Helvetica,sans-serif" font-size="16" font-style="italic" letter-spacing="3"><text x="394" y="403" transform="rotate(-69 394 403)">Hudson River</text><text x="664" y="457" transform="rotate(-49 664 457)">East River</text></g>
        <text x="556" y="405" transform="rotate(-65 556 405)" fill="#708666" font-family="Arial,Helvetica,sans-serif" font-size="12" letter-spacing="1">CENTRAL PARK</text>
        <g fill="none" stroke="#718fa0" stroke-width="1.5" stroke-dasharray="4 4"><path d="M455 340L545 288M455 470L508 427M665 250L616 259M285 135L398 137M230 545L242 552"/></g>
        <g fill="#6b8a9a" stroke="#fff" stroke-width="2"><circle cx="545" cy="288" r="4"/><circle cx="508" cy="427" r="4"/><circle cx="616" cy="259" r="4"/><circle cx="398" cy="137" r="4"/></g>
        <circle cx="557" cy="309" r="37" fill="#376ea1" opacity=".08"/><circle cx="557" cy="309" r="25" fill="#376ea1" opacity=".10"/>
        <circle cx="557" cy="309" r="13" fill="#244f7b" stroke="#fff" stroke-width="3"/><path d="M557 300L559 306 565 306 560 310 562 316 557 312 552 316 554 310 549 306 555 306Z" fill="#fff"/>
      </svg>`
    },
    listings: listingRows.map(([id, neighborhoodId, type, rent, source, available, incomeMultiple, acceptsGuarantorService, requiresUSCredit, letter, description]) => ({ id, neighborhoodId, type, rent, source, available, incomeMultiple, acceptsGuarantorService, requiresUSCredit, title: `Sample Building ${letter}`, description, fictional: true })),
    sources: { rents: rentSource, safety: safetySource },
    unitTypes: ['Studio', '1BR', '2BR'],
    channels: ['Building website', 'Listing site', 'Private landlord', 'Social group'],
    seasonalFactors: { Jan: 0.95, Feb: 0.95, Mar: 0.96, Apr: 0.97, May: 0.98, Jun: 1.00, Jul: 1.01, Aug: 1.00, Sep: 0.99, Oct: 0.97, Nov: 0.96, Dec: 0.95 },
    months: { Jan: 'January', Feb: 'February', Mar: 'March', Apr: 'April', May: 'May', Jun: 'June', Jul: 'July', Aug: 'August', Sep: 'September', Oct: 'October', Nov: 'November', Dec: 'December' },
    thresholds: { below: -0.10, above: 0.10, wellAbove: 0.20 },
    rules: { ownIncomeMultiple: 40, guarantorIncomeMultiple: 80, firstMonthMultiple: 1, depositMultiple: 1, applicationFee: 20, brokerMultiple: 1, guarantorServiceMultiple: 1.0 },
    config: {
      zero: 0, one: 1, hundred: 100, ratePopulation: 1000,
      decimals: { currency: 2, whole: 0, percent: 1, rate: 2, comparison: 10 },
      budget: { min: 0, max: 10000, step: 50, numberStep: 1, initial: 10000 },
      money: { minPositive: 0.01, step: 0.01 },
      scale: { min: -0.40, max: 0.40 },
      defaults: { rent: 3000, ownIncome: 0, guarantorIncome: 0, neighborhoodId: 'morningside-heights', unitType: 'Studio', ssn: 'no', credit: 'none', guarantor: 'no', broker: true },
      quickPicks: [0, 50000, 100000, 150000, 250000]
    },
    documents: [
      { id: 'passport', label: 'Passport and visa', checks: ['passport'] },
      { id: 'student-form', label: 'I-20 or DS-2019', checks: ['student-form'] },
      { id: 'enrollment', label: 'Enrollment or admission letter', checks: ['enrollment'] },
      { id: 'bank', label: 'Bank statements', checks: ['bank'] },
      { id: 'funding', label: 'Scholarship or funding letter', checks: [] },
      { id: 'employment', label: 'Employment offer letter', checks: ['income-proof'] }
    ],
    checklist: {
      common: [ ['passport', 'Passport and visa'], ['student-form', 'I-20 or DS-2019'], ['enrollment', 'Enrollment or admission letter'], ['bank', 'Recent bank statements'], ['application', 'Completed application form'], ['application-fee', 'Application fee'] ],
      A: [ ['income-proof', 'Proof of income (pay stubs, offer letter, or tax return)'] ],
      B: [ ['guarantor-id', "Guarantor’s ID"], ['guarantor-tax', "Guarantor’s recent tax return"], ['guarantor-pay', "Guarantor’s pay stubs or employment letter"], ['guarantor-bank', "Guarantor’s bank statement"], ['guarantor-form', 'Signed guarantor form'] ],
      C: [ ['service-application', 'Guarantor service online application'], ['service-fee', 'Service fee payment'] ]
    },
    text: {
      banner: 'Prototype · Data are snapshots with limits (see sources) · Not legal or financial advice',
      footer: 'Rents: average asking rents from RentCafe, data updated Aug 31, 2026 (averages, not medians). Safety: third-party estimates from CrimeGrade.org (2025 projected), not official statistics. Commute times are approximate. Listings are fictional. † Source data is thin or unusual for this combination.',
      safetyCaveat: 'Not official statistics. Grades describe a whole area; conditions vary by block. Check the specific address with official crime maps.',
      newJersey: 'New Jersey rental rules differ from New York.',
      lowConfidence: 'Low confidence: source data is thin or unusual for this combination.',
      dealFootnote: 'Reference values are average asking rents from one listing source (RentCafe, updated Aug 31, 2026), not medians and not live data.',
      seasonalNote: 'Adjusted for move-in month (illustrative seasonal factor)'
    }
  };
})();
