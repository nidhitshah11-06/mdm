// SME-Twin — Zero-Hardware Energy Intelligence Platform
// Single-file CDN React app (no build step needed)

const { useState, useEffect, useCallback, useRef, useMemo } = React;
const {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine
} = Recharts;

// ─── LOGIN PAGE ──────────────────────────────────────────────────────────────
function LoginPage({ onLogin }) {
  const [role, setRole] = useState(null); // 'admin' | 'supervisor'
  const [pin, setPin] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Hide the loading screen as soon as login page renders
  useEffect(() => {
    const el = document.getElementById('loading-screen');
    if (el) el.classList.add('hidden');
  }, []);

  // Supervisor PIN (simple demo auth — in production use JWT)
  const SUPERVISOR_PIN = '1234';

  const handleAdminLogin = () => {
    setLoading(true);
    const el = document.getElementById('loading-screen');
    if (el) el.classList.add('hidden');
    setTimeout(() => {
      onLogin({ role: 'admin', name: 'Admin', phone: '' });
    }, 600);
  };

  const handleSupervisorLogin = () => {
    if (!name.trim()) { setError('Please enter your name'); return; }
    if (!phone.trim()) { setError('Please enter your phone number'); return; }
    if (pin !== SUPERVISOR_PIN) { setError('Incorrect PIN. Demo PIN is 1234'); return; }
    setLoading(true);
    const el = document.getElementById('loading-screen');
    if (el) el.classList.add('hidden');
    setTimeout(() => {
      onLogin({ role: 'supervisor', name: name.trim(), phone: phone.trim() });
    }, 600);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      {/* Background pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-green-900 rounded-full filter blur-3xl opacity-10"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-900 rounded-full filter blur-3xl opacity-10"></div>
      </div>

      <div className="relative w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="w-12 h-12 bg-green-700 rounded-xl flex items-center justify-center text-2xl">🏭</div>
            <div>
              <h1 className="text-3xl font-bold text-white">SME-Twin</h1>
              <p className="text-green-400 text-sm font-medium">Zero-Hardware Energy Intelligence</p>
            </div>
          </div>
          <p className="text-slate-400 text-sm max-w-md mx-auto">
            Calibrated digital twin for Indian manufacturing SMEs — optimise energy with no sensors, no hardware.
          </p>
        </div>

        {/* Role cards */}
        {!role && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {/* Admin card */}
            <button
              onClick={handleAdminLogin}
              disabled={loading}
              className="group bg-slate-900 border border-slate-700 hover:border-green-600 rounded-2xl p-8 text-left transition-all hover:bg-slate-800 hover:shadow-lg hover:shadow-green-900/20"
            >
              <div className="w-14 h-14 bg-green-900 rounded-xl flex items-center justify-center text-3xl mb-5 group-hover:bg-green-800 transition-colors">
                👑
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Admin</h2>
              <p className="text-slate-400 text-sm leading-relaxed mb-5">
                Full access to all factories, analytics, compliance docs, calibration, and system settings.
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs bg-green-900 text-green-300 px-3 py-1 rounded-full font-medium">No credentials needed</span>
                <span className="text-green-400 text-lg group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </button>

            {/* Supervisor card */}
            <button
              onClick={() => setRole('supervisor')}
              className="group bg-slate-900 border border-slate-700 hover:border-blue-600 rounded-2xl p-8 text-left transition-all hover:bg-slate-800 hover:shadow-lg hover:shadow-blue-900/20"
            >
              <div className="w-14 h-14 bg-blue-900 rounded-xl flex items-center justify-center text-3xl mb-5 group-hover:bg-blue-800 transition-colors">
                🔧
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Supervisor</h2>
              <p className="text-slate-400 text-sm leading-relaxed mb-5">
                Floor-level access: view today's schedule, send WhatsApp/voice alerts, check machine status.
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs bg-blue-900 text-blue-300 px-3 py-1 rounded-full font-medium">PIN required</span>
                <span className="text-blue-400 text-lg group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </button>
          </div>
        )}

        {/* Supervisor login form */}
        {role === 'supervisor' && (
          <div className="max-w-sm mx-auto bg-slate-900 border border-slate-700 rounded-2xl p-8">
            <button onClick={() => { setRole(null); setError(''); setPin(''); }} className="text-slate-500 hover:text-slate-300 text-sm mb-6 flex items-center gap-1">
              ← Back
            </button>
            <div className="w-12 h-12 bg-blue-900 rounded-xl flex items-center justify-center text-2xl mb-4">🔧</div>
            <h2 className="text-xl font-bold text-white mb-1">Supervisor Login</h2>
            <p className="text-slate-500 text-sm mb-6">Enter your details to access the floor dashboard.</p>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-500 block mb-1.5 font-medium uppercase tracking-wide">Your Name</label>
                <input
                  type="text" value={name} onChange={e => { setName(e.target.value); setError(''); }}
                  placeholder="e.g. Ramesh Patil"
                  className="w-full bg-slate-800 border border-slate-700 focus:border-blue-500 text-slate-200 rounded-lg px-4 py-3 text-sm outline-none transition-colors"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1.5 font-medium uppercase tracking-wide">Phone Number</label>
                <input
                  type="tel" value={phone} onChange={e => { setPhone(e.target.value); setError(''); }}
                  placeholder="+91 9876543210"
                  className="w-full bg-slate-800 border border-slate-700 focus:border-blue-500 text-slate-200 rounded-lg px-4 py-3 text-sm outline-none transition-colors"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1.5 font-medium uppercase tracking-wide">PIN</label>
                <input
                  type="password" value={pin} onChange={e => { setPin(e.target.value); setError(''); }}
                  placeholder="4-digit PIN"
                  maxLength={4}
                  className="w-full bg-slate-800 border border-slate-700 focus:border-blue-500 text-slate-200 rounded-lg px-4 py-3 text-sm outline-none transition-colors"
                  onKeyDown={e => e.key === 'Enter' && handleSupervisorLogin()}
                />
                <p className="text-xs text-slate-600 mt-1">Demo PIN: 1234</p>
              </div>

              {error && (
                <div className="bg-red-950 border border-red-800 text-red-300 text-sm px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              <button
                onClick={handleSupervisorLogin}
                disabled={loading}
                className="w-full bg-blue-700 hover:bg-blue-600 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {loading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span> : null}
                Sign In as Supervisor
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-10 text-xs text-slate-600">
          SME-Twin · SDG 7 & 9 · Zero-hardware energy intelligence for Indian MSMEs
        </div>
      </div>
    </div>
  );
}

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
// When served by FastAPI on port 8000, use same origin. Otherwise fall back to localhost:8000.
const API = (window.location.port === '8000' || window.location.hostname !== 'localhost')
  ? `${window.location.protocol}//${window.location.host}/api/v1`
  : 'http://localhost:8000/api/v1';
const BRAND = '#16a34a';
const BRAND_LIGHT = '#22c55e';
const COLORS = ['#16a34a','#2563eb','#d97706','#dc2626','#7c3aed','#0891b2','#be185d','#65a30d'];

// Indian number formatting
const inr = (n) => {
  if (n === null || n === undefined) return '—';
  const abs = Math.abs(n);
  let s;
  if (abs >= 1e7) s = (n/1e7).toFixed(1) + ' Cr';
  else if (abs >= 1e5) s = (n/1e5).toFixed(1) + ' L';
  else s = n.toLocaleString('en-IN', {maximumFractionDigits:0});
  return '₹' + s;
};
const fmt = (n, d=1) => n === null || n === undefined ? '—' : Number(n).toFixed(d);

// ─── MOCK DATA ────────────────────────────────────────────────────────────────
const MOCK_FACTORY = {
  id: 'mock-factory-001',
  name: 'Shree Ganesh Textiles',
  sector: 'Textile / Spinning',
  phone_number: '+919876543210',
  udyam_number: 'UDYAM-GJ-12-0034521',
  created_at: '2026-01-15T10:00:00Z',
  machines: [
    { id: 'm1', name: 'Ring Frame #1', rated_kw: 37, process_type: 'shiftable', max_daily_hours: 20 },
    { id: 'm2', name: 'Ring Frame #2', rated_kw: 37, process_type: 'shiftable', max_daily_hours: 20 },
    { id: 'm3', name: 'Ring Frame #3', rated_kw: 37, process_type: 'shiftable', max_daily_hours: 20 },
    { id: 'm4', name: 'Ring Frame #4', rated_kw: 37, process_type: 'shiftable', max_daily_hours: 20 },
    { id: 'm5', name: 'Air Compressor A', rated_kw: 22, process_type: 'shiftable', max_daily_hours: 16 },
    { id: 'm6', name: 'Air Compressor B', rated_kw: 22, process_type: 'shiftable', max_daily_hours: 16 },
    { id: 'm7', name: 'Dyeing Vat', rated_kw: 45, process_type: 'shiftable', max_daily_hours: 10 },
    { id: 'm8', name: 'Utility Pump', rated_kw: 11, process_type: 'shiftable', max_daily_hours: 18 },
    { id: 'm9', name: 'Lighting Circuit', rated_kw: 8, process_type: 'continuous', max_daily_hours: 24 },
  ],
  latest_bill: {
    id: 'b1', billing_month: '2026-09', total_kwh: 84200,
    peak_demand_kva: 320, tod_peak_kwh: 41000, tod_offpeak_kwh: 43200
  },
  latest_calibration: {
    factory_id: 'mock-factory-001',
    calibrated_duty_cycles: { m1:0.72, m2:0.68, m3:0.74, m4:0.70, m5:0.55, m6:0.52, m7:0.38, m8:0.61, m9:1.0 },
    simulation_error_pct: 3.2,
    timestamp: '2026-10-01T08:30:00Z'
  }
};

const MOCK_SCHEDULE = {
  factory_id: 'mock-factory-001',
  optimized_daily_cost: 58420,
  baseline_daily_cost: 67840,
  estimated_daily_savings: 9420,
  savings_percent: 13.9,
  peak_capacity_kw: 288,
  hourly_schedule: {
    m7: [0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0], // Dyeing Vat shifted to off-peak
    m5: [1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1],
    m6: [1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1],
  }
};

const MOCK_BENCHMARK = Array.from({length:15}, (_,i) => ({
  id: `SME-${String(i+1).padStart(3,'0')}`,
  sec_kwh_per_unit: +(2.4 + Math.sin(i*1.7)*0.9 + Math.cos(i*0.8)*0.4).toFixed(3),
  sector: 'textile',
  monthly_kwh: 60000 + i*4200,
  is_current_factory: i === 7
}));

const MOCK_DPR = {
  factory_name: 'Shree Ganesh Textiles',
  factory_sector: 'Textile / Spinning',
  generated_at: new Date().toISOString(),
  executive_summary: {
    annual_energy_kwh: 1010400, annual_bill_inr: 8588400,
    potential_savings_pct: 15, potential_annual_savings_inr: 1288260,
    co2_baseline_ton: 829, co2_reduction_ton: 124.4
  },
  energy_profile: { monthly_kwh: 84200, peak_demand_kva: 320, billing_month: '2026-09' },
  financial_analysis: { project_cost_inr: 450000, annual_savings_inr: 1288260, simple_payback_years: 0.35 },
  adeetie_loan_details: {
    loan_amount_inr: 450000, interest_subsidy_pct: 4, monthly_emi_inr: 12500,
    repayment_years: 3, interest_subsidy_amount_inr: 54000,
    udyam_number: 'UDYAM-GJ-12-0034521'
  },
  cbam_footprint: {
    cea_grid_factor_kg_per_kwh: 0.82, scope2_kg_co2: 828528,
    total_annual_co2_ton: 829, co2_reduction_ton_pa: 124.4
  }
};

// ─── API CLIENT ───────────────────────────────────────────────────────────────
const api = {
  async get(path) {
    const r = await fetch(API + path);
    if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
    return r.json();
  },
  async post(path, body) {
    const r = await fetch(API + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!r.ok) { const e = await r.json().catch(()=>{}); throw new Error(e?.detail || r.statusText); }
    return r.json();
  },
  async postForm(path, formData) {
    const r = await fetch(API + path, { method: 'POST', body: formData });
    if (!r.ok) { const e = await r.json().catch(()=>{}); throw new Error(e?.detail || r.statusText); }
    return r.json();
  }
};

// ─── UI PRIMITIVES ────────────────────────────────────────────────────────────
function Toast({ toasts }) {
  return React.createElement('div', { className: 'fixed top-4 right-4 z-50 space-y-2 pointer-events-none' },
    toasts.map(t => React.createElement('div', {
      key: t.id,
      className: `px-4 py-3 rounded-lg shadow-lg text-sm font-medium pointer-events-auto transition-all
        ${t.type === 'error' ? 'bg-red-600 text-white' : t.type === 'warning' ? 'bg-yellow-500 text-black' : 'bg-green-600 text-white'}`
    }, t.msg))
  );
}

function Spinner({ size = 4 }) {
  return React.createElement('svg', {
    className: `animate-spin h-${size} w-${size} text-current`, fill: 'none', viewBox: '0 0 24 24'
  },
    React.createElement('circle', { className: 'opacity-25', cx: 12, cy: 12, r: 10, stroke: 'currentColor', strokeWidth: 4 }),
    React.createElement('path', { className: 'opacity-75', fill: 'currentColor', d: 'M4 12a8 8 0 018-8v8H4z' })
  );
}

function Btn({ onClick, disabled, loading, children, variant = 'primary', className = '' }) {
  const base = 'inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed';
  const variants = {
    primary: 'bg-green-700 hover:bg-green-600 text-white',
    secondary: 'bg-slate-700 hover:bg-slate-600 text-slate-100',
    danger: 'bg-red-700 hover:bg-red-600 text-white',
    ghost: 'text-slate-300 hover:text-white hover:bg-slate-800',
  };
  return React.createElement('button', {
    onClick, disabled: disabled || loading, className: `${base} ${variants[variant]} ${className}`
  }, loading && React.createElement(Spinner, { size: 4 }), children);
}

function Card({ children, className = '' }) {
  return React.createElement('div', { className: `bg-slate-900 border border-slate-800 rounded-xl p-5 ${className}` }, children);
}

function KpiCard({ label, value, sub, trend, icon, color = 'green' }) {
  const colors = { green: 'text-green-400', blue: 'text-blue-400', amber: 'text-amber-400', red: 'text-red-400' };
  return React.createElement(Card, { className: 'flex flex-col gap-1' },
    React.createElement('div', { className: 'flex items-center justify-between mb-1' },
      React.createElement('span', { className: 'text-xs font-medium text-slate-400 uppercase tracking-wide' }, label),
      icon && React.createElement('span', { className: `text-2xl` }, icon)
    ),
    React.createElement('div', { className: `text-2xl font-bold ${colors[color]}` }, value),
    sub && React.createElement('div', { className: 'text-xs text-slate-500 mt-1 flex items-center gap-1' },
      trend === 'up' && React.createElement('span', { className: 'text-green-400' }, '↑'),
      trend === 'down' && React.createElement('span', { className: 'text-red-400' }, '↓'),
      sub
    )
  );
}

function SectionHeader({ title, subtitle }) {
  return React.createElement('div', { className: 'mb-5' },
    React.createElement('h2', { className: 'text-lg font-semibold text-white' }, title),
    subtitle && React.createElement('p', { className: 'text-sm text-slate-400 mt-0.5' }, subtitle)
  );
}

function Badge({ children, color = 'green' }) {
  const c = { green:'bg-green-900 text-green-300', blue:'bg-blue-900 text-blue-300', amber:'bg-amber-900 text-amber-300', red:'bg-red-900 text-red-300', slate:'bg-slate-800 text-slate-300' };
  return React.createElement('span', { className: `text-xs px-2 py-0.5 rounded-full font-medium ${c[color]}` }, children);
}

// ─── SIDEBAR & SHELL ─────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: 'dashboard',  label: 'Dashboard',      icon: '⚡' },
  { id: 'twin',       label: 'Digital Twin',   icon: '🏭' },
  { id: 'optimizer',  label: 'Optimizer',      icon: '📊' },
  { id: 'benchmark',  label: 'Benchmarking',   icon: '📈' },
  { id: 'compliance', label: 'Compliance',     icon: '📋' },
  { id: 'alerts',     label: 'Alerts',         icon: '🔔' },
  { id: 'onboarding', label: 'Onboarding',     icon: '➕' },
];

function Sidebar({ page, setPage, factory, factories, setFactory }) {
  return React.createElement('aside', {
    className: 'w-60 min-h-screen bg-slate-900 border-r border-slate-800 flex flex-col flex-shrink-0'
  },
    // Logo
    React.createElement('div', { className: 'px-5 py-5 border-b border-slate-800' },
      React.createElement('div', { className: 'flex items-center gap-2 mb-1' },
        React.createElement('span', { className: 'text-2xl' }, '🏭'),
        React.createElement('span', { className: 'text-lg font-bold text-green-400' }, 'SME-Twin')
      ),
      React.createElement('p', { className: 'text-xs text-slate-500' }, 'Zero-Hardware Energy Intel')
    ),
    // Factory selector
    React.createElement('div', { className: 'px-4 py-3 border-b border-slate-800' },
      React.createElement('label', { className: 'text-xs text-slate-500 font-medium uppercase tracking-wide block mb-1' }, 'Active Factory'),
      React.createElement('select', {
        className: 'w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2',
        value: factory?.id || '',
        onChange: e => { const f = factories.find(x => x.id === e.target.value); if(f) setFactory(f); }
      },
        factories.length === 0 && React.createElement('option', { value: '' }, 'No factory — onboard first'),
        factories.map(f => React.createElement('option', { key: f.id, value: f.id }, f.name))
      )
    ),
    // Nav
    React.createElement('nav', { className: 'flex-1 px-3 py-3 space-y-0.5' },
      NAV_ITEMS.map(item => React.createElement('button', {
        key: item.id,
        onClick: () => setPage(item.id),
        className: `w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
          ${page === item.id ? 'bg-green-900 text-green-300' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`
      }, React.createElement('span', {}, item.icon), item.label))
    ),
    // Footer
    React.createElement('div', { className: 'px-4 py-3 border-t border-slate-800' },
      React.createElement('div', { className: 'text-xs text-slate-600' }, 'SME-Twin v1.0 · SDG 7 & 9'),
      React.createElement('div', { className: 'flex items-center gap-1.5 mt-1' },
        React.createElement('div', { className: 'w-2 h-2 rounded-full bg-green-500 animate-pulse' }),
        React.createElement('span', { className: 'text-xs text-green-400' }, 'System Online')
      )
    )
  );
}

function Header({ page, factory, user, onLogout }) {
  const titles = { dashboard:'Dashboard', twin:'Digital Twin', optimizer:'Schedule Optimizer', benchmark:'Cluster Benchmarking', compliance:'Compliance & DPR', alerts:'Voice & WhatsApp Alerts', onboarding:'Factory Onboarding' };
  return React.createElement('header', {
    className: 'h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6 flex-shrink-0'
  },
    React.createElement('div', { className: 'flex items-center gap-3' },
      React.createElement('h1', { className: 'text-base font-semibold text-white' }, titles[page] || page),
      factory && React.createElement('span', { className: 'text-xs bg-slate-800 text-slate-400 px-2.5 py-1 rounded-full' }, factory.name)
    ),
    React.createElement('div', { className: 'flex items-center gap-3' },
      React.createElement('div', { className: 'text-xs text-slate-500' }, new Date().toLocaleDateString('en-IN', {day:'numeric',month:'short',year:'numeric'})),
      user && React.createElement('div', { className: 'flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-full' },
        React.createElement('span', { className: `text-xs font-medium ${user.role === 'admin' ? 'text-green-400' : 'text-blue-400'}` },
          user.role === 'admin' ? '👑' : '🔧', ' ', user.name || user.role
        )
      ),
      React.createElement('div', { className: 'flex items-center gap-1.5 bg-green-950 border border-green-800 px-3 py-1.5 rounded-full' },
        React.createElement('div', { className: 'w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse' }),
        React.createElement('span', { className: 'text-xs text-green-400 font-medium' }, 'Live')
      ),
      onLogout && React.createElement('button', {
        onClick: onLogout,
        className: 'text-xs text-slate-500 hover:text-slate-300 px-2 py-1 rounded hover:bg-slate-800 transition-colors'
      }, 'Sign out')
    )
  );
}

// ─── DASHBOARD PAGE ───────────────────────────────────────────────────────────
function DashboardPage({ factory, schedule, setPage }) {
  const f = factory || MOCK_FACTORY;
  const s = schedule || MOCK_SCHEDULE;
  const bill = f.latest_bill || MOCK_FACTORY.latest_bill;
  const cal = f.latest_calibration || MOCK_FACTORY.latest_calibration;

  // Energy breakdown pie data
  const totalKw = f.machines.reduce((sum, m) => sum + m.rated_kw, 0);
  const pieData = f.machines.map((m, i) => ({
    name: m.name, value: Math.round(m.rated_kw / totalKw * 100), kw: m.rated_kw
  }));

  // 24-hour load curve
  const hourlyData = Array.from({ length: 24 }, (_, h) => {
    const label = h < 12 ? `${h||12}${h<12?'am':'pm'}` : `${h===12?12:h-12}pm`;
    let baseline = 0, optimized = 0;
    f.machines.forEach(m => {
      const dc = cal?.calibrated_duty_cycles?.[m.id] || 0.6;
      baseline += m.rated_kw * (h >= 6 && h < 22 ? dc * 1.2 : dc * 0.5);
      optimized += m.rated_kw * (s?.hourly_schedule?.[m.id]?.[h] ?? (h >= 6 && h < 22 ? dc * 0.9 : dc * 0.4));
    });
    return { h: label, baseline: Math.round(baseline), optimized: Math.round(optimized) };
  });

  const monthlySavings = (s.estimated_daily_savings || 9420) * 30;
  const co2Ton = ((bill.total_kwh || 84200) * 0.82 / 1000).toFixed(1);
  const monthlyBill = (bill.total_kwh || 84200) * 8.5;

  const recommendations = [
    { action: 'Shift Dyeing Vat to 10 PM–8 AM', saving: 10260, impact: 'HIGH', icon: '💧' },
    { action: 'Stagger Air Compressor start-ups by 15 min', saving: 3800, impact: 'MEDIUM', icon: '💨' },
    { action: 'Power factor correction capacitor bank', saving: 2100, impact: 'MEDIUM', icon: '⚡' },
  ];

  return React.createElement('div', { className: 'space-y-6' },
    // KPI row
    React.createElement('div', { className: 'grid grid-cols-2 lg:grid-cols-4 gap-4' },
      React.createElement(KpiCard, { label:'Monthly Bill', value: inr(monthlyBill), sub:'September 2026', trend:'down', icon:'💰', color:'amber' }),
      React.createElement(KpiCard, { label:'Simulated Savings', value: inr(monthlySavings), sub:`${fmt(s.savings_percent)}% reduction`, trend:'up', icon:'📉', color:'green' }),
      React.createElement(KpiCard, { label:'Carbon Footprint', value: `${co2Ton} tCO₂`, sub:'This month · CEA factor', icon:'🌱', color:'blue' }),
      React.createElement(KpiCard, { label:'Twin Accuracy', value: `${fmt(cal?.simulation_error_pct || 3.2)}% error`, sub:'Calibrated 3 Oct 2026', icon:'🎯', color:'green' })
    ),

    // Charts row
    React.createElement('div', { className: 'grid grid-cols-1 lg:grid-cols-3 gap-4' },
      // Load curve
      React.createElement(Card, { className: 'lg:col-span-2' },
        React.createElement(SectionHeader, { title:'24-Hour Load Profile', subtitle:'Baseline vs. Optimised schedule (kW)' }),
        React.createElement(ResponsiveContainer, { width:'100%', height: 220 },
          React.createElement(LineChart, { data: hourlyData, margin:{top:5,right:10,left:-10,bottom:0} },
            React.createElement(CartesianGrid, { strokeDasharray:'3 3', stroke:'#1e293b' }),
            React.createElement(XAxis, { dataKey:'h', tick:{fill:'#64748b', fontSize:11} }),
            React.createElement(YAxis, { tick:{fill:'#64748b', fontSize:11} }),
            React.createElement(Tooltip, { contentStyle:{background:'#1e293b',border:'1px solid #334155',borderRadius:'8px'}, labelStyle:{color:'#94a3b8'} }),
            React.createElement(Legend, { wrapperStyle:{fontSize:'12px'} }),
            React.createElement(ReferenceLine, { x:'6pm', stroke:'#ef4444', strokeDasharray:'4 4', label:{value:'Peak',fill:'#ef4444',fontSize:11} }),
            React.createElement(Line, { type:'monotone', dataKey:'baseline', stroke:'#94a3b8', strokeWidth:2, dot:false, name:'Baseline' }),
            React.createElement(Line, { type:'monotone', dataKey:'optimized', stroke:BRAND_LIGHT, strokeWidth:2.5, dot:false, name:'Optimised' })
          )
        )
      ),
      // Pie chart
      React.createElement(Card, {},
        React.createElement(SectionHeader, { title:'Energy Breakdown', subtitle:'Estimated per-machine share' }),
        React.createElement(ResponsiveContainer, { width:'100%', height:180 },
          React.createElement(PieChart, {},
            React.createElement(Pie, { data: pieData, cx:'50%', cy:'50%', innerRadius:50, outerRadius:75, dataKey:'value', paddingAngle:2 },
              pieData.map((_, i) => React.createElement(Cell, { key:i, fill: COLORS[i % COLORS.length] }))
            ),
            React.createElement(Tooltip, { formatter:(v,n)=>[`${v}%`,n], contentStyle:{background:'#1e293b',border:'1px solid #334155',borderRadius:'8px'} })
          )
        ),
        React.createElement('div', { className: 'flex flex-wrap gap-1.5 mt-2' },
          pieData.slice(0,4).map((d,i) => React.createElement('div', { key:i, className:'flex items-center gap-1 text-xs text-slate-400' },
            React.createElement('div', { className:'w-2.5 h-2.5 rounded-sm flex-shrink-0', style:{background:COLORS[i]} }),
            d.name.split(' ')[0]
          ))
        )
      )
    ),

    // Recommendations + SDG
    React.createElement('div', { className: 'grid grid-cols-1 lg:grid-cols-3 gap-4' },
      React.createElement(Card, { className: 'lg:col-span-2' },
        React.createElement(SectionHeader, { title:'Top Recommendations', subtitle:'Run the Optimizer to get detailed schedules' }),
        React.createElement('div', { className: 'space-y-3' },
          recommendations.map((r, i) => React.createElement('div', { key:i, className:'flex items-center justify-between bg-slate-800 rounded-lg px-4 py-3' },
            React.createElement('div', { className:'flex items-center gap-3' },
              React.createElement('span', { className:'text-xl' }, r.icon),
              React.createElement('div', {},
                React.createElement('div', { className:'text-sm font-medium text-slate-200' }, r.action),
                React.createElement('div', { className:'text-xs text-slate-500 mt-0.5' }, `Est. ${inr(r.saving)}/month savings`)
              )
            ),
            React.createElement(Badge, { color: r.impact==='HIGH' ? 'red' : 'amber' }, r.impact)
          ))
        )
      ),
      React.createElement(Card, {},
        React.createElement(SectionHeader, { title:'SDG Impact', subtitle:'Sustainable Development Goals' }),
        React.createElement('div', { className: 'space-y-4' },
          React.createElement('div', {},
            React.createElement('div', { className:'flex items-center justify-between mb-1.5' },
              React.createElement('span', { className:'text-sm font-medium text-amber-300' }, '⚡ SDG 7 — Clean Energy'),
              React.createElement('span', { className:'text-xs text-slate-400' }, '68%')
            ),
            React.createElement('div', { className:'w-full bg-slate-800 rounded-full h-2' },
              React.createElement('div', { className:'bg-amber-400 h-2 rounded-full', style:{width:'68%'} })
            ),
            React.createElement('p', { className:'text-xs text-slate-500 mt-1' }, 'Energy efficiency improvement vs. baseline')
          ),
          React.createElement('div', {},
            React.createElement('div', { className:'flex items-center justify-between mb-1.5' },
              React.createElement('span', { className:'text-sm font-medium text-blue-300' }, '🏭 SDG 9 — Industry Innovation'),
              React.createElement('span', { className:'text-xs text-slate-400' }, '54%')
            ),
            React.createElement('div', { className:'w-full bg-slate-800 rounded-full h-2' },
              React.createElement('div', { className:'bg-blue-400 h-2 rounded-full', style:{width:'54%'} })
            ),
            React.createElement('p', { className:'text-xs text-slate-500 mt-1' }, 'Digitisation & smart scheduling adoption')
          )
        ),
        React.createElement('div', { className:'mt-4 pt-3 border-t border-slate-800' },
          React.createElement('p', { className:'text-xs text-slate-500' }, 'Monthly CO₂ avoided: '),
          React.createElement('p', { className:'text-lg font-bold text-green-400' }, `${((monthlySavings / 8.5) * 0.82 / 1000).toFixed(1)} tCO₂`)
        )
      )
    ),

    // Activity feed
    React.createElement(Card, {},
      React.createElement(SectionHeader, { title:'Recent Activity' }),
      React.createElement('div', { className:'space-y-2' },
        [
          { time:'2026-10-01 08:30', event:'Twin calibrated — error 3.2%', icon:'🎯', color:'green' },
          { time:'2026-09-30 14:12', event:'Bill uploaded — Sep 2026 (84,200 kWh)', icon:'📄', color:'blue' },
          { time:'2026-09-28 09:00', event:'WhatsApp alert sent to supervisor — Marathi', icon:'💬', color:'green' },
          { time:'2026-09-25 11:45', event:'Optimization run — ₹34,200/month savings identified', icon:'📊', color:'amber' },
        ].map((a,i) => React.createElement('div', { key:i, className:'flex items-center gap-3 text-sm' },
          React.createElement('span', {}, a.icon),
          React.createElement('span', { className:'text-slate-400 text-xs w-36 flex-shrink-0' }, a.time),
          React.createElement('span', { className:'text-slate-300' }, a.event)
        ))
      )
    )
  );
}

// ─── DIGITAL TWIN PAGE ────────────────────────────────────────────────────────
function TwinPage({ factory, onCalibrate, calibrating }) {
  const f = factory || MOCK_FACTORY;
  const cal = f.latest_calibration || MOCK_FACTORY.latest_calibration;
  const dc = cal?.calibrated_duty_cycles || {};

  // Color based on duty cycle efficiency
  const machineColor = (id, rated_kw) => {
    const d = dc[id] || 0.6;
    if (d > 0.8) return { fill:'#7f1d1d', stroke:'#ef4444', glow:'#ef444466' };
    if (d > 0.6) return { fill:'#78350f', stroke:'#f59e0b', glow:'#f59e0b44' };
    return { fill:'#14532d', stroke:'#22c55e', glow:'#22c55e44' };
  };

  const machines = f.machines;
  const totalEstKwh = machines.reduce((s,m) => s + m.rated_kw * 720 * (dc[m.id]||0.6), 0);

  // SVG Factory floor layout — top-down plan of a small spinning mill
  function FactoryFloor() {
    const [hovered, setHovered] = useState(null);
    const layout = [
      { id:'m1', label:'Ring Frame #1', x:60,  y:60,  w:110, h:55 },
      { id:'m2', label:'Ring Frame #2', x:60,  y:130, w:110, h:55 },
      { id:'m3', label:'Ring Frame #3', x:60,  y:200, w:110, h:55 },
      { id:'m4', label:'Ring Frame #4', x:60,  y:270, w:110, h:55 },
      { id:'m5', label:'Compressor A',  x:230, y:60,  w:90,  h:55 },
      { id:'m6', label:'Compressor B',  x:230, y:130, w:90,  h:55 },
      { id:'m7', label:'Dyeing Vat',    x:230, y:200, w:90,  h:80 },
      { id:'m8', label:'Utility Pump',  x:230, y:300, w:90,  h:45 },
      { id:'m9', label:'Lighting',      x:380, y:60,  w:80,  h:290 },
    ];
    const hm = hovered ? machines.find(m => m.id === hovered) : null;
    const hcol = hovered ? machineColor(hovered, hm?.rated_kw) : null;

    return React.createElement('div', { className:'relative' },
      React.createElement('svg', { viewBox:'0 0 540 390', className:'w-full rounded-xl border border-slate-700', style:{background:'#0f172a'} },
        // Grid floor
        React.createElement('defs', {},
          React.createElement('pattern', { id:'grid', width:20, height:20, patternUnits:'userSpaceOnUse' },
            React.createElement('path', { d:'M 20 0 L 0 0 0 20', fill:'none', stroke:'#1e293b', strokeWidth:'0.5' })
          )
        ),
        React.createElement('rect', { width:540, height:390, fill:'url(#grid)' }),
        // Factory boundary
        React.createElement('rect', { x:30, y:30, width:480, height:330, rx:8, fill:'none', stroke:'#334155', strokeWidth:1.5, strokeDasharray:'6 3' }),
        // Power feed line
        React.createElement('line', { x1:0, y1:195, x2:30, y2:195, stroke:'#22c55e', strokeWidth:2 }),
        React.createElement('text', { x:2, y:188, fill:'#22c55e', fontSize:9 }, 'GRID'),
        // Buses
        React.createElement('line', { x1:30, y1:60, x2:30, y2:340, stroke:'#334155', strokeWidth:3 }),
        React.createElement('line', { x1:30, y1:88, x2:60, y2:88, stroke:'#334155', strokeWidth:1.5 }),
        React.createElement('line', { x1:30, y1:158, x2:60, y2:158, stroke:'#334155', strokeWidth:1.5 }),
        React.createElement('line', { x1:30, y1:228, x2:60, y2:228, stroke:'#334155', strokeWidth:1.5 }),
        React.createElement('line', { x1:30, y1:298, x2:60, y2:298, stroke:'#334155', strokeWidth:1.5 }),
        React.createElement('line', { x1:30, y1:88, x2:230, y2:88, stroke:'#334155', strokeWidth:1.5 }),
        React.createElement('line', { x1:30, y1:228, x2:380, y2:228, stroke:'#334155', strokeWidth:1.5 }),

        // Machines
        ...layout.map(m => {
          const machine = machines.find(x => x.id === m.id);
          const col = machineColor(m.id, machine?.rated_kw);
          const d = dc[m.id] || (machine?.process_type === 'continuous' ? 1.0 : 0.6);
          const isHov = hovered === m.id;
          return React.createElement('g', { key: m.id, style:{cursor:'pointer'}, onMouseEnter:()=>setHovered(m.id), onMouseLeave:()=>setHovered(null) },
            // Glow
            React.createElement('rect', { x:m.x-4, y:m.y-4, width:m.w+8, height:m.h+8, rx:6, fill:col.glow, opacity: isHov ? 0.9 : 0.5 }),
            // Body
            React.createElement('rect', { x:m.x, y:m.y, width:m.w, height:m.h, rx:4, fill:col.fill, stroke:col.stroke, strokeWidth: isHov ? 2 : 1 }),
            // Label
            React.createElement('text', { x:m.x+m.w/2, y:m.y+m.h/2-6, textAnchor:'middle', fill:'#f1f5f9', fontSize:9, fontWeight:600 }, m.label),
            React.createElement('text', { x:m.x+m.w/2, y:m.y+m.h/2+6, textAnchor:'middle', fill:col.stroke, fontSize:9 }, `${Math.round(d*100)}% duty`),
            machine && React.createElement('text', { x:m.x+m.w/2, y:m.y+m.h/2+17, textAnchor:'middle', fill:'#94a3b8', fontSize:8 }, `${machine.rated_kw} kW`)
          );
        }),

        // Animated energy dots
        React.createElement('circle', { r:3, fill:'#22c55e', opacity:0.9 },
          React.createElement('animateMotion', { dur:'3s', repeatCount:'indefinite', path:'M 0 195 L 30 88 L 115 88' })
        ),
        React.createElement('circle', { r:3, fill:'#22c55e', opacity:0.7 },
          React.createElement('animateMotion', { dur:'4s', repeatCount:'indefinite', path:'M 0 195 L 30 228 L 275 228' })
        ),
        React.createElement('circle', { r:2.5, fill:'#f59e0b', opacity:0.8 },
          React.createElement('animateMotion', { dur:'3.5s', repeatCount:'indefinite', path:'M 30 195 L 30 60 L 380 60 L 420 195' })
        ),

        // Title
        React.createElement('text', { x:30, y:375, fill:'#475569', fontSize:9 }, 'SME-Twin · Shree Ganesh Textiles, Surat · Spinning Mill Floor Plan (Top View)')
      ),
      // Hover tooltip
      hovered && hm && React.createElement('div', { className:'absolute top-2 right-2 bg-slate-800 border border-slate-700 rounded-lg p-3 text-xs max-w-48 shadow-xl pointer-events-none' },
        React.createElement('div', { className:'font-semibold text-white mb-1' }, hm.name),
        React.createElement('div', { className:'space-y-0.5 text-slate-400' },
          React.createElement('div', {}, `Rated: ${hm.rated_kw} kW`),
          React.createElement('div', {}, `Duty cycle: ${Math.round((dc[hm.id]||0.6)*100)}%`),
          React.createElement('div', {}, `Est. monthly: ${Math.round(hm.rated_kw * 720 * (dc[hm.id]||0.6)).toLocaleString('en-IN')} kWh`),
          React.createElement('div', {}, `% of bill: ${((hm.rated_kw * 720 * (dc[hm.id]||0.6)) / totalEstKwh * 100).toFixed(1)}%`),
          React.createElement('div', {}, `Type: ${hm.process_type}`)
        )
      )
    );
  }

  return React.createElement('div', { className:'space-y-5' },
    React.createElement('div', { className:'grid grid-cols-1 lg:grid-cols-3 gap-4' },
      // Factory floor SVG
      React.createElement(Card, { className:'lg:col-span-2' },
        React.createElement('div', { className:'flex items-center justify-between mb-3' },
          React.createElement(SectionHeader, { title:'Factory Floor — Digital Twin', subtitle:'Hover machines for details · Colors: 🟢 efficient · 🟡 moderate · 🔴 high use' }),
          React.createElement(Btn, { onClick:onCalibrate, loading:calibrating, variant:'primary' }, '⚙ Calibrate Twin')
        ),
        React.createElement(FactoryFloor)
      ),
      // Calibration panel
      React.createElement('div', { className:'space-y-4' },
        React.createElement(Card, {},
          React.createElement(SectionHeader, { title:'Calibration Status' }),
          React.createElement('div', { className:'space-y-2' },
            React.createElement('div', { className:'flex justify-between text-sm' },
              React.createElement('span', { className:'text-slate-400' }, 'Simulation Error'),
              React.createElement('span', { className:'font-semibold text-green-400' }, `${fmt(cal?.simulation_error_pct||3.2)}%`)
            ),
            React.createElement('div', { className:'flex justify-between text-sm' },
              React.createElement('span', { className:'text-slate-400' }, 'Confidence Band'),
              React.createElement('span', { className:'text-slate-300' }, '± 4.1%')
            ),
            React.createElement('div', { className:'flex justify-between text-sm' },
              React.createElement('span', { className:'text-slate-400' }, 'Last Calibrated'),
              React.createElement('span', { className:'text-slate-300' }, '1 Oct 2026')
            ),
            React.createElement('div', { className:'flex justify-between text-sm' },
              React.createElement('span', { className:'text-slate-400' }, 'Machines in twin'),
              React.createElement('span', { className:'text-slate-300' }, f.machines.length)
            )
          )
        ),
        // Calibration flow diagram
        React.createElement(Card, {},
          React.createElement(SectionHeader, { title:'Calibration Loop' }),
          React.createElement('div', { className:'space-y-2' },
            [
              { step:'1', label:'Start with reasonable guess', sub:'Initial duty cycle = bill kWh / rated capacity', color:'slate' },
              { step:'2', label:'Simulate full month', sub:'Sum all machine-hours × rated kW', color:'blue' },
              { step:'3', label:'Compare to real bill', sub:'Match simulated total to billed kWh', color:'amber' },
              { step:'✓', label:'Twin calibrated & ready', sub:`Current error: ${fmt(cal?.simulation_error_pct||3.2)}%`, color:'green' },
            ].map((s,i) => React.createElement('div', { key:i, className:'flex gap-3 items-start' },
              React.createElement('div', { className:`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold mt-0.5
                ${s.color==='green'?'bg-green-700 text-green-100':s.color==='blue'?'bg-blue-800 text-blue-200':s.color==='amber'?'bg-amber-800 text-amber-200':'bg-slate-700 text-slate-300'}` }, s.step),
              React.createElement('div', {},
                React.createElement('div', { className:'text-sm font-medium text-slate-200' }, s.label),
                React.createElement('div', { className:'text-xs text-slate-500' }, s.sub)
              )
            ))
          )
        )
      )
    ),
    // Machine table
    React.createElement(Card, {},
      React.createElement(SectionHeader, { title:'Machine Inventory & Calibrated Duty Cycles' }),
      React.createElement('div', { className:'overflow-x-auto' },
        React.createElement('table', { className:'w-full text-sm' },
          React.createElement('thead', {},
            React.createElement('tr', { className:'text-xs text-slate-500 border-b border-slate-800' },
              ['Machine', 'Rated kW', 'Type', 'Duty Cycle', 'Est. Monthly kWh', 'Share of Bill', 'Status'].map(h =>
                React.createElement('th', { key:h, className:'text-left py-2 px-3 font-medium' }, h)
              )
            )
          ),
          React.createElement('tbody', {},
            f.machines.map(m => {
              const d = dc[m.id] || 0.6;
              const estKwh = Math.round(m.rated_kw * 720 * d);
              const share = (estKwh / totalEstKwh * 100).toFixed(1);
              const col = machineColor(m.id, m.rated_kw);
              return React.createElement('tr', { key:m.id, className:'border-b border-slate-800/50 hover:bg-slate-800/30' },
                React.createElement('td', { className:'py-2.5 px-3 font-medium text-slate-200' }, m.name),
                React.createElement('td', { className:'py-2.5 px-3 text-slate-400' }, m.rated_kw),
                React.createElement('td', { className:'py-2.5 px-3' }, React.createElement(Badge, { color: m.process_type==='continuous'?'blue':'slate' }, m.process_type)),
                React.createElement('td', { className:'py-2.5 px-3' },
                  React.createElement('div', { className:'flex items-center gap-2' },
                    React.createElement('div', { className:'w-20 bg-slate-800 rounded-full h-1.5' },
                      React.createElement('div', { className:'h-1.5 rounded-full', style:{width:`${d*100}%`, background:col.stroke} })
                    ),
                    React.createElement('span', { style:{color:col.stroke}, className:'text-xs font-medium' }, `${Math.round(d*100)}%`)
                  )
                ),
                React.createElement('td', { className:'py-2.5 px-3 text-slate-300' }, estKwh.toLocaleString('en-IN')),
                React.createElement('td', { className:'py-2.5 px-3 text-slate-300' }, `${share}%`),
                React.createElement('td', { className:'py-2.5 px-3' },
                  React.createElement(Badge, { color: d>0.8?'red':d>0.6?'amber':'green' }, d>0.8?'High Use':d>0.6?'Moderate':'Efficient')
                )
              );
            })
          )
        )
      )
    )
  );
}

// ─── OPTIMIZER PAGE ───────────────────────────────────────────────────────────
function OptimizerPage({ factory, schedule, onOptimize, optimizing }) {
  const f = factory || MOCK_FACTORY;
  const s = schedule || MOCK_SCHEDULE;
  const cal = f.latest_calibration || MOCK_FACTORY.latest_calibration;

  // Tariff periods for 24 hours
  const tariff = Array.from({length:24}, (_,h) => ({
    h, label: h < 10 ? `0${h}:00` : `${h}:00`,
    period: h < 6 ? 'Off-Peak' : h >= 18 && h < 22 ? 'Peak' : 'Shoulder',
    rate: h < 6 ? 5.2 : h >= 18 && h < 22 ? 11.8 : 8.5,
  }));
  const periodColor = p => p==='Peak'?'#ef4444':p==='Shoulder'?'#f59e0b':'#22c55e';

  // Cost comparison
  const savings = s.estimated_daily_savings || 9420;
  const monthlyProj = savings * 30;
  const annualProj = savings * 365;

  // Build Gantt data
  const ganttMachines = f.machines.filter(m => m.process_type === 'shiftable');
  const scheduleMap = s.hourly_schedule || {};

  const changes = [
    { machine:'Dyeing Vat', from:'2 PM–12 AM', to:'10 PM–8 AM', saving: 10260, reason:'Moved entirely to off-peak window' },
    { machine:'Air Compressor A', from:'6 AM–10 PM', to:'12 AM–6 AM, 9 PM–11 PM', saving: 3420, reason:'Split across two off-peak windows' },
    { machine:'Utility Pump', from:'8 AM–8 PM', to:'10 PM–4 AM', saving: 2740, reason:'Shifted to lowest-tariff hours (₹5.2/kWh)' },
  ];

  return React.createElement('div', { className:'space-y-5' },
    // Header actions
    React.createElement('div', { className:'flex items-center justify-between' },
      React.createElement('div', {},
        React.createElement('h3', { className:'text-sm text-slate-400' }, 'MILP-based constrained scheduling · Production throughput held fixed'),
      ),
      React.createElement(Btn, { onClick:onOptimize, loading:optimizing, variant:'primary' }, '▶ Run Optimization')
    ),

    // Savings summary
    React.createElement('div', { className:'grid grid-cols-2 lg:grid-cols-4 gap-4' },
      React.createElement(KpiCard, { label:'Daily Savings', value: inr(savings), sub:'vs. unoptimised baseline', trend:'up', icon:'💰', color:'green' }),
      React.createElement(KpiCard, { label:'Monthly Projection', value: inr(monthlyProj), sub:`${fmt(s.savings_percent)}% reduction`, trend:'up', icon:'📉', color:'green' }),
      React.createElement(KpiCard, { label:'Annual Projection', value: inr(annualProj), sub:'Zero hardware cost', icon:'🏦', color:'blue' }),
      React.createElement(KpiCard, { label:'CO₂ Reduction', value: `${((savings/8.5)*0.82).toFixed(0)} kg/day`, sub:'By shifting to off-peak', icon:'🌱', color:'blue' })
    ),

    // Tariff heatmap strip
    React.createElement(Card, {},
      React.createElement(SectionHeader, { title:'Tariff Heatmap (24h)', subtitle:'Red=Peak (₹11.8), Yellow=Shoulder (₹8.5), Green=Off-Peak (₹5.2) per kWh' }),
      React.createElement('div', { className:'flex gap-0.5 h-10 rounded-lg overflow-hidden' },
        tariff.map(t => React.createElement('div', {
          key:t.h, className:'flex-1 flex items-end justify-center pb-1',
          style:{background: t.period==='Peak'?'#450a0a':t.period==='Shoulder'?'#422006':'#052e16'},
          title:`${t.label} — ${t.period} ₹${t.rate}/kWh`
        }, React.createElement('span', { className:'text-slate-500', style:{fontSize:'8px'} }, t.h%6===0?t.h:'') ))
      ),
      React.createElement('div', { className:'flex gap-4 mt-2 text-xs' },
        [['Off-Peak (12–6am)','#22c55e'],['Shoulder (6am–6pm, 10pm–12am)','#f59e0b'],['Peak (6–10pm)','#ef4444']].map(([l,c]) =>
          React.createElement('div', { key:l, className:'flex items-center gap-1.5' },
            React.createElement('div', { className:'w-3 h-3 rounded', style:{background:c} }),
            React.createElement('span', { className:'text-slate-400' }, l)
          )
        )
      )
    ),

    // Gantt chart
    React.createElement(Card, {},
      React.createElement(SectionHeader, { title:'Optimised 24-Hour Schedule', subtitle:'Each row = one machine · Green blocks = ON during off-peak · Red = ON during peak' }),
      React.createElement('div', { className:'overflow-x-auto' },
        React.createElement('div', { className:'min-w-max' },
          // Hour header
          React.createElement('div', { className:'flex' },
            React.createElement('div', { className:'w-36 flex-shrink-0' }),
            tariff.map(t => React.createElement('div', { key:t.h, className:'w-8 text-center text-xs text-slate-600 pb-1', style:{color:periodColor(t.period)} }, t.h%3===0?t.h:''))
          ),
          // Rows
          ganttMachines.map(m => {
            const dc_val = cal?.calibrated_duty_cycles?.[m.id] || 0.6;
            const sched = scheduleMap[m.id] || Array.from({length:24}, (_,h) => h>=6 && h<22 ? 1 : 0);
            return React.createElement('div', { key:m.id, className:'flex items-center mb-1' },
              React.createElement('div', { className:'w-36 flex-shrink-0 text-xs text-slate-400 pr-2 truncate' }, m.name),
              tariff.map(t => {
                const on = sched[t.h] === 1;
                const bg = on ? (t.period==='Peak'?'#7f1d1d':t.period==='Shoulder'?'#78350f':'#14532d') : '#1e293b';
                const border = on ? (t.period==='Peak'?'#ef4444':t.period==='Shoulder'?'#f59e0b':'#22c55e') : 'transparent';
                return React.createElement('div', { key:t.h, className:'w-8 h-6 rounded-sm mx-0.5 border', style:{background:bg, borderColor:border} });
              })
            );
          })
        )
      ),
      React.createElement('div', { className:'flex gap-4 mt-3 text-xs' },
        [['ON (Off-Peak)','#14532d','#22c55e'],['ON (Shoulder)','#78350f','#f59e0b'],['ON (Peak)','#7f1d1d','#ef4444'],['OFF','#1e293b','#334155']].map(([l,bg,border]) =>
          React.createElement('div', { key:l, className:'flex items-center gap-1.5' },
            React.createElement('div', { className:'w-5 h-4 rounded-sm border', style:{background:bg, borderColor:border} }),
            React.createElement('span', { className:'text-slate-400' }, l)
          )
        )
      )
    ),

    // Before/After + changes
    React.createElement('div', { className:'grid grid-cols-1 lg:grid-cols-2 gap-4' },
      React.createElement(Card, {},
        React.createElement(SectionHeader, { title:'Cost Comparison' }),
        React.createElement(ResponsiveContainer, { width:'100%', height:200 },
          React.createElement(BarChart, { data:[{name:'Baseline', cost:s.baseline_daily_cost||67840},{name:'Optimised', cost:s.optimized_daily_cost||58420}], margin:{top:5,right:10,left:0,bottom:0} },
            React.createElement(CartesianGrid, { strokeDasharray:'3 3', stroke:'#1e293b' }),
            React.createElement(XAxis, { dataKey:'name', tick:{fill:'#64748b'} }),
            React.createElement(YAxis, { tick:{fill:'#64748b',fontSize:11} }),
            React.createElement(Tooltip, { formatter:v=>[`₹${v.toLocaleString('en-IN')}`,'Daily Cost'], contentStyle:{background:'#1e293b',border:'1px solid #334155',borderRadius:'8px'} }),
            React.createElement(Bar, { dataKey:'cost', fill:'#334155', radius:[4,4,0,0] },
              React.createElement(Cell, { fill:'#64748b' }),
              React.createElement(Cell, { fill:BRAND })
            )
          )
        )
      ),
      React.createElement(Card, {},
        React.createElement(SectionHeader, { title:'Key Schedule Changes', subtitle:'Plain-English recommendations' }),
        React.createElement('div', { className:'space-y-3' },
          changes.map((c,i) => React.createElement('div', { key:i, className:'bg-slate-800 rounded-lg p-3' },
            React.createElement('div', { className:'flex justify-between items-start mb-1' },
              React.createElement('span', { className:'text-sm font-semibold text-green-400' }, c.machine),
              React.createElement('span', { className:'text-xs text-green-300 font-medium' }, `+${inr(c.saving)}/mo`)
            ),
            React.createElement('div', { className:'text-xs text-slate-400' }, `${c.from} → ${c.to}`),
            React.createElement('div', { className:'text-xs text-slate-500 mt-0.5' }, c.reason)
          ))
        )
      )
    )
  );
}

// ─── BENCHMARKING PAGE ────────────────────────────────────────────────────────
function BenchmarkPage({ factory }) {
  const [sector, setSector] = useState('textile');
  const [data, setData] = useState(MOCK_BENCHMARK);
  const [loading, setLoading] = useState(false);
  const f = factory || MOCK_FACTORY;

  const load = useCallback(async (s) => {
    setLoading(true);
    try {
      const res = await api.get(`/benchmark/cluster?sector=${s}`);
      // Inject current factory
      const bill = f.latest_bill || MOCK_FACTORY.latest_bill;
      const cal = f.latest_calibration || MOCK_FACTORY.latest_calibration;
      const myKwh = bill.total_kwh || 84200;
      const myProd = 26000; // kg/month mock
      const mySec = +(myKwh / myProd).toFixed(3);
      setData([...res, { id:'YOU', sec_kwh_per_unit:mySec, sector:s, monthly_kwh:myKwh, is_current_factory:true }]);
    } catch {
      const bill = f.latest_bill || MOCK_FACTORY.latest_bill;
      const mySec = +((bill.total_kwh||84200) / 26000).toFixed(3);
      setData([...MOCK_BENCHMARK.map(d=>({...d,sector:s})), { id:'YOU', sec_kwh_per_unit:mySec, sector:s, monthly_kwh:bill.total_kwh||84200, is_current_factory:true }]);
    } finally { setLoading(false); }
  }, [f]);

  useEffect(() => { load(sector); }, [sector]);

  const sorted = [...data].sort((a,b) => a.sec_kwh_per_unit - b.sec_kwh_per_unit);
  const me = data.find(d => d.is_current_factory);
  const mySec = me?.sec_kwh_per_unit || 3.24;
  const avg = data.reduce((s,d) => s + d.sec_kwh_per_unit, 0) / data.length;
  const rank = sorted.findIndex(d => d.is_current_factory);
  const percentile = Math.round((rank / sorted.length) * 100);
  const vsAvg = ((mySec - avg) / avg * 100).toFixed(1);

  const barData = sorted.map(d => ({
    name: d.id, sec: d.sec_kwh_per_unit, fill: d.is_current_factory ? '#22c55e' : '#334155'
  }));

  const sectors = ['textile','foundry','ceramic','food'];

  return React.createElement('div', { className:'space-y-5' },
    // Controls
    React.createElement('div', { className:'flex items-center gap-4' },
      React.createElement('label', { className:'text-sm text-slate-400' }, 'Sector:'),
      React.createElement('select', {
        className:'bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2',
        value:sector, onChange:e=>setSector(e.target.value)
      }, sectors.map(s => React.createElement('option', { key:s, value:s }, s.charAt(0).toUpperCase()+s.slice(1))))
    ),

    // KPI row
    React.createElement('div', { className:'grid grid-cols-1 lg:grid-cols-3 gap-4' },
      React.createElement(KpiCard, { label:'Your SEC', value:`${mySec} kWh/kg`, sub:'Specific Energy Consumption', icon:'⚡', color: vsAvg > 0 ? 'red' : 'green' }),
      React.createElement(KpiCard, { label:'Cluster Average', value:`${avg.toFixed(2)} kWh/kg`, sub:`${data.length} SMEs in cluster`, icon:'📊', color:'blue' }),
      React.createElement(KpiCard, { label:'Percentile Rank', value:`${percentile}th`, sub: vsAvg > 0 ? `${Math.abs(vsAvg)}% above average` : `${Math.abs(vsAvg)}% below average`, trend: vsAvg > 0 ? 'down' : 'up', icon:'🏆', color: percentile < 40 ? 'green' : percentile < 70 ? 'amber' : 'red' })
    ),

    // Bar chart
    React.createElement(Card, {},
      React.createElement(SectionHeader, { title:'Cluster SEC Comparison', subtitle:'Lower is better · Green bar = your factory · All others anonymised' }),
      loading ? React.createElement('div', { className:'flex items-center justify-center h-48' }, React.createElement(Spinner, { size:8 })) :
      React.createElement(ResponsiveContainer, { width:'100%', height:280 },
        React.createElement(BarChart, { data:barData, margin:{top:5,right:10,left:0,bottom:30} },
          React.createElement(CartesianGrid, { strokeDasharray:'3 3', stroke:'#1e293b' }),
          React.createElement(XAxis, { dataKey:'name', tick:{fill:'#64748b',fontSize:10}, angle:-45, textAnchor:'end' }),
          React.createElement(YAxis, { tick:{fill:'#64748b',fontSize:11}, label:{value:'kWh/unit', angle:-90, position:'insideLeft', fill:'#64748b',fontSize:11} }),
          React.createElement(Tooltip, { formatter:v=>[`${v} kWh/unit`,'SEC'], contentStyle:{background:'#1e293b',border:'1px solid #334155',borderRadius:'8px'} }),
          React.createElement(Bar, { dataKey:'sec', radius:[3,3,0,0] },
            barData.map((d,i) => React.createElement(Cell, { key:i, fill: d.fill }))
          ),
          React.createElement(ReferenceLine, { y:avg, stroke:'#f59e0b', strokeDasharray:'5 3', label:{value:'Avg',fill:'#f59e0b',fontSize:11} })
        )
      )
    ),

    // Insight + privacy notice
    React.createElement('div', { className:'grid grid-cols-1 lg:grid-cols-2 gap-4' },
      React.createElement(Card, {},
        React.createElement(SectionHeader, { title:'What This Means For You' }),
        React.createElement('div', { className:'space-y-3 text-sm' },
          vsAvg > 0
            ? React.createElement('div', { className:'bg-amber-950 border border-amber-800 rounded-lg p-3' },
                React.createElement('p', { className:'text-amber-300 font-medium' }, `⚠️ You use ${Math.abs(vsAvg)}% more energy per kg than cluster average`),
                React.createElement('p', { className:'text-amber-400/80 text-xs mt-1' }, 'This suggests scheduling inefficiencies or aging equipment. The SME-Twin optimizer can close this gap with zero hardware.')
              )
            : React.createElement('div', { className:'bg-green-950 border border-green-800 rounded-lg p-3' },
                React.createElement('p', { className:'text-green-300 font-medium' }, `✅ You are ${Math.abs(vsAvg)}% more efficient than cluster average`),
                React.createElement('p', { className:'text-green-400/80 text-xs mt-1' }, 'Good performance. Focus on further ToD optimization to widen the gap.')
              ),
          React.createElement('p', { className:'text-slate-400' }, 'Cluster benchmarking is your validation tool — without sensors on a single plant, comparison against many calibrated twins is the best substitute for ground truth.'),
          React.createElement('p', { className:'text-slate-400' }, `BEE/SAMEEEKSHA published SEC for ${sector} sector: ${sector==='textile'?'2.8–4.0':sector==='foundry'?'500–660':sector==='ceramic'?'1.4–2.2':'4.0–6.0'} kWh/unit`)
        )
      ),
      React.createElement(Card, {},
        React.createElement(SectionHeader, { title:'Federated Privacy Model' }),
        React.createElement('div', { className:'space-y-3' },
          React.createElement('div', { className:'bg-slate-800 rounded-lg p-3 text-sm text-slate-300' },
            React.createElement('p', { className:'font-medium text-white mb-1' }, '🔒 Raw data never leaves your factory'),
            React.createElement('p', { className:'text-xs text-slate-400' }, 'Only the calibrated model parameters (duty cycles, SEC) are shared for comparison — never machine names, production volumes, or bill amounts.')
          ),
          React.createElement('div', { className:'space-y-2 text-xs text-slate-400' },
            ['✓ Anonymised cluster IDs (SME-001, SME-002...)', '✓ Only aggregated SEC metrics shared', '✓ Bill data stays on your server', '✓ DPDP Act 2023 compliant data handling'].map((t,i) =>
              React.createElement('div', { key:i }, t)
            )
          )
        )
      )
    )
  );
}

// ─── COMPLIANCE PAGE ──────────────────────────────────────────────────────────
function CompliancePage({ factory }) {
  const f = factory || MOCK_FACTORY;
  const [dpr, setDpr] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loanCost, setLoanCost] = useState(450000);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await api.get(`/compliance/dpr/${f.id}`);
        setDpr(data);
      } catch { setDpr(MOCK_DPR); }
      finally { setLoading(false); }
    };
    load();
  }, [f.id]);

  const d = dpr || MOCK_DPR;
  const loan = d.adeetie_loan_details || MOCK_DPR.adeetie_loan_details;
  const cbam = d.cbam_footprint || MOCK_DPR.cbam_footprint;
  const fin = d.financial_analysis || MOCK_DPR.financial_analysis;
  const es = d.executive_summary || MOCK_DPR.executive_summary;

  const calcEMI = cost => Math.round(cost / 36);
  const calcSubsidy = cost => Math.round(cost * 0.04 * 3);
  const calcPayback = cost => (cost / (es.potential_annual_savings_inr||1288260) * 12).toFixed(1);

  const handlePrint = () => {
    const el = document.getElementById('dpr-printable');
    const w = window.open('', '_blank');
    w.document.write(`<html><head><title>DPR - ${d.factory_name}</title><style>body{font-family:sans-serif;padding:24px;color:#111}h1,h2,h3{color:#15803d}table{width:100%;border-collapse:collapse}td,th{border:1px solid #ddd;padding:8px;font-size:13px}th{background:#f0fdf4}@media print{.no-print{display:none}}</style></head><body>${el.innerHTML}</body></html>`);
    w.print();
  };

  if (loading) return React.createElement('div', { className:'flex items-center justify-center h-64' }, React.createElement(Spinner, { size:10 }));

  return React.createElement('div', { className:'space-y-5' },
    React.createElement('div', { className:'flex items-center justify-between' },
      React.createElement('div', {},
        React.createElement('p', { className:'text-sm text-slate-400' }, 'Auto-generated from bill OCR + calibration data · Pre-filled ADEETIE & BEE format')
      ),
      React.createElement(Btn, { onClick:handlePrint, variant:'secondary' }, '🖨 Download / Print PDF')
    ),

    React.createElement('div', { id:'dpr-printable' },
      // Executive Summary
      React.createElement(Card, {},
        React.createElement('div', { className:'flex items-center gap-3 mb-4' },
          React.createElement('div', { className:'w-10 h-10 rounded-lg bg-green-900 flex items-center justify-center text-xl' }, '📋'),
          React.createElement('div', {},
            React.createElement('h2', { className:'text-base font-bold text-white' }, `Detailed Project Report — ${d.factory_name}`),
            React.createElement('p', { className:'text-xs text-slate-400' }, `${d.factory_sector} · Generated ${new Date(d.generated_at).toLocaleDateString('en-IN')}`)
          )
        ),
        React.createElement('div', { className:'grid grid-cols-2 lg:grid-cols-4 gap-3' },
          [
            ['Annual Energy', `${((es.annual_energy_kwh||1010400)/1000).toFixed(0)} MWh`],
            ['Annual Bill', inr(es.annual_bill_inr||8588400)],
            ['Savings Potential', `${es.potential_savings_pct||15}%`],
            ['Annual Savings', inr(es.potential_annual_savings_inr||1288260)],
          ].map(([l,v]) => React.createElement('div', { key:l, className:'bg-slate-800 rounded-lg p-3' },
            React.createElement('div', { className:'text-xs text-slate-500' }, l),
            React.createElement('div', { className:'text-sm font-bold text-green-400 mt-0.5' }, v)
          ))
        )
      ),

      // Inefficiencies + Interventions
      React.createElement('div', { className:'grid grid-cols-1 lg:grid-cols-2 gap-4' },
        React.createElement(Card, {},
          React.createElement(SectionHeader, { title:'Identified Inefficiencies' }),
          React.createElement('div', { className:'space-y-2' },
            (d.identified_inefficiencies || MOCK_DPR.identified_inefficiencies || [
              { priority:'HIGH', description:'Peak-hour operations', estimated_waste_kwh:6736 },
              { priority:'HIGH', description:'Shiftable loads not optimised', estimated_waste_kwh:4210 },
              { priority:'MEDIUM', description:'Low power factor', estimated_waste_kwh:0 },
            ]).map((item,i) => React.createElement('div', { key:i, className:'flex items-start gap-2 text-sm' },
              React.createElement(Badge, { color: item.priority==='HIGH'?'red':'amber' }, item.priority),
              React.createElement('div', {},
                React.createElement('div', { className:'text-slate-200' }, item.description),
                item.estimated_waste_kwh > 0 && React.createElement('div', { className:'text-xs text-slate-500' }, `~${item.estimated_waste_kwh.toLocaleString('en-IN')} kWh/month wastage`)
              )
            ))
          )
        ),
        React.createElement(Card, {},
          React.createElement(SectionHeader, { title:'Proposed Interventions' }),
          React.createElement('div', { className:'space-y-2' },
            (d.proposed_interventions || [
              { intervention:'Load shifting to off-peak', expected_savings_inr_pa:772956, implementation_cost_inr:0, payback_months:0 },
              { intervention:'Power factor correction', expected_savings_inr_pa:257652, implementation_cost_inr:75000, payback_months:3 },
              { intervention:'IE3 motor replacement', expected_savings_inr_pa:257652, implementation_cost_inr:150000, payback_months:7 },
            ]).map((item,i) => React.createElement('div', { key:i, className:'bg-slate-800 rounded-lg p-3 text-sm' },
              React.createElement('div', { className:'flex justify-between' },
                React.createElement('span', { className:'text-slate-200 font-medium' }, item.intervention),
                React.createElement('span', { className:'text-green-400 font-semibold' }, inr(item.expected_savings_inr_pa) + '/yr')
              ),
              React.createElement('div', { className:'text-xs text-slate-500 mt-0.5' },
                item.payback_months === 0 ? '✓ Zero cost — software only' : `Cost: ${inr(item.implementation_cost_inr)} · Payback: ${item.payback_months} months`
              )
            ))
          )
        )
      ),

      // ADEETIE Loan
      React.createElement(Card, {},
        React.createElement('div', { className:'flex items-center gap-2 mb-4' },
          React.createElement('span', { className:'text-2xl' }, '🏦'),
          React.createElement(SectionHeader, { title:'ADEETIE Loan Pre-Application', subtitle:'Affordable & Dependable Energy Efficiency Technology for Indian Enterprises' })
        ),
        React.createElement('div', { className:'grid grid-cols-1 lg:grid-cols-2 gap-6' },
          React.createElement('div', { className:'space-y-3' },
            React.createElement('div', { className:'bg-green-950 border border-green-800 rounded-lg p-4' },
              React.createElement('p', { className:'text-green-300 font-semibold text-sm mb-2' }, 'Scheme Details'),
              React.createElement('div', { className:'space-y-1 text-xs text-green-400/80' },
                ['Max loan: ₹50 lakh', '4% interest subsidy', '3-year repayment', 'Eligible: Udyam-registered MSMEs'].map(t => React.createElement('div', {key:t}, '✓ '+t))
              )
            ),
            React.createElement('div', { className:'space-y-2 text-sm' },
              [
                ['Udyam Number', loan.udyam_number || f.udyam_number || 'Not registered'],
                ['Loan Amount', inr(loan.loan_amount_inr || 450000)],
                ['Interest Subsidy (3yr)', inr(loan.interest_subsidy_amount_inr || 54000)],
                ['Monthly EMI', inr(loan.monthly_emi_inr || 12500)],
              ].map(([l,v]) => React.createElement('div', { key:l, className:'flex justify-between border-b border-slate-800 pb-1' },
                React.createElement('span', { className:'text-slate-400' }, l),
                React.createElement('span', { className:'text-slate-200 font-medium' }, v)
              ))
            )
          ),
          React.createElement('div', {},
            React.createElement('p', { className:'text-sm text-slate-400 mb-3' }, 'Loan Calculator'),
            React.createElement('label', { className:'text-xs text-slate-500' }, 'Project Cost (₹)'),
            React.createElement('input', {
              type:'number', value:loanCost, onChange:e=>setLoanCost(+e.target.value),
              className:'w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 text-sm mt-1 mb-3'
            }),
            React.createElement('div', { className:'space-y-2 text-sm bg-slate-800 rounded-lg p-4' },
              [
                ['Monthly EMI', inr(calcEMI(loanCost))],
                ['4% Subsidy Amount', inr(calcSubsidy(loanCost))],
                ['Net Cost After Subsidy', inr(loanCost - calcSubsidy(loanCost))],
                ['Payback Period', `${calcPayback(loanCost)} months`],
              ].map(([l,v]) => React.createElement('div', { key:l, className:'flex justify-between' },
                React.createElement('span', { className:'text-slate-400' }, l),
                React.createElement('span', { className:'text-green-400 font-semibold' }, v)
              ))
            )
          )
        )
      ),

      // CBAM
      React.createElement(Card, {},
        React.createElement(SectionHeader, { title:'CBAM Carbon Footprint', subtitle:'EU Carbon Border Adjustment Mechanism · Scope 1+2 · CEA Grid Factor 0.82 kg CO₂/kWh' }),
        React.createElement('div', { className:'grid grid-cols-2 lg:grid-cols-4 gap-3' },
          [
            ['Scope 1 (Direct)', `0 kg CO₂`, 'green'],
            ['Scope 2 (Grid)', `${((cbam.scope2_kg_co2||828528)/1000).toFixed(0)} tCO₂/yr`, 'amber'],
            ['Total Footprint', `${cbam.total_annual_co2_ton||829} tCO₂/yr`, 'red'],
            ['Reduction Target', `${cbam.co2_reduction_ton_pa||124} tCO₂/yr`, 'green'],
          ].map(([l,v,c]) => React.createElement('div', { key:l, className:'bg-slate-800 rounded-lg p-3 text-center' },
            React.createElement('div', { className:'text-xs text-slate-500 mb-1' }, l),
            React.createElement('div', { className:`text-sm font-bold ${c==='green'?'text-green-400':c==='amber'?'text-amber-400':'text-red-400'}` }, v)
          ))
        ),
        React.createElement('p', { className:'text-xs text-slate-500 mt-3' }, 'CEA grid emission factor 2023: 0.82 kg CO₂/kWh · Applicable for textile, steel, cement, aluminium, fertiliser exports to EU')
      )
    )
  );
}

