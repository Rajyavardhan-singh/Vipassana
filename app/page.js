"use client";

import { useState, useEffect } from "react";
import {
  Mountain, CalendarDays, Settings2, Plus, X, Trash2, Pencil,
  CheckCircle2, Circle, ChevronRight, AlertTriangle, LogOut,
} from "lucide-react";
import {
  COURSE_TYPES, DEFAULT_SETTINGS, buildTiers, getIntervalWarnings,
  getCounts, formatDate, getFirstDate, yearsBetween,
} from "@/lib/eligibility";

function ProgressRing({ pct, size = 54, stroke = 5 }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  return (
    <svg width={size} height={size} className="shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(243,238,228,0.12)" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={pct === 100 ? "var(--gold)" : "var(--saffron)"}
        strokeWidth={stroke} strokeDasharray={c} strokeDashoffset={offset}
        strokeLinecap="round" transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dashoffset 0.6s ease" }}
      />
      <text x="50%" y="50%" textAnchor="middle" dy="0.35em" fontSize="13" fill="#F3EEE4" fontFamily="Inter, sans-serif" fontWeight="600">{pct}%</text>
    </svg>
  );
}

function Toggle({ checked, onChange, label, description }) {
  return (
    <button onClick={() => onChange(!checked)} className="w-full flex items-center justify-between gap-4 py-3.5 text-left">
      <div>
        <p className="text-sm text-ivory">{label}</p>
        {description && <p className="text-xs text-muted mt-0.5">{description}</p>}
      </div>
      <div className={`w-11 h-6 rounded-full shrink-0 relative transition-colors ${checked ? "bg-gold" : "bg-surface2"}`}>
        <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-ink transition-transform ${checked ? "translate-x-5" : "translate-x-0.5"}`} />
      </div>
    </button>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="bg-surface rounded-xl border border-line px-4 py-3 min-w-[112px] shrink-0">
      <p className="font-display text-2xl text-ivory leading-none">{value}</p>
      <p className="text-[11px] text-muted mt-1.5 uppercase tracking-wide">{label}</p>
    </div>
  );
}

function computeEndDate(startDateStr, courseType) {
  const DURATION_DAYS = {
    "1-Day": 0,
    "3-Day": 3,
    "10-Day": 11,
    "Satipatthana Sutta": 8,
    "20-Day": 21,
    "30-Day": 31,
    "45-Day": 46,
    "60-Day": 61,
  };

  const daysToAdd = DURATION_DAYS[courseType];
  if (daysToAdd === undefined || daysToAdd === null || !startDateStr) {
    return null;
  }

  const [y, m, d] = startDateStr.split("-").map(Number);
  if (!y || !m || !d) return null;

  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + daysToAdd);

  const endY = date.getUTCFullYear();
  const endM = String(date.getUTCMonth() + 1).padStart(2, "0");
  const endD = String(date.getUTCDate()).padStart(2, "0");

  return `${endY}-${endM}-${endD}`;
}

export default function App() {
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [tab, setTab] = useState("path");
  const [expandedTier, setExpandedTier] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(null);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const [coursesRes, settingsRes] = await Promise.all([
        fetch("/api/courses"),
        fetch("/api/settings"),
      ]);
      setCourses(await coursesRes.json());
      setSettings(await settingsRes.json());
      setLoading(false);
    })();
  }, []);

  const openAdd = () => {
    setForm({
      courseType: "10-Day",
      status: "Attended",
      startDate: "",
      endDate: "",
      fullTime: true,
      location: "Dhamma Mālwā",
      teacher: "",
      number: "",
    });
    setEditingId(null);
    setModalOpen(true);
  };
  const openEdit = (course) => {
    setForm({
      location: "Dhamma Mālwā",
      number: "",
      ...course,
    });
    setEditingId(course.id);
    setModalOpen(true);
  };

  const handleCourseTypeChange = (type) => {
    const calculatedEnd = computeEndDate(form?.startDate, type);
    setForm(prev => ({
      ...prev,
      courseType: type,
      endDate: calculatedEnd !== null ? calculatedEnd : prev.endDate,
    }));
  };

  const handleStartDateChange = (startDate) => {
    const calculatedEnd = computeEndDate(startDate, form?.courseType);
    setForm(prev => ({
      ...prev,
      startDate,
      endDate: calculatedEnd !== null ? calculatedEnd : prev.endDate,
    }));
  };

  const submitForm = async () => {
    if (!form.startDate || !form.endDate) return;
    const finalLocation = form.location && form.location.trim() ? form.location.trim() : "Dhamma Mālwā";
    const payload = { ...form, location: finalLocation };
    setSaving(true);
    if (editingId) {
      const res = await fetch(`/api/courses/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const updated = await res.json();
      setCourses(courses.map(c => (c.id === editingId ? updated : c)));
    } else {
      const res = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const created = await res.json();
      setCourses([...courses, created]);
    }
    setSaving(false);
    setModalOpen(false);
  };

  const deleteCourse = async (id) => {
    setCourses(courses.filter(c => c.id !== id));
    setPendingDeleteId(null);
    await fetch(`/api/courses/${id}`, { method: "DELETE" });
  };

  const updateSettings = async (next) => {
    setSettings(next);
    await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    });
  };

  const signOut = async () => {
    await fetch("/api/logout", { method: "POST" });
    window.location.href = "/login";
  };

  const tiers = buildTiers(courses, settings);
  const nextTier = tiers.find(t => !t.eligible);
  const warnings = getIntervalWarnings(courses);
  const counts = getCounts(courses);
  const firstDate = getFirstDate(courses);
  const yrs = firstDate ? yearsBetween(firstDate, new Date().toISOString().slice(0, 10)) : 0;
  const sortedCourses = [...courses].sort((a, b) => (a.startDate < b.startDate ? 1 : -1));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink text-muted font-body">
        <p>Loading your path…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-body bg-ink text-ivory pb-24">
      <div className="px-5 pt-6 pb-4 flex items-start justify-between">
        <div>
          <p className="text-xs tracking-widest uppercase text-muted">Vipassana Practice</p>
          <h1 className="font-display text-3xl mt-1">Your Path</h1>
        </div>
        <button onClick={signOut} className="p-2 mt-1 rounded-lg bg-surface border border-line">
          <LogOut className="w-4 h-4 text-muted" />
        </button>
      </div>

      <div className="flex gap-3 px-5 pb-5 overflow-x-auto">
        <StatCard label="Attended" value={courses.filter(c => c.status === "Attended").length} />
        <StatCard label="Served" value={courses.filter(c => c.status === "Served").length} />
        <StatCard label="10-Day (Att.)" value={counts.tenDay} />
        <StatCard label="Years on path" value={firstDate ? yrs.toFixed(1) : "—"} />
      </div>

      {tab === "path" && (
        <div className="px-5 space-y-4">
          {warnings.map((w, i) => (
            <div key={i} className="flex items-start gap-2 bg-surface border border-line rounded-xl px-4 py-3">
              <AlertTriangle className="w-4 h-4 text-saffron mt-0.5 shrink-0" />
              <p className="text-sm text-muted">{w}</p>
            </div>
          ))}

          {nextTier && (
            <div className="rounded-2xl px-5 py-4 border border-line bg-surface2">
              <p className="text-xs uppercase tracking-wide text-muted">Next milestone</p>
              <p className="font-display text-xl mt-1">{nextTier.title}</p>
              <ul className="mt-2.5 space-y-1.5">
                {nextTier.requirements.filter(r => !r.met).map((r, i) => (
                  <li key={i} className="text-sm text-muted flex items-start gap-2">
                    <span className="text-saffron mt-0.5">·</span>
                    <span>
                      <span className="text-ivory font-medium">{r.neededLabel || r.label}</span>
                      {r.selfDeclared ? " (confirm in Settings)" : ""}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="relative">
            {tiers.map((tier, idx) => (
              <div key={tier.key} className="relative pb-4 last:pb-0">
                {idx < tiers.length - 1 && (
                  <div className="absolute left-[26px] top-14 bottom-0 w-px" style={{ backgroundColor: "rgba(243,238,228,0.15)" }} />
                )}
                <div className="bg-surface rounded-2xl border border-line overflow-hidden">
                  <button
                    onClick={() => setExpandedTier(expandedTier === tier.key ? null : tier.key)}
                    className="w-full flex items-center gap-4 p-4 text-left"
                  >
                    <ProgressRing pct={tier.pct} />
                    <div className="flex-1 min-w-0">
                      <p className="font-display text-lg leading-tight">{tier.title}</p>
                      <p className="text-sm text-muted mt-0.5">
                        {tier.eligible ? "Eligible now" : `${tier.total - tier.metCount} requirement${tier.total - tier.metCount === 1 ? "" : "s"} left`}
                      </p>
                    </div>
                    <ChevronRight className={`w-5 h-5 text-muted transition-transform ${expandedTier === tier.key ? "rotate-90" : ""}`} />
                  </button>
                  {expandedTier === tier.key && (
                    <div className="px-4 pb-4 pt-1 space-y-2.5 border-t border-line">
                      {tier.requirements.map((r, i) => (
                        <div key={i} className="flex items-start gap-2.5 text-sm pt-2">
                          {r.met ? <CheckCircle2 className="w-4 h-4 text-gold mt-0.5 shrink-0" /> : <Circle className="w-4 h-4 text-muted mt-0.5 shrink-0" />}
                          <div className="flex-1">
                            <p className={r.met ? "text-ivory" : "text-muted"}>{r.label}</p>
                            {r.detail && <p className="text-xs text-muted mt-0.5">{r.detail}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "history" && (
        <div className="px-5 space-y-3">
          {sortedCourses.length === 0 && <p className="text-sm text-muted text-center py-10">No courses logged yet. Tap + to add one.</p>}
          {sortedCourses.map(course => (
            <div key={course.id} className="bg-surface rounded-xl border border-line p-4 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-display text-base">{course.courseType}</span>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full text-ink font-medium ${course.status === "Served" ? "bg-sage" : "bg-saffron"}`}>
                    {course.status}
                  </span>
                </div>
                <p className="text-sm text-muted mt-1">{formatDate(course.startDate)} – {formatDate(course.endDate)}</p>
                {(course.location || course.teacher || course.number) && (
                  <p className="text-sm text-muted">
                    {course.location}
                    {course.teacher ? ` · ${course.teacher}` : ""}
                    {course.number ? ` (${course.number})` : ""}
                  </p>
                )}
              </div>
              <div className="flex gap-1 shrink-0">
                {pendingDeleteId === course.id ? (
                  <>
                    <button onClick={() => deleteCourse(course.id)} className="text-xs px-2.5 py-1.5 rounded-lg bg-saffron text-ink font-medium">Delete</button>
                    <button onClick={() => setPendingDeleteId(null)} className="text-xs px-2.5 py-1.5 rounded-lg bg-surface2 text-muted">Cancel</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => openEdit(course)} className="p-2 rounded-lg bg-surface2"><Pencil className="w-4 h-4 text-muted" /></button>
                    <button onClick={() => setPendingDeleteId(course.id)} className="p-2 rounded-lg bg-surface2"><Trash2 className="w-4 h-4 text-muted" /></button>
                  </>
                )}
              </div>
            </div>
          ))}
          <button onClick={openAdd} className="fixed bottom-20 right-5 w-14 h-14 rounded-full bg-gold flex items-center justify-center shadow-lg">
            <Plus className="w-6 h-6 text-ink" />
          </button>
        </div>
      )}

      {tab === "settings" && (
        <div className="px-5">
          <p className="text-xs uppercase tracking-wide text-muted mb-1">Self-declared</p>
          <p className="text-xs text-muted mb-3">These criteria aren't tracked from course dates — confirm them honestly, they feed directly into your eligibility above.</p>
          <div className="bg-surface rounded-2xl border border-line px-4">
            <Toggle checked={settings.regularPractice} onChange={v => updateSettings({ ...settings, regularPractice: v })} label="Daily sitting: 2×1hr for the past 2 years" description="Morning and evening practice, sustained" />
            <Toggle checked={settings.fullCommitment} onChange={v => updateSettings({ ...settings, fullCommitment: v })} label="Full & exclusive commitment" description="No part-time attendance; no other techniques" />
            <Toggle checked={settings.silaOneYear} onChange={v => updateSettings({ ...settings, silaOneYear: v })} label="Sīla maintained for the past year" description="Precepts kept to the best of your ability" />
          </div>

          <p className="text-xs uppercase tracking-wide text-muted mt-6 mb-2">Dhamma service role</p>
          <p className="text-xs text-muted mb-3">45-Day and 60-Day courses are restricted to Assistant Teachers or those closely involved in service.</p>
          <div className="bg-surface rounded-2xl border border-line p-2">
            {[
              { key: "student", label: "Student" },
              { key: "at", label: "Assistant Teacher / involved in service" },
              { key: "seniorAt", label: "Senior AT / deeply involved in service" },
            ].map(opt => (
              <button
                key={opt.key}
                onClick={() => updateSettings({ ...settings, role: opt.key })}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-sm flex items-center justify-between ${settings.role === opt.key ? "bg-surface2" : ""}`}
              >
                <span className={settings.role === opt.key ? "text-ivory" : "text-muted"}>{opt.label}</span>
                {settings.role === opt.key && <CheckCircle2 className="w-4 h-4 text-gold" />}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 bg-surface border-t border-line flex">
        {[
          { key: "path", label: "Path", Icon: Mountain },
          { key: "history", label: "History", Icon: CalendarDays },
          { key: "settings", label: "Settings", Icon: Settings2 },
        ].map(({ key, label, Icon }) => (
          <button key={key} onClick={() => setTab(key)} className="flex-1 flex flex-col items-center gap-1 py-2.5">
            <Icon className="w-5 h-5" style={{ color: tab === key ? "var(--gold)" : "var(--muted)" }} />
            <span className="text-[11px]" style={{ color: tab === key ? "var(--gold)" : "var(--muted)" }}>{label}</span>
          </button>
        ))}
      </div>

      {modalOpen && form && (
        <div className="fixed inset-0 bg-black/60 flex items-end z-50" onClick={() => setModalOpen(false)}>
          <div className="bg-surface w-full rounded-t-3xl p-5 max-h-[88vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl">{editingId ? "Edit course" : "Add course"}</h2>
              <button onClick={() => setModalOpen(false)}><X className="w-5 h-5 text-muted" /></button>
            </div>

            <label className="block text-xs text-muted mb-1.5">Course type</label>
            <select
              value={form.courseType}
              onChange={e => handleCourseTypeChange(e.target.value)}
              className="w-full bg-surface2 rounded-xl px-3 py-2.5 mb-4 text-sm text-ivory border border-line"
            >
              {COURSE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>

            <label className="block text-xs text-muted mb-1.5">Status</label>
            <div className="flex gap-2 mb-4">
              {["Attended", "Served"].map(s => (
                <button
                  key={s}
                  onClick={() => setForm({ ...form, status: s })}
                  className={`flex-1 py-2.5 rounded-xl text-sm ${form.status === s ? "bg-gold text-ink font-medium" : "bg-surface2 text-muted"}`}
                >
                  {s}
                </button>
              ))}
            </div>

            <div className="flex gap-3 mb-4">
              <div className="flex-1">
                <label className="block text-xs text-muted mb-1.5">Start date</label>
                <input type="date" value={form.startDate} onChange={e => handleStartDateChange(e.target.value)}
                  className="w-full bg-surface2 rounded-xl px-3 py-2.5 text-sm text-ivory border border-line" style={{ colorScheme: "dark" }} />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-muted mb-1.5">End date</label>
                <input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })}
                  className="w-full bg-surface2 rounded-xl px-3 py-2.5 text-sm text-ivory border border-line" style={{ colorScheme: "dark" }} />
              </div>
            </div>

            <label className="block text-xs text-muted mb-1.5">Location</label>
            <input
              type="text"
              value={form.location || ""}
              placeholder="Dhamma Mālwā"
              onFocus={() => {
                if (form.location === "Dhamma Mālwā") {
                  setForm(prev => ({ ...prev, location: "" }));
                }
              }}
              onBlur={() => {
                if (!form.location || !form.location.trim()) {
                  setForm(prev => ({ ...prev, location: "Dhamma Mālwā" }));
                }
              }}
              onChange={e => setForm({ ...form, location: e.target.value })}
              className="w-full bg-surface2 rounded-xl px-3 py-2.5 mb-4 text-sm text-ivory border border-line placeholder:text-muted"
            />

            <div className="flex gap-3 mb-4">
              <div className="flex-1">
                <label className="block text-xs text-muted mb-1.5">Teacher</label>
                <input type="text" value={form.teacher || ""} placeholder="Teacher's name" onChange={e => setForm({ ...form, teacher: e.target.value })}
                  className="w-full bg-surface2 rounded-xl px-3 py-2.5 text-sm text-ivory border border-line placeholder:text-muted" />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-muted mb-1.5">Teacher Phone No.</label>
                <input type="tel" value={form.number || ""} placeholder="e.g. +91 9876543210" onChange={e => setForm({ ...form, number: e.target.value })}
                  className="w-full bg-surface2 rounded-xl px-3 py-2.5 text-sm text-ivory border border-line placeholder:text-muted" />
              </div>
            </div>

            <Toggle checked={form.fullTime} onChange={v => setForm({ ...form, fullTime: v })} label="Full time" />

            <button
              onClick={submitForm}
              disabled={!form.startDate || !form.endDate || saving}
              className="w-full bg-gold text-ink font-medium py-3 rounded-xl mt-4 disabled:opacity-40"
            >
              {saving ? "Saving…" : editingId ? "Save changes" : "Add course"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
