import { useState, type FormEvent } from 'react';
import {
  ArrowDown,
  ArrowRight,
  AudioLines,
  BarChart3,
  BellRing,
  BookOpenCheck,
  Check,
  ChevronDown,
  Clock3,
  Factory,
  FileText,
  Gauge,
  Languages,
  Menu,
  MessageSquareText,
  PlugZap,
  RefreshCw,
  ShieldCheck,
  X,
} from 'lucide-react';

const navItems = [
  { href: '#platform', label: 'Platform' },
  { href: '#approach', label: 'How it works' },
  { href: '#twin', label: 'Digital Twin' },
  { href: '#optimization', label: 'Optimization' },
  { href: '#impact', label: 'Impact' },
  { href: '#technology', label: 'Technology' },
];

const assets = [
  { id: 'furnace', label: 'Furnace', position: 'node-furnace', kind: 'Thermal process', share: 'Modelled load profile', context: 'Rated input and operating window from nameplate and shift records.', focus: 'Compare operating hours with the production schedule.' },
  { id: 'compressor', label: 'Compressor', position: 'node-compressor', kind: 'Compressed air', share: 'Modelled load profile', context: 'Nameplate rating and assumed utilization, constrained by available records.', focus: 'Review utilization assumptions and operating hours.' },
  { id: 'pump', label: 'Pump', position: 'node-pump', kind: 'Shiftable process load', share: 'Schedule scenario available', context: 'Shift timing is a demonstration input; process constraints need factory review.', focus: 'Compare two illustrative schedule windows in the scenario controls.' },
  { id: 'line', label: 'Production Line', position: 'node-line', kind: 'Production system', share: 'Modelled load profile', context: 'Production logs and run windows define the operating pattern where records allow.', focus: 'Keep throughput and production commitments in the model.' },
  { id: 'cooling', label: 'Cooling System', position: 'node-cooling', kind: 'Supporting process', share: 'Modelled load profile', context: 'Operating windows are inferred from supplied records, not live readings.', focus: 'Check operating windows against actual process needs.' },
  { id: 'auxiliary', label: 'Auxiliary Loads', position: 'node-auxiliary', kind: 'Other factory loads', share: 'Unallocated model estimate', context: 'Residual use may include lighting, office loads, and equipment not individually mapped.', focus: 'Improve the input inventory before drawing machine-level conclusions.' },
] as const;

const stages = [
  { name: 'INGEST', title: 'Bring the records', short: 'Bills, nameplates, production logs, shifts and tariffs.', detail: 'Start with electricity bills, machine nameplates, production logs, shift timings and tariff information. Inputs can be incomplete; the model should make gaps visible.' },
  { name: 'MODEL', title: 'Map the factory', short: 'Build bottom-up machine load curves.', detail: 'Represent equipment, rated loads and operating windows as a structured factory model. Machine-level profiles at this point are estimates.' },
  { name: 'CALIBRATE', title: 'Check against bills', short: 'Adjust utilization against billed consumption.', detail: 'Tune utilization assumptions so the simulated factory total can be compared with actual billed consumption. A matching bill total does not prove machine-level ground truth.' },
  { name: 'SIMULATE', title: 'Create scenarios', short: 'Generate an hourly operating picture.', detail: 'Use the calibrated model to examine hourly patterns and compare an unchanged baseline with an explicitly defined what-if scenario.' },
  { name: 'OPTIMIZE', title: 'Test constraints', short: 'Tariffs, demand, carbon and production needs.', detail: 'Compare candidate schedules against production constraints, Time-of-Day tariffs, demand constraints and carbon intensity where suitable inputs are available.' },
  { name: 'ACT', title: 'Share a next step', short: 'Put a practical recommendation in context.', detail: 'Recommendations are prompts for an owner or supervisor to review alongside the production plan—not automatic machine controls.' },
  { name: 'VALIDATE', title: 'Check the hypothesis', short: 'Optionally verify with a targeted logger.', detail: 'A single targeted, low-cost logger may be used to validate a high-value hypothesis. Validation measurements are distinct from model estimates.' },
] as const;