// ─── ALERTS PAGE ──────────────────────────────────────────────────────────────
function AlertsPage({ factory }) {
  const f = factory || MOCK_FACTORY;
  const [lang, setLang] = useState('hindi');
  const [sending, setSending] = useState(false);
  const [sendWA, setSendWA] = useState(false);
  const [alertHistory, setAlertHistory] = useState([
    { ts:'2026-10-04 07:00', msg:'आज रात 10 बजे के बाद पंप चलाएं', channel:'WhatsApp+Voice', status:'Delivered' },
    { ts:'2026-10-03 07:00', msg:'डाइंग वैट शाम 11 बजे के बाद चलाएं', channel:'WhatsApp', status:'Delivered' },
    { ts:'2026-10-02 07:00', msg:'कम्प्रेसर स्टार्ट 15 मिनट देर से करें', channel:'Voice', status:'Delivered' },
  ]);
  const [scheduleTime, setScheduleTime] = useState('07:00');

  const MESSAGES = {
    hindi: {
      today: 'आज रात 10 बजे के बाद पंप चलाएं — ₹800 की बचत होगी',
      saving: '₹800',
      action: 'पंप को रात 10 बजे के बाद चलाएं',
      wa: 'नमस्ते! SME-Twin से ऊर्जा सलाह:\n\n⚡ *आज की सिफारिश:*\nडाइंग वैट रात 10 बजे के बाद चलाएं\n\n💰 बचत: *₹800 आज*\n📅 महीने में: *₹24,000*\n\n— SME-Twin ऊर्जा प्रबंधन'
    },
    marathi: {
      today: 'आज रात्री 10 नंतर पंप चालवा — ₹800 ची बचत होईल',
      saving: '₹800',
      action: 'पंप रात्री 10 नंतर चालवा',
      wa: 'नमस्कार! SME-Twin कडून ऊर्जा सल्ला:\n\n⚡ *आजची शिफारस:*\nडाइंग व्हॅट रात्री 10 नंतर चालवा\n\n💰 बचत: *₹800 आज*\n📅 महिन्यात: *₹24,000*\n\n— SME-Twin ऊर्जा व्यवस्थापन'
    },
    gujarati: {
      today: 'આજે રાત્રે 10 પછી પંપ ચલાવો — ₹800 ની બચત થશે',
      saving: '₹800',
      action: 'પંપ રાત્રે 10 પછી ચલાવો',
      wa: 'નમસ્તે! SME-Twin તરફથી ઊર્જા સલાહ:\n\n⚡ *આજની ભલામણ:*\nડાઇંગ વૅટ રાત્રે 10 પછી ચલાવો\n\n💰 બચત: *₹800 આજ*\n📅 મહિનામાં: *₹24,000*\n\n— SME-Twin ઊર્જા વ્યવસ્થાપન'
    }
  };

  const msg = MESSAGES[lang];

  const handleSend = async (type) => {
    setSending(true);
    try {
      await api.post('/notify/supervisor', {
        factory_id: f.id,
        message_hindi: msg.today,
        send_whatsapp: type === 'wa' || type === 'both',
        alert_text: msg.wa
      });
      setAlertHistory(h => [{ ts: new Date().toLocaleString('en-IN'), msg:msg.today, channel: type==='voice'?'Voice':type==='wa'?'WhatsApp':'Voice+WhatsApp', status:'Sent' }, ...h]);
    } catch(e) {
      // In demo mode, still log it
      setAlertHistory(h => [{ ts: new Date().toLocaleString('en-IN'), msg:msg.today, channel: type==='voice'?'Voice':type==='wa'?'WhatsApp':'Voice+WhatsApp', status:'Demo Mode' }, ...h]);
    } finally { setSending(false); }
  };

  return React.createElement('div', { className:'space-y-5' },
    // Language selector + alert preview
    React.createElement('div', { className:'grid grid-cols-1 lg:grid-cols-2 gap-4' },
      React.createElement(Card, {},
        React.createElement(SectionHeader, { title:"Today's Alert", subtitle:'Vernacular voice & WhatsApp delivery to shop floor supervisors' }),
        React.createElement('div', { className:'flex gap-2 mb-4' },
          ['hindi','marathi','gujarati'].map(l => React.createElement('button', {
            key:l, onClick:()=>setLang(l),
            className:`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${lang===l?'bg-green-700 text-white':'bg-slate-800 text-slate-400 hover:text-white'}`
          }, l==='hindi'?'हिंदी':l==='marathi'?'मराठी':'ગુજરાતી'))
        ),
        React.createElement('div', { className:'bg-slate-800 rounded-xl p-4 mb-4' },
          React.createElement('p', { className:'text-lg text-white font-medium leading-relaxed' }, msg.today),
          React.createElement('p', { className:'text-sm text-green-400 mt-2 font-semibold' }, `💰 ${msg.saving} savings today`)
        ),
        React.createElement('div', { className:'flex items-center gap-2 mb-4' },
          React.createElement('label', { className:'text-sm text-slate-400' }, 'Phone:'),
          React.createElement('input', {
            type:'text', defaultValue: f.phone_number,
            className:'flex-1 bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-3 py-1.5 text-sm'
          })
        ),
        React.createElement('div', { className:'flex gap-2' },
          React.createElement(Btn, { onClick:()=>handleSend('voice'), loading:sending, variant:'primary' }, '📞 Send Voice Call'),
          React.createElement(Btn, { onClick:()=>handleSend('wa'), loading:sending, variant:'secondary' }, '💬 Send WhatsApp'),
          React.createElement(Btn, { onClick:()=>handleSend('both'), loading:sending, variant:'secondary' }, '📡 Send Both')
        )
      ),
      // WhatsApp mockup
      React.createElement(Card, {},
        React.createElement(SectionHeader, { title:'WhatsApp Preview' }),
        React.createElement('div', { className:'bg-[#0d1117] rounded-xl p-4 min-h-64 flex flex-col justify-end', style:{backgroundImage:'url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' viewBox=\'0 0 20 20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.03\'%3E%3Cpath d=\'M0 0h20v20H0z\'/%3E%3C/g%3E%3C/svg%3E")'} },
          React.createElement('div', { className:'flex justify-end mb-2' },
            React.createElement('div', { className:'bg-[#005c4b] text-white text-sm rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-xs shadow' },
              React.createElement('p', { className:'whitespace-pre-line text-sm leading-relaxed' }, msg.wa),
              React.createElement('p', { className:'text-xs text-green-300 mt-1 text-right' }, '✓✓ 07:00')
            )
          ),
          React.createElement('div', { className:'flex justify-start' },
            React.createElement('div', { className:'bg-slate-700 text-white text-sm rounded-2xl rounded-tl-sm px-4 py-2.5 max-w-xs shadow' },
              React.createElement('p', { className:'text-sm' }, 'ठीक है, कर देते हैं 🙏'),
              React.createElement('p', { className:'text-xs text-slate-400 mt-1' }, '07:03')
            )
          )
        )
      )
    ),

    // Daily schedule
    React.createElement(Card, {},
      React.createElement(SectionHeader, { title:'Daily Alert Schedule', subtitle:'Automated morning dispatch to supervisor' }),
      React.createElement('div', { className:'flex items-center gap-4' },
        React.createElement('label', { className:'text-sm text-slate-400' }, 'Send daily at:'),
        React.createElement('input', { type:'time', value:scheduleTime, onChange:e=>setScheduleTime(e.target.value), className:'bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 text-sm' }),
        React.createElement(Btn, { onClick:()=>{}, variant:'secondary' }, '💾 Save Schedule')
      )
    ),

    // Alert history
    React.createElement(Card, {},
      React.createElement(SectionHeader, { title:'Alert History' }),
      React.createElement('div', { className:'overflow-x-auto' },
        React.createElement('table', { className:'w-full text-sm' },
          React.createElement('thead', {},
            React.createElement('tr', { className:'text-xs text-slate-500 border-b border-slate-800' },
              ['Timestamp', 'Message', 'Channel', 'Status'].map(h => React.createElement('th', { key:h, className:'text-left py-2 px-3 font-medium' }, h))
            )
          ),
          React.createElement('tbody', {},
            alertHistory.map((a,i) => React.createElement('tr', { key:i, className:'border-b border-slate-800/50' },
              React.createElement('td', { className:'py-2.5 px-3 text-xs text-slate-500' }, a.ts),
              React.createElement('td', { className:'py-2.5 px-3 text-slate-300 max-w-xs truncate' }, a.msg),
              React.createElement('td', { className:'py-2.5 px-3' }, React.createElement(Badge, { color:'blue' }, a.channel)),
              React.createElement('td', { className:'py-2.5 px-3' }, React.createElement(Badge, { color: a.status==='Delivered'||a.status==='Sent'?'green':'slate' }, a.status))
            ))
          )
        )
      )
    )
  );
}

