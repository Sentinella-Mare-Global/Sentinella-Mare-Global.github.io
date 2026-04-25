# PRD: Full Multi-Language Translation for Sentinella Mare Website

## Problem

Language tabs (EN / IT / AR) exist at the top of the site but only ~51 of ~200 visible text elements currently switch when a user clicks a tab. The rest of the page stays in English. Users clicking IT or AR expect the entire page to translate.

## Goal

When a user clicks a language tab, **every visible text element** on the page translates into the selected language. EN is the default. The selection persists across page reloads. Arabic activates right-to-left layout.

## Current State

- **Infrastructure exists:** A fixed language bar with EN / IT / AR buttons, a `setLang()` JS function, a translations object with en/it/ar keys, `data-i18n` attributes on elements, RTL CSS rules for Arabic.
- **What works:** Nav links, hero section, section headings/labels, section lead paragraphs, service card titles/descriptions/CTAs, why card titles, pricing tier names, advisory heading, clients heading, CTA banner text, footer brand + HQ line.
- **What doesn't translate yet:** Everything listed below.

## Untranslated Content Inventory

### 1. Live Status Bar (5 items)
| Key | English Text |
|-----|-------------|
| `live.feed` | LIVE FEED ACTIVE |
| `live.vessels` | VESSELS TRACKED |
| `live.threat` | THREAT ZONE: STRAIT OF SICILY — |
| `live.alert` | ACTIVE ALERT: WESTERN MED CORRIDOR |
| `live.ais` | AIS COVERAGE |

### 2. Service 1 Feature List (7 items)
| Key | English Text |
|-----|-------------|
| `s1.f1` | Real-time vessel tracking with AIS cross-referencing across 1,200+ routes |
| `s1.f2` | Geopolitical threat scoring per corridor — Strait of Gibraltar to Suez |
| `s1.f3` | Cross-domain alert engine: cyber, military, weather, port disruption |
| `s1.f4` | Automated early-warning triggers with priority notification |
| `s1.f5` | Energy corridor & fiber-optic cable vulnerability monitoring |
| `s1.f6` | Decision-support analytics tailored to operator routing needs |
| `s1.f7` | Tiered access: Sentinel, Guardian, and Command tiers |

### 3. Service 2 Feature List (7 items)
| Key | English Text |
|-----|-------------|
| `s2.f1` | Port infrastructure and regional investment due diligence |
| `s2.f2` | Supply chain stress-testing across Mediterranean chokepoints |
| `s2.f3` | Geopolitical scenario modeling for asset exposure analysis |
| `s2.f4` | Marine insurance risk profiling and underwriting support |
| `s2.f5` | Bespoke threat briefings for executive leadership |
| `s2.f6` | Regulatory and sanctions landscape advisory |
| `s2.f7` | Retainer or project-based engagement structures |

### 4. Platform Mockup Section (~25 items)
| Key | English Text |
|-----|-------------|
| `plat.h2` | The Mediterranean Watch Command Interface |
| `plat.lead` | Our subscriber dashboard delivers continuous situational awareness... |
| `plat.chrome.title` | // SENTINELLA MARE · LIVE OPERATIONS |
| `plat.chrome.status` | ALL SYSTEMS NOMINAL |
| `plat.threat.title` | // Active Threat Signals |
| `plat.threat.1` | Naval activity surge detected |
| `plat.threat.1z` | W. MED · CONFIDENCE 87% |
| `plat.threat.2` | Port congestion — delay risk |
| `plat.threat.2z` | ALGIERS · CONFIDENCE 73% |
| `plat.threat.3` | Cyber probe on AIS network |
| `plat.threat.3z` | ADRIATIC · CONFIDENCE 68% |
| `plat.threat.4` | Weather routing advisory |
| `plat.threat.4z` | TYRRHENIAN · CONFIDENCE 94% |
| `plat.metrics.title` | // Basin Metrics |
| `plat.metrics.vessels` | Vessels Live |
| `plat.metrics.alerts` | Active Alerts |
| `plat.metrics.risk` | W.Med Risk |
| `plat.metrics.ais` | AIS Coverage |
| `plat.bottom.feeds` | FEEDS: AIS · SIGINT · OSINT · SOCIAL · CYBER · NAVAL |
| `plat.bottom.latency` | DATA LATENCY: <90s |
| `plat.bottom.coverage` | COVERAGE: 36 NATION-STATES |
| `plat.map.alert` | ACTIVE THREAT · WEST MED CORRIDOR |
| `plat.map.gibraltar` | STRAIT OF GIBRALTAR |
| `plat.map.africa` | N. AFRICA CORRIDOR |
| `plat.map.eastern` | EASTERN MED |
| `plat.map.sicily` | STRAIT OF SICILY |