const faqs = [
  { q: 'Does SME-Twin use live machine telemetry?', a: 'No. SME-Twin is an early-stage sensorless concept. It starts by modelling electricity bills, machine nameplates, production logs, shift timings and tariff inputs; it is not a live, sensor-fed factory replica.' },
  { q: 'What does calibration establish?', a: 'Calibration compares a simulated factory total with billed consumption and adjusts assumptions where the available records support it. Agreement at the bill level does not establish measured consumption for each machine.' },
  { q: 'Are scenario results guaranteed savings?', a: 'No. What-if values on this page are demonstration assumptions, not a forecast, customer result or saving guarantee. Real outcomes depend on tariff details, records, process constraints and operating decisions.' },
  { q: 'Does the initial concept require new sensors?', a: 'No new sensor installation is assumed for the initial concept. Optional targeted logger validation is a separate step for checking a specific hypothesis.' },
  { q: 'Is SME-Twin available to deploy today?', a: 'SME-Twin is early-stage. This page describes a product direction and interactive illustration, not a deployed service or broad commercial availability.' },
];

function Brand() {
  return <a className="brand" href="#home" aria-label="SME-Twin home" data-testid="link-brand-home"><span className="brand-mark" aria-hidden="true" /><span className="brand-name">SME<span>—</span>Twin</span></a>;
}