// ─── ONBOARDING WIZARD ────────────────────────────────────────────────────────
function OnboardingPage({ onFactoryCreated }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [factory, setFactory] = useState(null);
  const [bill, setBill] = useState(null);
  const [machines, setMachines] = useState([]);
  const [form, setForm] = useState({ name:'', sector:'Textile', phone_number:'', udyam_number:'' });
  const [billFile, setBillFile] = useState(null);
  const [billMonth, setBillMonth] = useState('2026-09');
  const [ocrResult, setOcrResult] = useState(null);
  const [production, setProduction] = useState({ daily_output:'', unit:'kg', shift_morning:true, shift_evening:true, shift_night:false });
  const [calResult, setCalResult] = useState(null);
  const [calibrating, setCalibrating] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const SECTORS = ['Textile', 'Foundry/Casting', 'Ceramic/Tile', 'Food Processing', 'Pharmaceutical', 'Packaging', 'Other'];
  const STEPS = ['Factory Details', 'Upload Bill', 'Machine Inventory', 'Production Data', 'Calibrate Twin'];

  const handleRegister = async () => {
    setLoading(true);
    try {
      const res = await api.post('/factory', { ...form, phone_number: form.phone_number.startsWith('+') ? form.phone_number : '+91' + form.phone_number });
      setFactory(res);
      setStep(2);
    } catch(e) {
      // Demo mode
      const demo = { ...MOCK_FACTORY, ...form, id: 'demo-' + Date.now() };
      setFactory(demo);
      setMachines(MOCK_FACTORY.machines);
      setStep(2);
    } finally { setLoading(false); }
  };

  const handleBillUpload = async () => {
    if (!billFile) return;
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('factory_id', factory.id);
      fd.append('billing_month', billMonth);
      fd.append('image', billFile);
      const res = await api.postForm('/bill/upload', fd);
      setBill(res);
      // Fetch updated machines
      try {
        const ms = await api.get(`/factory/${factory.id}/machines`);
        setMachines(ms);
      } catch { setMachines(MOCK_FACTORY.machines); }
      setOcrResult({ total_kwh: res.total_kwh, peak_demand_kva: res.peak_demand_kva, tod_peak: res.tod_peak_kwh, tod_offpeak: res.tod_offpeak_kwh });
      setStep(3);
    } catch {
      setOcrResult({ total_kwh: 84200, peak_demand_kva: 320, tod_peak: 41000, tod_offpeak: 43200 });
      setMachines(MOCK_FACTORY.machines);
      setStep(3);
    } finally { setLoading(false); }
  };

  const handleCalibrate = async () => {
    setCalibrating(true);
    try {
      const res = await api.post(`/twin/calibrate/${factory.id}`, {});
      setCalResult(res);
      setTimeout(() => {
        if (onFactoryCreated) onFactoryCreated({ ...factory, latest_calibration: res, machines, latest_bill: bill || MOCK_FACTORY.latest_bill });
      }, 1500);
    } catch {
      setCalResult({ simulation_error_pct: 3.2, calibrated_duty_cycles: MOCK_FACTORY.latest_calibration.calibrated_duty_cycles, timestamp: new Date().toISOString() });
    } finally { setCalibrating(false); }
  };

  const stepIndicator = React.createElement('div', { className:'flex items-center gap-2 mb-6' },
    STEPS.map((s, i) => React.createElement('div', { key:i, className:'flex items-center gap-2' },
      React.createElement('div', { className:`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-all
        ${i+1 < step ? 'bg-green-700 text-white' : i+1 === step ? 'bg-green-600 text-white ring-2 ring-green-400' : 'bg-slate-800 text-slate-500'}` },
        i+1 < step ? '✓' : i+1
      ),
      React.createElement('span', { className:`text-xs font-medium ${i+1===step?'text-green-300':i+1<step?'text-green-600':'text-slate-600'}` }, s),
      i < STEPS.length-1 && React.createElement('div', { className:`h-0.5 w-6 ${i+1 < step ? 'bg-green-700' : 'bg-slate-800'}` })
    ))
  );

  return React.createElement(Card, { className:'max-w-2xl mx-auto' },
    React.createElement(SectionHeader, { title:'Factory Onboarding Wizard', subtitle:'Zero-hardware setup · Takes about 10 minutes' }),
    stepIndicator,

    // Step 1: Factory details
    step === 1 && React.createElement('div', { className:'space-y-4' },
      React.createElement('h3', { className:'text-sm font-semibold text-slate-300 mb-3' }, 'Step 1: Factory Details'),
      [
        { key:'name', label:'Factory Name *', placeholder:'e.g. Shree Ganesh Textiles' },
        { key:'udyam_number', label:'Udyam Registration Number', placeholder:'e.g. UDYAM-GJ-12-0034521' },
        { key:'phone_number', label:'Supervisor Phone *', placeholder:'+91 9876543210' },
      ].map(field => React.createElement('div', { key:field.key },
        React.createElement('label', { className:'text-xs text-slate-500 block mb-1' }, field.label),
        React.createElement('input', {
          type:'text', placeholder:field.placeholder, value:form[field.key],
          onChange:e=>setForm(f=>({...f,[field.key]:e.target.value})),
          className:'w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-green-600'
        })
      )),
      React.createElement('div', {},
        React.createElement('label', { className:'text-xs text-slate-500 block mb-1' }, 'Sector *'),
        React.createElement('select', {
          value:form.sector, onChange:e=>setForm(f=>({...f,sector:e.target.value})),
          className:'w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-3 py-2.5 text-sm'
        }, SECTORS.map(s => React.createElement('option', { key:s, value:s }, s)))
      ),
      React.createElement(Btn, { onClick:handleRegister, loading, disabled:!form.name||!form.phone_number, variant:'primary', className:'w-full justify-center mt-2' }, 'Register Factory →')
    ),

    // Step 2: Bill upload
    step === 2 && React.createElement('div', { className:'space-y-4' },
      React.createElement('h3', { className:'text-sm font-semibold text-slate-300 mb-3' }, 'Step 2: Upload Electricity Bill'),
      React.createElement('div', {},
        React.createElement('label', { className:'text-xs text-slate-500 block mb-1' }, 'Billing Month'),
        React.createElement('input', { type:'month', value:billMonth, onChange:e=>setBillMonth(e.target.value), className:'bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 text-sm' })
      ),
      React.createElement('div', {
        onDragOver:e=>{e.preventDefault();setDragOver(true)}, onDragLeave:()=>setDragOver(false),
        onDrop:e=>{e.preventDefault();setDragOver(false);const f=e.dataTransfer.files[0];if(f)setBillFile(f);},
        onClick:()=>document.getElementById('bill-file-input').click(),
        className:`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${dragOver?'border-green-500 bg-green-950':'border-slate-700 hover:border-slate-600'}`
      },
        React.createElement('div', { className:'text-3xl mb-2' }, billFile ? '📄' : '📁'),
        billFile
          ? React.createElement('p', { className:'text-green-400 text-sm font-medium' }, billFile.name)
          : React.createElement('div', {},
              React.createElement('p', { className:'text-slate-300 text-sm font-medium' }, 'Drag & drop your electricity bill here'),
              React.createElement('p', { className:'text-slate-500 text-xs mt-1' }, 'JPEG, PNG, or WebP · Gemini Vision OCR extracts all data automatically')
            ),
        React.createElement('input', { id:'bill-file-input', type:'file', accept:'image/*', className:'hidden', onChange:e=>setBillFile(e.target.files[0]) })
      ),
      React.createElement('p', { className:'text-xs text-slate-500' }, '💡 No bill photo? Click "Skip (use demo data)" to continue with synthetic data.'),
      React.createElement('div', { className:'flex gap-2' },
        React.createElement(Btn, { onClick:handleBillUpload, loading, disabled:!billFile, variant:'primary' }, '⬆ Upload & Extract →'),
        React.createElement(Btn, { onClick:()=>{setOcrResult({total_kwh:84200,peak_demand_kva:320,tod_peak:41000,tod_offpeak:43200});setMachines(MOCK_FACTORY.machines);setStep(3);}, variant:'ghost' }, 'Skip (demo data)')
      )
    ),

    // Step 3: Machine review
    step === 3 && React.createElement('div', { className:'space-y-4' },
      React.createElement('h3', { className:'text-sm font-semibold text-slate-300 mb-1' }, 'Step 3: Review Machine Inventory'),
      ocrResult && React.createElement('div', { className:'bg-blue-950 border border-blue-800 rounded-lg p-3 text-xs' },
        React.createElement('p', { className:'text-blue-300 font-medium mb-1' }, '✓ Bill OCR extracted:'),
        React.createElement('div', { className:'grid grid-cols-2 gap-2 text-blue-400' },
          [`Total kWh: ${ocrResult.total_kwh?.toLocaleString('en-IN')}`, `Peak Demand: ${ocrResult.peak_demand_kva} kVA`,
           `ToD Peak: ${ocrResult.tod_peak?.toLocaleString('en-IN')} kWh`, `ToD Off-peak: ${ocrResult.tod_offpeak?.toLocaleString('en-IN')} kWh`
          ].map(t => React.createElement('div', {key:t}, t))
        )
      ),
      React.createElement('div', { className:'overflow-x-auto' },
        React.createElement('table', { className:'w-full text-sm' },
          React.createElement('thead', {},
            React.createElement('tr', { className:'text-xs text-slate-500 border-b border-slate-800' },
              ['Machine', 'Rated kW', 'Type'].map(h => React.createElement('th', { key:h, className:'text-left py-2 px-2 font-medium' }, h))
            )
          ),
          React.createElement('tbody', {},
            machines.map((m,i) => React.createElement('tr', { key:m.id||i, className:'border-b border-slate-800/50' },
              React.createElement('td', { className:'py-2 px-2 text-slate-300' }, m.name),
              React.createElement('td', { className:'py-2 px-2 text-slate-400' }, m.rated_kw),
              React.createElement('td', { className:'py-2 px-2' }, React.createElement(Badge, { color: m.process_type==='continuous'?'blue':'slate' }, m.process_type))
            ))
          )
        )
      ),
      React.createElement(Btn, { onClick:()=>setStep(4), variant:'primary' }, 'Confirm & Continue →')
    ),

    // Step 4: Production data
    step === 4 && React.createElement('div', { className:'space-y-4' },
      React.createElement('h3', { className:'text-sm font-semibold text-slate-300 mb-3' }, 'Step 4: Production Data'),
      React.createElement('div', { className:'grid grid-cols-2 gap-3' },
        React.createElement('div', {},
          React.createElement('label', { className:'text-xs text-slate-500 block mb-1' }, 'Daily Output'),
          React.createElement('input', { type:'number', placeholder:'e.g. 850', value:production.daily_output, onChange:e=>setProduction(p=>({...p,daily_output:e.target.value})), className:'w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 text-sm' })
        ),
        React.createElement('div', {},
          React.createElement('label', { className:'text-xs text-slate-500 block mb-1' }, 'Unit'),
          React.createElement('select', { value:production.unit, onChange:e=>setProduction(p=>({...p,unit:e.target.value})), className:'w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 text-sm' },
            ['kg','ton','pieces','litres','metres'].map(u => React.createElement('option', { key:u, value:u }, u))
          )
        )
      ),
      React.createElement('div', {},
        React.createElement('label', { className:'text-xs text-slate-500 block mb-2' }, 'Active Shifts'),
        React.createElement('div', { className:'flex gap-3' },
          [['shift_morning','Morning (6am–2pm)'],['shift_evening','Evening (2pm–10pm)'],['shift_night','Night (10pm–6am)']].map(([k,l]) =>
            React.createElement('label', { key:k, className:'flex items-center gap-2 text-sm text-slate-400 cursor-pointer' },
              React.createElement('input', { type:'checkbox', checked:production[k], onChange:e=>setProduction(p=>({...p,[k]:e.target.checked})), className:'rounded' }),
              l
            )
          )
        )
      ),
      React.createElement(Btn, { onClick:()=>setStep(5), variant:'primary' }, 'Continue to Calibration →')
    ),

    // Step 5: Calibrate
    step === 5 && React.createElement('div', { className:'space-y-4' },
      React.createElement('h3', { className:'text-sm font-semibold text-slate-300 mb-3' }, 'Step 5: Calibrate Your Digital Twin'),
      React.createElement('div', { className:'bg-slate-800 rounded-xl p-4 text-sm text-slate-400 space-y-2' },
        React.createElement('p', { className:'text-white font-medium' }, '🏭 Ready to calibrate!'),
        React.createElement('p', {}, `Factory: ${factory?.name}`),
        React.createElement('p', {}, `Machines: ${machines.length}`),
        React.createElement('p', {}, `Bill: ${ocrResult?.total_kwh?.toLocaleString('en-IN') || '84,200'} kWh`),
        React.createElement('p', { className:'text-xs text-slate-500 mt-2' }, 'The twin will run scipy.optimize (SLSQP) to find duty cycles that match your real electricity bill — a physics-informed calibration with no sensors required.')
      ),
      !calResult && React.createElement(Btn, { onClick:handleCalibrate, loading:calibrating, variant:'primary', className:'w-full justify-center' }, calibrating ? '⚙ Calibrating twin...' : '⚙ Run Calibration'),
      calResult && React.createElement('div', { className:'bg-green-950 border border-green-700 rounded-xl p-4 text-center' },
        React.createElement('div', { className:'text-4xl mb-2' }, '✅'),
        React.createElement('p', { className:'text-green-300 font-bold text-lg' }, 'Twin Calibrated!'),
        React.createElement('p', { className:'text-green-400 text-sm' }, `Simulation error: ${fmt(calResult.simulation_error_pct)}%`),
        React.createElement('p', { className:'text-slate-400 text-xs mt-2' }, 'Your factory\'s digital twin is live. Navigate to Dashboard to see insights.')
      )
    )
  );
}