### 5. Why Sentinella Card Body Text (6 items)
| Key | English Text |
|-----|-------------|
| `why.c1.text` | Our AI engine synthesizes cross-domain signals... |
| `why.c2.text` | Headquartered in Cagliari, Sardinia... |
| `why.c3.text` | A vertically-trained LLM purpose-built for maritime risk intelligence... |
| `why.c4.text` | Tiered subscription model delivers continuous intelligence value... |
| `why.c5.text` | As a specialist boutique, we offer direct access to senior analysts... |
| `why.c6.text` | Beginning with the Sardinian maritime corridor and scaling outward... |

### 6. Pricing Card Details (~30 items)
| Key | English Text |
|-----|-------------|
| `pricing.t1.tier` | // Tier 01 |
| `pricing.t1.period` | / month · billed annually |
| `pricing.t1.f1` – `pricing.t1.f8` | 8 feature list items (Sentinel tier) |
| `pricing.t1.btn` | Request Access |
| `pricing.t2.tier` | // Tier 02 |
| `pricing.t2.period` | / month · billed annually |
| `pricing.t2.f1` – `pricing.t2.f8` | 8 feature list items (Guardian tier) |
| `pricing.t2.btn` | Request Access |
| `pricing.t3.tier` | // Tier 03 |
| `pricing.t3.period` | enterprise · government · institutional |
| `pricing.t3.f1` – `pricing.t3.f8` | 8 feature list items (Command tier) |
| `pricing.t3.btn` | Contact Us |

### 7. Advisory Section (~15 items)
| Key | English Text |
|-----|-------------|
| `adv.s1.title` | Investment Due Diligence |
| `adv.s1.desc` | Port infrastructure investment, maritime logistics assets... |
| `adv.s2.title` | Supply Chain Stress Testing |
| `adv.s2.desc` | Map your operational dependencies across Mediterranean chokepoints... |
| `adv.s3.title` | Geopolitical Scenario Modeling |
| `adv.s3.desc` | Custom scenario frameworks for asset managers... |
| `adv.s4.title` | Marine Insurance Risk Profiling |
| `adv.s4.desc` | Underwriting support and risk profiling services... |
| `adv.engage.title` | How We Engage |
| `adv.engage.desc` | Every advisory engagement is led by senior analysts... |
| `adv.engage.1` – `adv.engage.6` | 6 engagement type list items |
| `adv.engage.btn` | Schedule a Consultation |

### 8. Client Tags (10 items)
| Key | English Text |
|-----|-------------|
| `client.1` – `client.10` | Port Authorities, Ferry Operators, Cruise Terminal Ops, Logistics Firms, Marine Insurers, Energy Transport, Private Equity, Institutional Investors, Critical Infrastructure, Government Agencies |

### 9. CTA Buttons (2 items)
| Key | English Text |
|-----|-------------|
| `cta.btn1` | Request Platform Demo |
| `cta.btn2` | Advisory Inquiry |

### 10. Footer (~16 items)
| Key | English Text |
|-----|-------------|
| `footer.h.services` | Services |
| `footer.h.coverage` | Coverage |
| `footer.h.contact` | Contact |
| `footer.l.dashboard` | Mediterranean Watch Dashboard |
| `footer.l.investment` | Investment Advisory |
| `footer.l.supply` | Supply Chain Risk |
| `footer.l.tiers` | Subscription Tiers |
| `footer.geo.1` – `footer.geo.5` | Strait of Gibraltar, Tyrrhenian Sea, Strait of Sicily, Adriatic Sea, Eastern Mediterranean |

## Implementation Steps

### Step 1: Add `data-i18n` attributes to all untranslated HTML elements
Tag each element with its key from the tables above. Elements with inner HTML (spans, links) also get `data-i18n-html="true"`.

### Step 2: Add all English keys to `translations.en`
Every new key needs its English text so switching back to EN restores original content.

### Step 3: Add Italian translations to `translations.it`
Full Italian translations for all ~150 new keys.

### Step 4: Add Arabic translations to `translations.ar`
Full Arabic translations for all ~150 new keys.

### Step 5: RTL polish
Verify pricing cards, feature lists, and advisory layout render correctly in RTL. Add CSS rules as needed.

## Technical Approach

All changes are in one file: `index.html`. Use a Python script to:
1. Read the file
2. Make targeted string replacements to add `data-i18n` attributes
3. Replace the existing `<script>` translations block with an expanded version containing all keys in en/it/ar
4. Write the file back

## Verification

1. `python3 -m http.server 8080` and open `http://localhost:8080`
2. Click **EN** — all text in English (default)
3. Click **IT** — every visible text element switches to Italian
4. Click **AR** — page switches to RTL, all text is Arabic
5. Click **EN** — everything reverts to English
6. Refresh page — language choice is remembered via localStorage
7. No layout breakage in Arabic RTL mode (pricing grid, service cards, nav)

## Total Estimated New Translation Keys: ~150