function HeroFlow() {
  return (
    <div className="hero-visual" aria-label="Conceptual flow from existing factory records to a calibrated digital twin and operational recommendations">
      <div className="visual-head">
        <div className="visual-title">Factory model / concept view</div>
        <div className="visual-tag"><i className="status-square" /> ILLUSTRATIVE MODEL · NOT LIVE DATA</div>
      </div>
      <div className="flow-layout">
        <div className="flow-column">
          <div className="flow-label">01 / FACTORY DATA</div>
          <div className="flow-item"><strong>Electricity bills</strong><small>Consumption · tariff</small></div>
          <div className="flow-item"><strong>Machine nameplates</strong><small>Rated loads</small></div>
          <div className="flow-item"><strong>Production logs</strong><small>Output · run windows</small></div>
          <div className="flow-item"><strong>Shift timings</strong><small>Operating schedule</small></div>
        </div>
        <div className="flow-arrow" aria-hidden="true">→</div>
        <div className="flow-column">
          <div className="flow-label">02 / STRUCTURE</div>
          <div className="engine-box"><div><Factory size={20} /><br />CALIBRATION<br />ENGINE<small>Compare model total<br />with billed use</small></div></div>
        </div>
        <div className="flow-arrow" aria-hidden="true">→</div>
        <div className="flow-column">
          <div className="flow-label">03 / MODEL VIEW</div>
          <div className="flow-item"><strong>Energy breakdown</strong><small>Estimated by process</small></div>
          <div className="flow-item"><strong>What-if simulation</strong><small>Scenario comparison</small></div>
          <div className="flow-item"><strong>Tariff options</strong><small>Subject to inputs</small></div>
          <div className="flow-item"><strong>Carbon impact</strong><small>Only with suitable inputs</small></div>
        </div>
      </div>
      <div className="flow-results">
        <span className="result-chip">Cost opportunity / modelled only</span>
        <span className="result-chip">Schedule / proposal to review</span>
        <span className="result-chip">Local alert / concept, not live</span>
        <span className="result-chip">Optional targeted validation</span>
      </div>
      <div className="hero-footnote">All machine-level views shown here are model estimates. No live telemetry is represented.</div>
    </div>
  );
}

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<(typeof assets)[number]['id']>('compressor');
  const [selectedStage, setSelectedStage] = useState(0);
  const [mode, setMode] = useState<'baseline' | 'whatif'>('baseline');
  const [schedule, setSchedule] = useState<'day' | 'night'>('day');
  const [calculatedMode, setCalculatedMode] = useState<'baseline' | 'whatif'>('baseline');
  const [calculatedSchedule, setCalculatedSchedule] = useState<'day' | 'night'>('day');
  const [recalculation, setRecalculation] = useState(0);
  const [recalcMessage, setRecalcMessage] = useState('Baseline model estimate · demonstration assumptions');
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [submitted, setSubmitted] = useState(false);
  const activeAsset = assets.find((asset) => asset.id === selectedAsset) ?? assets[2];
  const isScenario = calculatedMode === 'whatif';
  const estimateIndex = isScenario ? (calculatedSchedule === 'night' ? 94 : 100) : 100;
  const barsBaseline = [34, 39, 42, 57, 72, 82, 78, 69, 65, 73, 84, 79, 68, 75, 85, 81, 67, 59, 52, 45, 40, 36, 32, 30];
  const barsScenario = calculatedSchedule === 'night'
    ? [33, 37, 40, 54, 69, 78, 74, 64, 60, 66, 74, 70, 61, 67, 73, 67, 54, 47, 45, 58, 67, 57, 44, 37]
    : [34, 39, 42, 57, 72, 82, 78, 69, 65, 73, 84, 79, 68, 75, 85, 81, 67, 59, 52, 45, 40, 36, 32, 30];
  const bars = isScenario ? (calculatedSchedule === 'night' ? barsScenario : barsBaseline) : barsBaseline;
  const handleRecalculate = () => {
    setRecalculation((value) => value + 1);
    setCalculatedMode(mode);
    setCalculatedSchedule(schedule);
    setRecalcMessage(mode === 'whatif'
      ? `WHAT-IF recalculated · ${schedule === 'night' ? '10 PM–6 AM' : '2 PM–10 PM'} schedule · model estimate`
      : 'BASELINE recalculated · illustrative model estimate');
  };
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="site-shell">
      <header className="topbar">
        <Brand />
        <nav className="nav-links" aria-label="Main navigation">{navItems.map((item) => <a key={item.href} href={item.href} data-testid={`link-nav-${item.href.slice(1)}`}>{item.label}</a>)}</nav>
        <div className="nav-actions"><a className="text-link" href="#technology" data-testid="link-early-stage">Early-stage concept</a><a className="button button-outline" href="/dashboard" data-testid="link-dashboard">Open Dashboard <ArrowRight size={14} /></a><a className="button button-accent" href="#twin" data-testid="link-launch-demo">Explore the Twin <ArrowRight size={14} /></a></div>
        <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-expanded={menuOpen} aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'} data-testid="button-mobile-menu">{menuOpen ? <X size={20} /> : <Menu size={20} />}</button>
        {menuOpen && <nav className="mobile-nav" aria-label="Mobile navigation">{navItems.map((item) => <a key={item.href} href={item.href} onClick={() => setMenuOpen(false)} data-testid={`link-mobile-${item.href.slice(1)}`}>{item.label}</a>)}<a className="button button-outline" href="/dashboard" onClick={() => setMenuOpen(false)} data-testid="link-mobile-dashboard">Open Dashboard <ArrowRight size={14} /></a><a className="button button-accent" href="#twin" onClick={() => setMenuOpen(false)} data-testid="link-mobile-demo">Explore the Twin <ArrowRight size={14} /></a></nav>}
      </header>

      <main>
        <section className="hero" id="home">
          <div className="hero-inner">
            <div className="hero-copy">
              <div className="eyebrow">Industrial energy intelligence / India</div>
              <h1>Your factory already has the data. <em>We turn it into a digital twin.</em></h1>
              <p className="hero-desc">SME-Twin is an early-stage concept for turning bills, nameplates, production logs, shift timings and tariff inputs into a calibrated factory model—then testing operational changes before acting.</p>
              <div className="hero-ctas"><a className="button button-accent" href="#twin" data-testid="link-explore-twin">Explore the Twin <ArrowRight size={15} /></a><a className="button button-outline" href="#approach" data-testid="link-see-workflow">See how it works <ArrowDown size={14} /></a></div>
              <div className="hero-note"><ShieldCheck size={14} /> No new sensor installation is assumed for the initial concept. Model estimates are not machine-level measurements.</div>
            </div>
            <HeroFlow />
          </div>
          <div className="hero-index"><span>MODEL / 01</span> &nbsp; · &nbsp; CONCEPT, NOT TELEMETRY</div>
        </section>

        <div className="trustline" aria-label="Product principles">
          <p>Designed around the data a factory already keeps</p>
          <div className="trust-items"><span><FileText size={14} /> Existing records</span><span><PlugZap size={14} /> No new sensors assumed initially</span><span><BarChart3 size={14} /> Estimates separated from measurements</span></div>
        </div>

        <section className="section problem" id="platform">
          <div className="section-heading">
            <div><div className="section-label">From bill to operating picture / 01</div><h2>Most SMEs see the bill. They don't see the waste.</h2></div>
            <p className="section-intro">A monthly total tells you what the factory used and paid. It rarely explains which operating assumptions sit behind the number.</p>
          </div>
          <div className="problem-compare">
            <article className="compare-side">
              <div className="compare-kicker">01 / BILL-ONLY VISIBILITY</div><h3>Traditional view</h3>
              <div className="bill-chain"><div className="chain-node">Monthly bill</div><div className="chain-arrow">→</div><div className="chain-node">Total kWh</div><div className="chain-arrow">→</div><div className="chain-node">Total ₹</div></div>
              <div className="question-callout">“Where did the energy go?”</div>
            </article>
            <article className="compare-side">
              <div className="compare-kicker">02 / MODEL-BASED OPERATIONAL PICTURE</div><h3>SME-Twin concept</h3>
              <div className="twin-map">
                <div className="twin-input">Electricity bill</div><div className="twin-input">Machine details</div><div className="twin-input">Production data</div><div className="twin-input">Operating schedule</div>
                <div className="map-core"><span>Factory digital twin</span><ArrowRight size={15} /></div>
                <div className="comparison-result"><span>Machine-level estimated energy</span><span>Waste hypotheses</span><span>Tariff opportunities</span><span>What-if scenarios</span></div>
              </div>
            </article>
          </div>
        </section>

        <section className="zero-section" id="impact">
          <div className="zero-inner">
            <div className="section-label">A different starting path / 02</div>
            <h2>Begin with records. Validate only where it matters.</h2>
            <div className="zero-grid">
              <article className="route-card">
                <div className="route-head"><span>CONVENTIONAL SENSOR PROJECT</span><span>HARDWARE-LED</span></div>
                <div className="route-steps"><div className="route-step">Procure<br />hardware</div><i className="route-arrow">→</i><div className="route-step">Install<br />sensors</div><i className="route-arrow">→</i><div className="route-step">Wire &amp;<br />configure</div><i className="route-arrow">→</i><div className="route-step">Collect &amp;<br />analyze</div></div>
                <div className="route-caveat">A conventional path shown for context; timing and cost vary by site. No comparative timeline or cost claim is made.</div>
              </article>
              <article className="route-card twin-route">
                <div className="route-head"><span>SME-TWIN INITIAL CONCEPT</span><span>RECORDS-LED</span></div>
                <div className="route-steps"><div className="route-step">Add bill<br />inputs</div><i className="route-arrow">→</i><div className="route-step">Map machine<br />nameplates</div><i className="route-arrow">→</i><div className="route-step">Add production<br />&amp; shifts</div><i className="route-arrow">→</i><div className="route-step">Calibrate<br />the model</div></div>
                <div className="route-caveat">No new sensor installation is assumed for the initial concept. Data preparation and model usefulness depend on the information available.</div>
              </article>
            </div>
            <p className="zero-disclaimer"><strong>Starting-path comparison only.</strong> No time-to-insight, installation-cost or savings comparison is promised. A targeted logger may optionally validate a high-value model hypothesis later.</p>
          </div>
        </section>

        <section className="workflow" id="approach">
          <div className="workflow-inner">
            <div className="section-heading">
              <div><div className="section-label">A transparent model workflow / 03</div><h2>From raw records to a decision you can check.</h2></div>
              <p className="section-intro">Select any stage for a closer explanation. Each output carries its status: input, estimate, simulated scenario, action or validation measurement.</p>
            </div>
            <div className="pipeline" role="group" aria-label="Seven-stage digital twin model pipeline">
              {stages.map((stage, index) => <button className="pipeline-stage" key={stage.name} onClick={() => setSelectedStage(index)} aria-pressed={selectedStage === index} data-testid={`button-stage-${stage.name.toLowerCase()}`}><span className="stage-num">0{index + 1} / {stage.name}</span><span className="stage-title">{stage.title}</span><span className="stage-desc">{stage.short}</span></button>)}
            </div>
            <div className="stage-detail" role="status" data-testid="text-stage-detail"><strong>{stages[selectedStage].name} / </strong>{stages[selectedStage].detail}</div>
            <div className="technical-note" id="technology"><strong>The twin is an estimate, not a measurement.</strong><p>Modelled machine-level curves are calibrated against available records and billed factory consumption. That bill-level comparison does not establish machine-level ground truth. Confidence bands and assumptions should stay visible; optional targeted logger validation can check a specific high-value hypothesis.</p></div>
          </div>
        </section>

        <section className="twin-section" id="twin">
          <div className="twin-inner">
            <div className="twin-head"><div><div className="section-label">Interactive concept / 04</div><h2>Explore the Twin</h2></div><p className="section-intro">Select a process, switch the model view and recalculate a scheduling scenario. Every value here is an illustrative model estimate—not measured factory data.</p></div>
            <div className="explorer">
              <div className="factory-panel">
                <div className="factory-panel-head"><span>Factory layout / conceptual</span><span className="not-live">MODEL VIEW · NOT LIVE</span></div>
                <div className="factory-map" role="group" aria-label="Select a machine or process">
                  {assets.map((asset) => <button key={asset.id} className={`machine-node ${asset.position}`} onClick={() => setSelectedAsset(asset.id)} aria-pressed={selectedAsset === asset.id} data-testid={`button-asset-${asset.id}`}><span>{asset.label}</span><small>{asset.id === 'pump' ? 'SCHEDULE CASE' : 'EST. LOAD'}</small></button>)}
                  <div className="factory-caption">Illustrative equipment map · no live connections</div>
                </div>
              </div>
              <div className="detail-panel">
                <div className="detail-kicker">Selected process / {activeAsset.kind}</div>
                <h3 data-testid="text-selected-asset">{activeAsset.label}</h3>
                <p className="detail-summary">{activeAsset.focus}</p>
                <div className={`detail-metrics ${activeAsset.id === 'compressor' ? 'detail-metrics-example' : ''}`}>
                  {activeAsset.id === 'compressor' ? <>
                    <div className="detail-metric"><span>Estimated share · example</span><strong data-testid="text-compressor-share">18.7%</strong></div>
                    <div className="detail-metric"><span>Confidence band · example</span><strong data-testid="text-compressor-confidence">±4.2%</strong></div>
                    <div className="detail-metric"><span>Potential waste · example</span><strong data-testid="text-compressor-waste">₹8,420/month</strong></div>
                  </> : <>
                    <div className="detail-metric"><span>Energy profile</span><strong data-testid="text-asset-profile">{activeAsset.share}</strong></div>
                    <div className="detail-metric"><span>Data status</span><strong>Model estimate</strong></div>
                  </>}
                </div>
                {activeAsset.id === 'compressor' && <p className="metric-note" data-testid="text-compressor-disclaimer">Illustrative sample values from the brief—not observed factory data, validated results or a forecast.</p>}
                <div className="detail-context"><strong>Model context:</strong> {activeAsset.context}</div>
              </div>
            </div>
            <div className="twin-controls" aria-label="Scenario controls">
              <button className="mode-button" aria-pressed={mode === 'baseline'} onClick={() => { setMode('baseline'); setRecalcMessage('Baseline selected · recalculate to refresh the illustrative model'); }} data-testid="button-mode-baseline">BASELINE</button>
              <button className="mode-button" aria-pressed={mode === 'whatif'} onClick={() => { setMode('whatif'); setRecalcMessage('What-if selected · choose a schedule, then recalculate'); }} data-testid="button-mode-whatif">WHAT-IF</button>
              <span className="control-label">Pump schedule</span>
              <button className="schedule-button" aria-pressed={schedule === 'day'} onClick={() => { setSchedule('day'); setMode('whatif'); setRecalcMessage('2 PM–10 PM selected · recalculate to refresh the illustrative model'); }} data-testid="button-schedule-day">2 PM–10 PM</button>
              <button className="schedule-button" aria-pressed={schedule === 'night'} onClick={() => { setSchedule('night'); setMode('whatif'); setRecalcMessage('10 PM–6 AM selected · recalculate to refresh the illustrative model'); }} data-testid="button-schedule-night">10 PM–6 AM</button>
              <button className="recalc-button" onClick={handleRecalculate} data-testid="button-recalculate"><RefreshCw size={13} /> Recalculate</button>
            </div>
            <div className="model-readout" aria-live="polite" data-testid="readout-model-estimates">
              <div className="readout-item"><span>Estimated energy profile</span><strong data-testid="text-energy-estimate">{isScenario ? `Schedule ${calculatedSchedule === 'night' ? '10 PM–6 AM' : '2 PM–10 PM'}` : 'Baseline schedule'}</strong></div>
              <div className="readout-item"><span>Estimated tariff cost index</span><strong data-testid="text-tariff-estimate">{estimateIndex} / 100 · demo</strong></div>
              <div className="readout-item"><span>Scenario comparison</span><strong className="delta" data-testid="text-scenario-delta">{isScenario ? `${estimateIndex - 100} index points · demo` : 'Reference · demo index'}</strong></div>
            </div>
            <div className="recalc-status" role="status" data-testid="status-recalculation">{recalcMessage} · run {recalculation}</div>
            <div className="chart-area" role="img" aria-label={`Illustrative indexed hourly load profile, ${isScenario ? `what-if pump schedule ${calculatedSchedule === 'night' ? '10 PM to 6 AM' : '2 PM to 10 PM'}` : 'baseline schedule'}`}>
              <div className="chart-y"><span>100</span><span>50</span><span>0</span></div>
              <div><div className="schedule-chart"><div className="chart-bars">{bars.map((height, index) => <div className="bar-col" key={`${index}-${height}`}><span className={`bar ${isScenario && ((calculatedSchedule === 'night' && index > 18) || (calculatedSchedule === 'day' && index >= 14 && index < 22)) ? 'shifted' : ''}`} style={{ height: `${Math.max(8, height - (isScenario && calculatedSchedule === 'night' && index > 11 && index < 19 ? 10 : 0))}%` }} /></div>)}</div></div><div className="bar-labels"><span>06:00</span><span>10:00</span><span>14:00</span><span>18:00</span><span>22:00</span><span>02:00</span><span>06:00</span></div></div>
            </div>
            <div className="chart-legend"><span><i className="legend-dot" /> Baseline assumed load shape</span><span><i className="legend-dot whatif" /> Illustrative shifted schedule</span><span>Indexed profile · demo assumption</span></div>
            <div className="twin-disclaimer"><strong>DEMO ASSUMPTIONS / MODEL OUTPUT, NOT A MEASUREMENT.</strong> The tariff-cost index uses a hypothetical tariff differential and an assumed pump load; the baseline is set to 100 for illustration only. The what-if index of 94 is a scenario input/output illustration, not currency, actual energy, a validated saving or a guarantee. Production feasibility and real tariffs are not verified here. Recalculate to apply the selected schedule to this conceptual load shape.</div>
          </div>
        </section>

        <section className="illustration" id="optimization">
          <div className="illustration-inner">
            <div className="illustration-copy"><div className="section-label">From scenario to operational choice / 05</div><h2>Test the timing. Keep the production context.</h2><p>Tariff-aware scheduling can compare flexible operating windows against Time-of-Day tariffs while considering demand constraints, carbon intensity and production requirements—when those inputs are available.</p><p>Benchmarking can compare modelled use across machines, shifts or production periods. These comparisons are only as meaningful as their inputs.</p></div>
            <div className="model-number"><div className="model-overline">Decision support / no autonomous controls</div><div className="model-amount">Model → review → act</div><p>A scenario is a proposal to examine with an owner or supervisor, not a command to a machine. Validate operating constraints before changing a production schedule.</p><div className="model-disclaimer">Estimated profiles describe a calibrated model. A simulated schedule describes a what-if. A targeted logger reading, if used, is a measurement. Keep those three statuses distinct.</div></div>
          </div>
        </section>

        <section className="section capabilities">
          <div className="cap-copy"><div className="section-label">Questions the model can help frame / 06</div><h2>Operational context, not another dashboard.</h2><p className="section-intro">The intent is to connect energy cost with the real constraints of a working factory.</p></div>
          <div className="cap-list">
            <article className="capability"><div className="cap-icon"><Clock3 size={19} /></div><div><h3>Scheduling</h3><p>Explore whether flexible activity could move across tariff periods, subject to shift plans, production commitments and demand constraints.</p></div><span className="cap-number">01</span></article>
            <article className="capability"><div className="cap-icon"><Gauge size={19} /></div><div><h3>Benchmarking</h3><p>Compare modelled consumption across machines, shifts or production periods; benchmarks are not measurements and depend on input quality.</p></div><span className="cap-number">02</span></article>
            <article className="capability"><div className="cap-icon"><BookOpenCheck size={19} /></div><div><h3>Compliance information</h3><p>Keep relevant energy and compliance documents organised and easier to retrieve. Applicable requirements depend on unit and jurisdiction; no approval is implied.</p></div><span className="cap-number">03</span></article>
            <article className="capability"><div className="cap-icon"><BellRing size={19} /></div><div><h3>Local-language alert concepts</h3><p>Hindi, Marathi and Gujarati voice or WhatsApp alerts are product concepts, not an active notification service or deployed communication workflow.</p></div><span className="cap-number">04</span></article>
          </div>
        </section>

        <section className="language-section">
          <div className="language-inner">
            <div><div className="section-label">Communication should fit the shift / 07</div><h2>Useful context, in the language of the floor.</h2><p>Short local-language alert concepts could help an operator review a proposed schedule with its production context. Final content and workflow need local validation; these are not live alerts.</p><div className="language-options"><span className="language-chip"><Languages size={13} /> हिन्दी · Hindi</span><span className="language-chip">मराठी · Marathi</span><span className="language-chip">ગુજરાતી · Gujarati</span></div></div>
            <div className="message-stack" aria-label="Conceptual local-language alert examples">
              <div className="message-card"><div className="message-channel"><span><AudioLines size={11} /> Voice briefing · concept</span><span>Hindi</span></div><p>आज की शिफ्ट में मशीन का समय बदलने से पहले उत्पादन योजना और लागू बिजली दर जाँचें।</p><small>Illustrative wording · not a live alert</small></div>
              <div className="message-card"><div className="message-channel"><span><MessageSquareText size={11} /> Message · concept</span><span>Marathi</span></div><p>वेळापत्रक बदलण्यापूर्वी उत्पादन नियोजन आणि लागू वीजदर तपासा.</p><small>Illustrative wording · not a live alert</small></div>
              <div className="message-caption">CONCEPT EXAMPLES · CONTENT REQUIRES LOCAL REVIEW</div>
            </div>
          </div>
        </section>

        <section className="section" id="faq">
          <div className="faq-grid"><div className="faq-intro"><div className="section-label">Important distinctions / 08</div><h2>Before you put it to work.</h2><p>SME-Twin is early-stage. Here is what the concept means—and what it does not claim.</p></div>
            <div className="faq-list">{faqs.map((faq, index) => <div className="faq-item" key={faq.q}><button className="faq-question" onClick={() => setOpenFaq(openFaq === index ? null : index)} aria-expanded={openFaq === index} aria-controls={`faq-answer-${index}`} data-testid={`button-faq-${index}`}>{faq.q}<ChevronDown size={16} /></button>{openFaq === index && <div className="faq-answer" id={`faq-answer-${index}`} data-testid={`text-faq-answer-${index}`}>{faq.a}</div>}</div>)}</div>
          </div>
        </section>

        <section className="contact" id="contact">
          <div className="contact-inner">
            <div className="contact-copy"><div className="section-label">Early-stage project / 09</div><h2>Explore the concept with us.</h2><p>Share the question you are working through. This demonstration page does not submit, transmit or store your enquiry; it only previews a local confirmation.</p><div className="contact-details"><span>Project notes &amp; early-stage status</span><a href="https://github.com/nidhitshah11-06/mdm" target="_blank" rel="noreferrer" data-testid="link-contact-repository">github.com/nidhitshah11-06/mdm <ArrowRight size={12} /></a></div></div>
            <form className="contact-form" onSubmit={handleSubmit} data-testid="form-pilot-interest">
              {submitted ? <div className="form-success" role="status" data-testid="status-form-submitted"><Check size={16} /><div><strong>Local preview complete.</strong><br />Nothing was sent or saved. To reach the project, use the GitHub link alongside this form.</div></div> : <>
                <div className="field"><label htmlFor="contact-name">Your name</label><input id="contact-name" name="name" placeholder="Name" required data-testid="input-contact-name" /></div>
                <div className="field"><label htmlFor="contact-role">Role / organisation</label><input id="contact-role" name="role" placeholder="e.g. Plant manager" required data-testid="input-contact-role" /></div>
                <div className="field"><label htmlFor="contact-industry">Industry</label><input id="contact-industry" name="industry" placeholder="e.g. Textiles" data-testid="input-contact-industry" /></div>
                <div className="field"><label htmlFor="contact-location">City / state</label><input id="contact-location" name="location" placeholder="e.g. Surat, Gujarat" data-testid="input-contact-location" /></div>
                <div className="field full"><label htmlFor="contact-question">What would you like to understand?</label><textarea id="contact-question" name="question" placeholder="A short note about the factory energy question you are exploring." required data-testid="input-contact-question" /></div>
                <div className="form-bottom"><small>Demo only: no network request, transmission or storage.</small><button className="button button-accent" type="submit" data-testid="button-submit-enquiry">Preview enquiry <ArrowRight size={14} /></button></div>
              </>}
            </form>
          </div>
        </section>
      </main>

      <footer className="footer"><Brand /><div className="footer-links"><a href="#approach" data-testid="link-footer-approach">Workflow</a><a href="#twin" data-testid="link-footer-twin">Explore the Twin</a><a href="#contact" data-testid="link-footer-contact">Enquire</a><a href="https://github.com/nidhitshah11-06/mdm" target="_blank" rel="noreferrer" data-testid="link-footer-github">GitHub</a></div><div className="footer-note">Early-stage concept. Illustrations are model estimates and demo assumptions; no customer outcomes, live telemetry or service availability are implied.</div></footer>
    </div>
  );
}

export default App;