// ─── ROOT APP ─────────────────────────────────────────────────────────────────
function App() {
  const [user, setUser] = useState(null); // null = not logged in
  const [page, setPage] = useState('dashboard');
  const [factory, setFactory] = useState(MOCK_FACTORY);
  const [factories, setFactories] = useState([MOCK_FACTORY]);
  const [schedule, setSchedule] = useState(MOCK_SCHEDULE);
  const [calibrating, setCalibrating] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [toasts, setToasts] = useState([]);

  const toast = useCallback((msg, type='success') => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  }, []);

  // Load factories from API on mount
  useEffect(() => {
    api.get('/factory').then(fs => {
      if (fs && fs.length > 0) {
        setFactories(fs);
        setFactory(fs[0]);
      }
    }).catch(() => {}); // keep mock data on error
  }, []);

  const handleCalibrate = useCallback(async () => {
    if (!factory?.id) return;
    setCalibrating(true);
    try {
      const res = await api.post(`/twin/calibrate/${factory.id}`, {});
      setFactory(f => ({ ...f, latest_calibration: res }));
      toast(`Twin calibrated — ${fmt(res.simulation_error_pct)}% error`);
    } catch (e) {
      toast('API unavailable — using demo calibration', 'warning');
      setFactory(f => ({ ...f, latest_calibration: MOCK_FACTORY.latest_calibration }));
    } finally { setCalibrating(false); }
  }, [factory, toast]);

  const handleOptimize = useCallback(async () => {
    if (!factory?.id) return;
    setOptimizing(true);
    try {
      const res = await api.post(`/twin/optimize/${factory.id}`, {});
      setSchedule(res);
      toast(`Optimized — ${inr(res.estimated_daily_savings * 30)}/month savings found`);
    } catch (e) {
      toast('API unavailable — showing demo optimization', 'warning');
      setSchedule(MOCK_SCHEDULE);
    } finally { setOptimizing(false); }
  }, [factory, toast]);

  const handleFactoryCreated = useCallback((f) => {
    setFactories(prev => {
      const exists = prev.find(x => x.id === f.id);
      return exists ? prev.map(x => x.id === f.id ? f : x) : [...prev, f];
    });
    setFactory(f);
    setPage('dashboard');
    toast(`${f.name} is live!`);
  }, []);

  const pageContent = useMemo(() => {
    switch(page) {
      case 'dashboard':   return React.createElement(DashboardPage, { factory, schedule, setPage });
      case 'twin':        return React.createElement(TwinPage, { factory, onCalibrate:handleCalibrate, calibrating });
      case 'optimizer':   return React.createElement(OptimizerPage, { factory, schedule, onOptimize:handleOptimize, optimizing });
      case 'benchmark':   return React.createElement(BenchmarkPage, { factory });
      case 'compliance':  return React.createElement(CompliancePage, { factory });
      case 'alerts':      return React.createElement(AlertsPage, { factory });
      case 'onboarding':  return React.createElement(OnboardingPage, { onFactoryCreated:handleFactoryCreated });
      default: return null;
    }
  }, [page, factory, schedule, calibrating, optimizing, handleCalibrate, handleOptimize, handleFactoryCreated]);

  // Show login page if not authenticated
  if (!user) return React.createElement(LoginPage, { onLogin: setUser });

  // Hide the loading screen now that React has rendered
  const loadingEl = document.getElementById('loading-screen');
  if (loadingEl) loadingEl.classList.add('hidden');

  return React.createElement('div', { className:'flex h-screen overflow-hidden' },
    React.createElement(Sidebar, { page, setPage, factory, factories, setFactory }),
    React.createElement('div', { className:'flex-1 flex flex-col overflow-hidden' },
      React.createElement(Header, { page, factory, user, onLogout: () => setUser(null) }),
      React.createElement('main', { className:'flex-1 overflow-y-auto p-6 scrollbar-hide' },
        pageContent
      )
    ),
    React.createElement(Toast, { toasts })
  );
}

// Mount
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(App));
