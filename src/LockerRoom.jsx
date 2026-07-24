import React, { useState, useEffect, useMemo, useRef } from "react";
import { Search, Plus, X, Lock, Unlock, Users, User, Trash2, Download, Settings2, FileText, ChevronDown, Globe, LogOut } from "lucide-react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "./firebase";

const DEFAULT_COUNT = 30;

const T = {
  en: {
    appTitle: "LOCKER ROOM",
    stats: (a, t, f, w) => `${a}/${t} in use · ${f} full · ${w} waiting`,
    searchPlaceholder: "Find employee…",
    lockersBtn: (n) => `${n} lockers`,
    exportCsv: "CSV",
    exportPdf: "PDF",
    employeesTitle: "EMPLOYEES",
    addEmployeeBtn: "+ Add employee",
    addEmployeeTitle: "ADD EMPLOYEE",
    namePlaceholder: "Name",
    addNamePlaceholder: "Add name…",
    moreDetails: "More details",
    lessDetails: "Fewer details",
    badgePlaceholder: "Badge / ID no.",
    departmentPlaceholder: "Department",
    phonePlaceholder: "Phone",
    waiting: (n) => `WAITING (${n})`,
    allHaveLockers: "Everyone has a locker.",
    lockerLabel: (n) => `LOCKER ${n}`,
    singleLocker: "Single locker — tap to allow 2 people",
    sharedLocker: "Shared locker (2) — tap to make single",
    assigned: (a, c) => `ASSIGNED (${a}/${c})`,
    emptyLocker: "Empty locker.",
    assign: "ASSIGN",
    noOneWaiting: "No one waiting. Add an employee first.",
    settingsTitle: "NUMBER OF LOCKERS",
    settingsHint: "Lowering this removes the highest-numbered lockers (and unassigns anyone in them).",
    cancel: "Cancel",
    apply: "Apply",
    saving: "saving…",
    badge: "Badge",
    department: "Dept.",
    phone: "Phone",
    open: "open",
    csvHeaders: ["Locker", "Capacity", "Employee 1", "Employee 1 details", "Employee 2", "Employee 2 details", "Status"],
    csvUnassigned: "Unassigned employees",
    csvUnassignedName: "Name",
    csvUnassignedDetails: "Details",
    csvSummary: "Summary",
    csvTotalLockers: "Total lockers",
    csvLockersInUse: "Lockers in use",
    csvLockersFull: "Lockers full",
    csvLockersWithSpace: "Lockers with space available",
    csvOpenSpots: "Open spots (total capacity remaining)",
    csvTotalEmployees: "Total employees",
    csvUnassignedCount: "Unassigned employees",
    reportTitle: "Locker Room Report",
    generated: "Generated",
    full: "Full",
    partial: "Partial",
    empty: "Empty",
    signOut: "Sign out",
  },
  ar: {
    appTitle: "غرفة الخزائن",
    stats: (a, t, f, w) => `${a}/${t} قيد الاستخدام · ${f} ممتلئة · ${w} بالانتظار`,
    searchPlaceholder: "ابحث عن موظف…",
    lockersBtn: (n) => `${n} خزانة`,
    exportCsv: "CSV",
    exportPdf: "PDF",
    employeesTitle: "الموظفون",
    addEmployeeBtn: "+ إضافة موظف",
    addEmployeeTitle: "إضافة موظف",
    namePlaceholder: "الاسم",
    addNamePlaceholder: "أضف الاسم…",
    moreDetails: "تفاصيل إضافية",
    lessDetails: "تفاصيل أقل",
    badgePlaceholder: "رقم البطاقة",
    departmentPlaceholder: "القسم",
    phonePlaceholder: "الهاتف",
    waiting: (n) => `بالانتظار (${n})`,
    allHaveLockers: "جميع الموظفين لديهم خزانة.",
    lockerLabel: (n) => `خزانة ${n}`,
    singleLocker: "خزانة فردية — اضغط للسماح بشخصين",
    sharedLocker: "خزانة مشتركة (٢) — اضغط لجعلها فردية",
    assigned: (a, c) => `المُعيَّنون (${a}/${c})`,
    emptyLocker: "خزانة فارغة.",
    assign: "تعيين",
    noOneWaiting: "لا يوجد أحد بالانتظار. أضف موظفًا أولاً.",
    settingsTitle: "عدد الخزائن",
    settingsHint: "تقليل العدد يحذف الخزائن ذات الأرقام الأعلى (ويُلغي تعيين من بها).",
    cancel: "إلغاء",
    apply: "تطبيق",
    saving: "جارٍ الحفظ…",
    badge: "البطاقة",
    department: "القسم",
    phone: "الهاتف",
    open: "شاغرة",
    csvHeaders: ["الخزانة", "السعة", "الموظف ١", "تفاصيل الموظف ١", "الموظف ٢", "تفاصيل الموظف ٢", "الحالة"],
    csvUnassigned: "موظفون بدون خزانة",
    csvUnassignedName: "الاسم",
    csvUnassignedDetails: "التفاصيل",
    csvSummary: "الملخص",
    csvTotalLockers: "إجمالي الخزائن",
    csvLockersInUse: "الخزائن المستخدمة",
    csvLockersFull: "الخزائن الممتلئة",
    csvLockersWithSpace: "خزائن بها مساحة متاحة",
    csvOpenSpots: "الأماكن المتاحة (إجمالي السعة المتبقية)",
    csvTotalEmployees: "إجمالي الموظفين",
    csvUnassignedCount: "الموظفون بدون خزانة",
    reportTitle: "تقرير غرفة الخزائن",
    generated: "تاريخ الإصدار",
    full: "ممتلئة",
    partial: "جزئية",
    empty: "فارغة",
    signOut: "تسجيل الخروج",
  },
};

const emptyState = (count) => ({
  lockerCount: count,
  lockers: Array.from({ length: count }, (_, i) => ({ id: i + 1, capacity: 1, employeeIds: [] })),
  employees: [],
});

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function empDetailLine(e, t) {
  const parts = [];
  if (e?.badge) parts.push(`${t.badge}: ${e.badge}`);
  if (e?.department) parts.push(`${t.department}: ${e.department}`);
  if (e?.phone) parts.push(`${t.phone}: ${e.phone}`);
  return parts.join(" · ");
}

export default function LockerRoom({ user, onSignOut }) {
  const [lang, setLang] = useState("en");
  const t = T[lang];
  const dir = lang === "ar" ? "rtl" : "ltr";

  const [state, setState] = useState(emptyState(DEFAULT_COUNT));
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [activeLocker, setActiveLocker] = useState(null);
  const [expandedEmpId, setExpandedEmpId] = useState(null);

  const [addModal, setAddModal] = useState({ open: false, lockerId: null });
  const [newName, setNewName] = useState("");
  const [newBadge, setNewBadge] = useState("");
  const [newDept, setNewDept] = useState("");
  const [newPhone, setNewPhone] = useState("");

  const [countInput, setCountInput] = useState(String(DEFAULT_COUNT));
  const [showSettings, setShowSettings] = useState(false);
  const saveTimer = useRef(null);
  const lastSavedJson = useRef(null);
  // Simple shared workspace: every logged-in user reads/writes the same locker room.
  const docRef = useMemo(() => doc(db, "shared", "lockerRoom"), []);

  // Live-sync from Firestore. lastSavedJson guards against re-applying our own writes.
  useEffect(() => {
    const unsub = onSnapshot(
      docRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          const json = JSON.stringify(data);
          if (data.lockers && data.lockerCount && json !== lastSavedJson.current) {
            setState(data);
            setCountInput(String(data.lockerCount));
          }
        }
        setLoaded(true);
      },
      (err) => {
        console.error("Firestore sync error", err);
        setLoaded(true);
      }
    );
    return unsub;
  }, [docRef]);

  useEffect(() => {
    if (!loaded) return;
    setSaving(true);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        const json = JSON.stringify(state);
        lastSavedJson.current = json;
        await setDoc(docRef, state);
      } catch (e) {
        console.error("Save failed", e);
      }
      setSaving(false);
    }, 400);
    return () => clearTimeout(saveTimer.current);
  }, [state, loaded, docRef]);

  const employeeById = useMemo(() => {
    const m = {};
    state.employees.forEach((e) => (m[e.id] = e));
    return m;
  }, [state.employees]);

  const assignedIds = useMemo(() => {
    const s = new Set();
    state.lockers.forEach((l) => l.employeeIds.forEach((id) => s.add(id)));
    return s;
  }, [state.lockers]);

  const unassigned = useMemo(
    () => state.employees.filter((e) => !assignedIds.has(e.id)),
    [state.employees, assignedIds]
  );

  const lockerOfEmployee = (empId) => state.lockers.find((l) => l.employeeIds.includes(empId));

  const matches = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.trim().toLowerCase();
    return state.employees
      .filter((e) => e.name.toLowerCase().includes(q))
      .map((e) => ({ employee: e, locker: lockerOfEmployee(e.id) }));
  }, [query, state.employees, state.lockers]);

  const stats = useMemo(() => {
    const assigned = state.lockers.filter((l) => l.employeeIds.length > 0).length;
    const full = state.lockers.filter((l) => l.employeeIds.length >= l.capacity).length;
    const totalCapacity = state.lockers.reduce((sum, l) => sum + l.capacity, 0);
    const totalFilled = state.lockers.reduce((sum, l) => sum + l.employeeIds.length, 0);
    const openSpots = totalCapacity - totalFilled;
    const lockersWithSpace = state.lockerCount - full;
    return { assigned, full, total: state.lockerCount, openSpots, lockersWithSpace };
  }, [state.lockers, state.lockerCount]);

  const MAX_FIELD_LEN = 80;
  const clamp = (s) => String(s ?? "").slice(0, MAX_FIELD_LEN);

  function applyLockerCount() {
    const n = Math.max(1, Math.min(300, parseInt(countInput, 10) || state.lockerCount));
    setState((s) => {
      const current = s.lockers;
      let next;
      if (n <= current.length) {
        next = current.slice(0, n);
      } else {
        const extra = Array.from({ length: n - current.length }, (_, i) => ({
          id: current.length + i + 1,
          capacity: 1,
          employeeIds: [],
        }));
        next = [...current, ...extra];
      }
      return { ...s, lockerCount: n, lockers: next };
    });
    setCountInput(String(n));
    setShowSettings(false);
  }

  function openAddModal(lockerId = null) {
    setNewName("");
    setNewBadge("");
    setNewDept("");
    setNewPhone("");
    setAddModal({ open: true, lockerId });
  }

  function closeAddModal() {
    setAddModal({ open: false, lockerId: null });
  }

  function submitAddEmployee() {
    const name = clamp(newName.trim());
    if (!name) return;
    if (state.employees.length >= 2000) return; // sane upper bound per workspace
    const newEmp = { id: uid(), name, badge: clamp(newBadge.trim()), department: clamp(newDept.trim()), phone: clamp(newPhone.trim()) };
    setState((s) => {
      const employees = [...s.employees, newEmp];
      let lockers = s.lockers;
      if (addModal.lockerId) {
        lockers = s.lockers.map((l) =>
          l.id === addModal.lockerId && l.employeeIds.length < l.capacity
            ? { ...l, employeeIds: [...l.employeeIds, newEmp.id] }
            : l
        );
      }
      return { ...s, employees, lockers };
    });
    closeAddModal();
  }

  function removeEmployeeEntirely(empId) {
    setState((s) => ({
      ...s,
      lockers: s.lockers.map((l) => ({ ...l, employeeIds: l.employeeIds.filter((id) => id !== empId) })),
      employees: s.employees.filter((e) => e.id !== empId),
    }));
  }

  function updateEmployeeDetails(empId, patch) {
    const cleanPatch = {};
    Object.keys(patch).forEach((k) => (cleanPatch[k] = clamp(patch[k])));
    setState((s) => ({
      ...s,
      employees: s.employees.map((e) => (e.id === empId ? { ...e, ...cleanPatch } : e)),
    }));
  }

  function toggleShared(lockerId) {
    setState((s) => ({
      ...s,
      lockers: s.lockers.map((l) => {
        if (l.id !== lockerId) return l;
        const newCap = l.capacity === 1 ? 2 : 1;
        return { ...l, capacity: newCap, employeeIds: l.employeeIds.slice(0, newCap) };
      }),
    }));
  }

  function assignToLocker(lockerId, empId) {
    setState((s) => {
      const locker = s.lockers.find((l) => l.id === lockerId);
      if (!locker || locker.employeeIds.includes(empId)) return s;
      if (locker.employeeIds.length >= locker.capacity) return s;
      return {
        ...s,
        lockers: s.lockers.map((l) => (l.id === lockerId ? { ...l, employeeIds: [...l.employeeIds, empId] } : l)),
      };
    });
  }

  function unassign(lockerId, empId) {
    setState((s) => ({
      ...s,
      lockers: s.lockers.map((l) =>
        l.id === lockerId ? { ...l, employeeIds: l.employeeIds.filter((id) => id !== empId) } : l
      ),
    }));
  }

  function statusFor(l) {
    if (l.employeeIds.length === 0) return t.empty;
    if (l.employeeIds.length >= l.capacity) return t.full;
    return t.partial;
  }

  function downloadCSV() {
    const rows = [t.csvHeaders];
    state.lockers.forEach((l) => {
      const emps = l.employeeIds.map((id) => employeeById[id]);
      rows.push([
        l.id,
        l.capacity,
        emps[0]?.name || "",
        emps[0] ? empDetailLine(emps[0], t) : "",
        emps[1]?.name || "",
        emps[1] ? empDetailLine(emps[1], t) : "",
        statusFor(l),
      ]);
    });
    rows.push([]);
    rows.push([t.csvUnassigned]);
    rows.push([t.csvUnassignedName, t.csvUnassignedDetails]);
    unassigned.forEach((e) => rows.push([e.name, empDetailLine(e, t)]));
    rows.push([]);
    rows.push([t.csvSummary]);
    rows.push([t.csvTotalLockers, state.lockerCount]);
    rows.push([t.csvLockersInUse, stats.assigned]);
    rows.push([t.csvLockersFull, stats.full]);
    rows.push([t.csvLockersWithSpace, stats.lockersWithSpace]);
    rows.push([t.csvTotalEmployees, state.employees.length]);
    rows.push([t.csvUnassignedCount, unassigned.length]);

    const sanitizeCell = (val) => {
      let s = String(val ?? "");
      if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; // neutralize spreadsheet formula injection
      return s;
    };
    const csv = rows.map((r) => r.map((c) => `"${sanitizeCell(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `locker-room-report-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function escapeHtml(str) {
    return String(str ?? "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    }[c]));
  }

  function statusColor(status) {
    if (status === t.full) return "#C1440E";
    if (status === t.partial) return "#D98E3B";
    return "#8A9A9D";
  }

  function exportPDF() {
    const rowsHtml = state.lockers
      .map((l) => {
        const emps = l.employeeIds.map((id) => employeeById[id]);
        const cell = (e) =>
          e
            ? `<div class="ename">${escapeHtml(e.name)}</div>${empDetailLine(e, t) ? `<div class="edetail">${escapeHtml(empDetailLine(e, t))}</div>` : ""}`
            : `<span class="dim">—</span>`;
        const status = statusFor(l);
        return `<tr><td class="num">${String(l.id).padStart(2, "0")}</td><td class="num">${l.capacity}</td><td>${cell(emps[0])}</td><td>${cell(emps[1])}</td><td class="num"><span class="status" style="color:${statusColor(status)}">${escapeHtml(status)}</span></td></tr>`;
      })
      .join("");

    const unassignedRowsHtml = unassigned
      .map((e) => `<tr><td>${escapeHtml(e.name)}</td><td>${empDetailLine(e, t) ? escapeHtml(empDetailLine(e, t)) : `<span class="dim">—</span>`}</td></tr>`)
      .join("");

    const fontImport =
      lang === "ar"
        ? "@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');"
        : "@import url('https://fonts.googleapis.com/css2?family=Oswald:wght@600;700&family=Inter:wght@400;600&display=swap');";
    const fontFamily = lang === "ar" ? "'Cairo', sans-serif" : "'Inter', sans-serif";
    const titleFamily = lang === "ar" ? "'Cairo', sans-serif" : "'Oswald', sans-serif";
    const alignStart = lang === "ar" ? "right" : "left";

    const summaryStats = [
      [t.csvTotalLockers, state.lockerCount],
      [t.csvLockersInUse, stats.assigned],
      [t.csvLockersFull, stats.full],
      [t.csvLockersWithSpace, stats.lockersWithSpace],
      [t.csvTotalEmployees, state.employees.length],
      [t.csvUnassignedCount, unassigned.length],
    ];
    const summaryCellsHtml = summaryStats
      .map(([label, value]) => `<div class="stat"><div class="stat-value">${escapeHtml(value)}</div><div class="stat-label">${escapeHtml(label)}</div></div>`)
      .join("");

    const html = `<!DOCTYPE html>
<html dir="${dir}" lang="${lang}">
<head>
<meta charset="utf-8" />
<title>${t.reportTitle}</title>
<style>
${fontImport}
* { box-sizing: border-box; }
body { font-family: ${fontFamily}; color: #1E2427; padding: 32px; }
h1 { font-family: ${titleFamily}; font-size: 24px; color: #2B3A42; margin-bottom: 2px; }
.meta { font-size: 12px; color: #6B7478; margin-bottom: 20px; }
table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
th, td { border: 1px solid #C7BFB0; padding: 7px 9px; font-size: 11.5px; text-align: ${alignStart}; vertical-align: top; }
th { background: #2B3A42; color: #F5F1EA; font-family: ${titleFamily}; font-size: 10.5px; letter-spacing: 0.03em; text-transform: uppercase; }
td.num { text-align: center; white-space: nowrap; }
.ename { font-weight: 600; }
.edetail { font-size: 10px; color: #6B7478; margin-top: 1px; }
.dim { color: #B7AF9F; }
.status { font-weight: 700; font-size: 11px; }
tr:nth-child(even) td { background: #F7F4EE; }
h2 { font-family: ${titleFamily}; font-size: 14px; color: #2B3A42; margin: 26px 0 8px; padding-bottom: 6px; border-bottom: 2px solid #2B3A42; }
.open-note { font-size: 11px; color: #6B7478; margin: -2px 0 12px; }
.stat-grid { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 4px; }
.stat { flex: 1 1 140px; background: #F5F1EA; border: 1px solid #DCD5C7; border-radius: 6px; padding: 10px 12px; }
.stat-value { font-family: ${titleFamily}; font-size: 20px; font-weight: 700; color: #2B3A42; }
.stat-label { font-size: 10px; color: #6B7478; margin-top: 2px; }
.space-banner { margin-top: 10px; background: #2B3A42; color: #F5F1EA; border-radius: 6px; padding: 12px 16px; display: flex; align-items: baseline; gap: 10px; }
.space-banner .n { font-family: ${titleFamily}; font-size: 26px; font-weight: 700; }
.space-banner .l { font-size: 11.5px; opacity: 0.85; }
@media print { body { padding: 12mm; } }
</style>
</head>
<body>
<h1>${t.reportTitle}</h1>
<div class="meta">${t.generated}: ${new Date().toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US")}</div>

<table>
<thead><tr><th>${t.csvHeaders[0]}</th><th>${t.csvHeaders[1]}</th><th>${t.csvHeaders[2]}</th><th>${t.csvHeaders[4]}</th><th>${t.csvHeaders[6]}</th></tr></thead>
<tbody>${rowsHtml}</tbody>
</table>

<h2>${t.csvUnassigned} (${unassigned.length})</h2>
${
  unassigned.length > 0
    ? `<table><thead><tr><th>${t.csvUnassignedName}</th><th>${t.csvUnassignedDetails}</th></tr></thead><tbody>${unassignedRowsHtml}</tbody></table>`
    : `<div class="open-note">${t.allHaveLockers}</div>`
}

<h2>${t.csvSummary}</h2>
<div class="stat-grid">${summaryCellsHtml}</div>
<div class="space-banner"><span class="n">${stats.lockersWithSpace}</span><span class="l">${t.csvLockersWithSpace}</span></div>

</body>
</html>`;

    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(html);
    w.document.close();
    w.onload = () => {
      w.focus();
      w.print();
    };
  }

  const active = state.lockers.find((l) => l.id === activeLocker);

  if (!loaded) {
    return (
      <div style={{ minHeight: "100vh", background: "#EAE5DC", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter', sans-serif", color: "#6B7478", fontSize: 14 }}>
        Loading your workspace…
      </div>
    );
  }

  return (
    <div
      dir={dir}
      style={{
        fontFamily: lang === "ar" ? "'Cairo', sans-serif" : "'Inter', sans-serif",
        background: "#EAE5DC",
        minHeight: "100%",
        color: "#1E2427",
        padding: "24px 20px 50px",
        position: "relative",
      }}
    >
      <div style={{ position: "absolute", top: 20, right: 20, zIndex: 30, display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 11.5, color: "#6B7478", maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={user.email}>
          {user.email}
        </span>
        <button
          className="lr-btn"
          onClick={() => setLang(lang === "en" ? "ar" : "en")}
          title="Language / اللغة"
          style={{ background: "#F5F1EA", border: "1px solid #C7BFB0", borderRadius: 6, padding: "8px 10px", display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#2B3A42" }}
        >
          <Globe size={14} /> {lang === "en" ? "العربية" : "English"}
        </button>
        <button
          className="lr-btn"
          onClick={onSignOut}
          title={t.signOut}
          style={{ background: "#F5F1EA", border: "1px solid #C7BFB0", borderRadius: 6, padding: "8px 10px", display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#B0463A" }}
        >
          <LogOut size={14} /> {t.signOut}
        </button>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Inter:wght@400;500;600;700&family=Cairo:wght@400;500;600;700&display=swap');
        .lr-title { font-family: ${lang === "ar" ? "'Cairo', sans-serif" : "'Oswald', sans-serif"}; letter-spacing: 0.02em; }
        .lr-door { position: relative; border-radius: 4px; cursor: pointer; transition: transform 0.15s ease, box-shadow 0.15s ease; }
        .lr-door:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(30,36,39,0.25); }
        .lr-btn { cursor: pointer; border: none; font-family: inherit; }
        .lr-scroll::-webkit-scrollbar { width: 6px; }
        .lr-scroll::-webkit-scrollbar-thumb { background: #C7BFB0; border-radius: 3px; }
      `}</style>

      {/* Top bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 14, marginBottom: 20, marginTop: 44 }}>
        <div>
          <div className="lr-title" style={{ fontSize: 27, fontWeight: 700, color: "#2B3A42" }}>
            {t.appTitle}
          </div>
          <div style={{ fontSize: 12.5, color: "#6B7478", marginTop: 3 }}>
            {t.stats(stats.assigned, stats.total, stats.full, unassigned.length)}
            {saving && <span style={{ marginInlineStart: 8, color: "#B08B3A" }}>{t.saving}</span>}
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ position: "relative", width: 200 }}>
            <Search size={15} style={{ position: "absolute", insetInlineStart: 9, top: 9, color: "#8A9A9D" }} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              style={{
                width: "100%",
                padding: `8px 9px 8px ${dir === "rtl" ? "9px" : "30px"}`,
                paddingInlineStart: 30,
                borderRadius: 6,
                border: "1px solid #C7BFB0",
                background: "#F5F1EA",
                fontSize: 13,
                outline: "none",
              }}
            />
            {matches.length > 0 && (
              <div
                className="lr-scroll"
                style={{
                  position: "absolute", top: 36, insetInlineStart: 0, insetInlineEnd: 0, background: "#FFFDF9",
                  border: "1px solid #C7BFB0", borderRadius: 6, maxHeight: 200, overflowY: "auto",
                  zIndex: 20, boxShadow: "0 8px 20px rgba(0,0,0,0.12)",
                }}
              >
                {matches.map(({ employee, locker }) => (
                  <div
                    key={employee.id}
                    onClick={() => { if (locker) setActiveLocker(locker.id); setQuery(""); }}
                    style={{ padding: "7px 9px", fontSize: 13, cursor: locker ? "pointer" : "default", borderBottom: "1px solid #EFEAE0", display: "flex", justifyContent: "space-between" }}
                  >
                    <span>{employee.name}</span>
                    <span style={{ color: "#8A9A9D" }}>{locker ? `#${locker.id}` : "—"}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            className="lr-btn"
            onClick={() => openAddModal(null)}
            style={{ background: "#2B3A42", color: "#F5F1EA", borderRadius: 6, padding: "8px 12px", display: "flex", alignItems: "center", gap: 6, fontSize: 13, whiteSpace: "nowrap" }}
          >
            <Plus size={14} /> {t.addEmployeeBtn}
          </button>

          <button
            className="lr-btn"
            onClick={() => setShowSettings(true)}
            style={{ background: "#F5F1EA", border: "1px solid #C7BFB0", borderRadius: 6, padding: "8px 10px", display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#2B3A42" }}
          >
            <Settings2 size={14} /> {t.lockersBtn(state.lockerCount)}
          </button>

          <button className="lr-btn" onClick={downloadCSV} style={{ background: "#2B3A42", color: "#F5F1EA", borderRadius: 6, padding: "8px 12px", display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
            <Download size={14} /> {t.exportCsv}
          </button>
          <button className="lr-btn" onClick={exportPDF} style={{ background: "#2B3A42", color: "#F5F1EA", borderRadius: 6, padding: "8px 12px", display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
            <FileText size={14} /> {t.exportPdf}
          </button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 24, alignItems: "flex-start", flexWrap: "wrap" }}>
        {/* Locker grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(78px, 1fr))", gap: 10, flex: "1 1 480px" }}>
          {state.lockers.map((locker) => {
            const count = locker.employeeIds.length;
            const isFull = count >= locker.capacity;
            const isEmpty = count === 0;
            const color = isEmpty ? "#3B4A52" : isFull ? "#C1440E" : "#D98E3B";
            return (
              <div key={locker.id} className="lr-door" onClick={() => setActiveLocker(locker.id)} style={{ background: color, height: 92, padding: "7px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span className="lr-title" style={{ color: "#F5F1EA", fontSize: 16, fontWeight: 600 }}>{String(locker.id).padStart(2, "0")}</span>
                  {isEmpty ? <Unlock size={12} color="#F5F1EA" opacity={0.7} /> : <Lock size={12} color="#F5F1EA" opacity={0.85} />}
                </div>
                <div style={{ fontSize: 10, color: "#F5F1EA", lineHeight: 1.3 }}>
                  {isEmpty ? (
                    <span style={{ opacity: 0.7 }}>{t.open}</span>
                  ) : (
                    locker.employeeIds.map((id) => (
                      <div key={id} style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {employeeById[id]?.name || "?"}
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Employee pool */}
        <div style={{ flex: "1 1 260px", minWidth: 260, maxWidth: 310, background: "#F5F1EA", border: "1px solid #DCD5C7", borderRadius: 8, padding: 14 }}>
          <div className="lr-title" style={{ fontSize: 13, fontWeight: 600, color: "#2B3A42", marginBottom: 8 }}>
            {t.employeesTitle}
          </div>

          <button
            className="lr-btn"
            onClick={() => openAddModal(null)}
            style={{
              width: "100%", background: "#2B3A42", color: "#F5F1EA", borderRadius: 6, padding: "8px 0",
              fontSize: 13, marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}
          >
            <Plus size={14} /> {t.addEmployeeBtn}
          </button>

          <div style={{ fontSize: 11, color: "#8A9A9D", marginBottom: 5 }}>{t.waiting(unassigned.length)}</div>
          <div className="lr-scroll" style={{ maxHeight: 280, overflowY: "auto" }}>
            {unassigned.length === 0 && <div style={{ fontSize: 12, color: "#A9A297", padding: "4px 2px" }}>{t.allHaveLockers}</div>}
            {unassigned.map((e) => (
              <div key={e.id} style={{ padding: "6px 8px", marginBottom: 4, background: "#FFFDF9", border: "1px solid #EFEAE0", borderRadius: 6, fontSize: 13 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <User size={12} color="#8A9A9D" /> {e.name}
                  </span>
                  <button className="lr-btn" onClick={() => removeEmployeeEntirely(e.id)} style={{ background: "none", color: "#B0463A", display: "flex" }}>
                    <Trash2 size={12} />
                  </button>
                </div>
                {empDetailLine(e, t) && <div style={{ fontSize: 10.5, color: "#8A9A9D", marginTop: 2 }}>{empDetailLine(e, t)}</div>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Settings modal */}
      {showSettings && (
        <div onClick={() => setShowSettings(false)} style={{ position: "fixed", inset: 0, background: "rgba(30,36,39,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60, padding: 16 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#F5F1EA", borderRadius: 10, width: 300, padding: 20, boxShadow: "0 20px 50px rgba(0,0,0,0.3)" }}>
            <div className="lr-title" style={{ fontSize: 16, fontWeight: 700, color: "#2B3A42", marginBottom: 10 }}>{t.settingsTitle}</div>
            <input
              type="number" min={1} max={500} value={countInput}
              onChange={(e) => setCountInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applyLockerCount()}
              style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #C7BFB0", fontSize: 14, outline: "none", marginBottom: 8 }}
            />
            <div style={{ fontSize: 11.5, color: "#8A9A9D", marginBottom: 14 }}>{t.settingsHint}</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="lr-btn" onClick={() => setShowSettings(false)} style={{ flex: 1, background: "transparent", border: "1px solid #C7BFB0", borderRadius: 6, padding: "8px 0", fontSize: 13, color: "#2B3A42" }}>{t.cancel}</button>
              <button className="lr-btn" onClick={applyLockerCount} style={{ flex: 1, background: "#2B3A42", color: "#F5F1EA", borderRadius: 6, padding: "8px 0", fontSize: 13 }}>{t.apply}</button>
            </div>
          </div>
        </div>
      )}

      {/* Add employee modal */}
      {addModal.open && (
        <div onClick={closeAddModal} style={{ position: "fixed", inset: 0, background: "rgba(30,36,39,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 70, padding: 16 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#F5F1EA", borderRadius: 10, width: 320, padding: 20, boxShadow: "0 20px 50px rgba(0,0,0,0.3)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div className="lr-title" style={{ fontSize: 16, fontWeight: 700, color: "#2B3A42" }}>{t.addEmployeeTitle}</div>
              <button className="lr-btn" onClick={closeAddModal} style={{ background: "none", color: "#6B7478" }}><X size={17} /></button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              <input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submitAddEmployee()}
                placeholder={t.namePlaceholder}
                maxLength={80}
                style={{ padding: "8px 10px", borderRadius: 6, border: "1px solid #C7BFB0", fontSize: 13.5, outline: "none" }}
              />
              <input value={newBadge} onChange={(e) => setNewBadge(e.target.value)} maxLength={80} placeholder={t.badgePlaceholder} style={{ padding: "8px 10px", borderRadius: 6, border: "1px solid #C7BFB0", fontSize: 13, outline: "none" }} />
              <input value={newDept} onChange={(e) => setNewDept(e.target.value)} maxLength={80} placeholder={t.departmentPlaceholder} style={{ padding: "8px 10px", borderRadius: 6, border: "1px solid #C7BFB0", fontSize: 13, outline: "none" }} />
              <input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} maxLength={80} placeholder={t.phonePlaceholder} style={{ padding: "8px 10px", borderRadius: 6, border: "1px solid #C7BFB0", fontSize: 13, outline: "none" }} />
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
              <button className="lr-btn" onClick={closeAddModal} style={{ flex: 1, background: "transparent", border: "1px solid #C7BFB0", borderRadius: 6, padding: "8px 0", fontSize: 13, color: "#2B3A42" }}>{t.cancel}</button>
              <button className="lr-btn" onClick={submitAddEmployee} style={{ flex: 1, background: "#2B3A42", color: "#F5F1EA", borderRadius: 6, padding: "8px 0", fontSize: 13 }}>{t.apply}</button>
            </div>
          </div>
        </div>
      )}

      {/* Locker detail modal */}
      {active && (
        <div onClick={() => { setActiveLocker(null); setExpandedEmpId(null); }} style={{ position: "fixed", inset: 0, background: "rgba(30,36,39,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 16 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#F5F1EA", borderRadius: 10, width: 360, maxWidth: "100%", padding: 20, boxShadow: "0 20px 50px rgba(0,0,0,0.3)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div className="lr-title" style={{ fontSize: 19, fontWeight: 700, color: "#2B3A42" }}>{t.lockerLabel(String(active.id).padStart(2, "0"))}</div>
              <button className="lr-btn" onClick={() => { setActiveLocker(null); setExpandedEmpId(null); }} style={{ background: "none", color: "#6B7478" }}><X size={17} /></button>
            </div>

            <button className="lr-btn" onClick={() => toggleShared(active.id)} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "#2B3A42", background: "#EFEAE0", border: "1px solid #C7BFB0", borderRadius: 6, padding: "6px 10px", marginBottom: 14, width: "100%" }}>
              {active.capacity === 2 ? <Users size={13} /> : <User size={13} />}
              {active.capacity === 2 ? t.sharedLocker : t.singleLocker}
            </button>

            <div style={{ fontSize: 11, color: "#8A9A9D", marginBottom: 6 }}>{t.assigned(active.employeeIds.length, active.capacity)}</div>
            <div style={{ marginBottom: 12 }}>
              {active.employeeIds.length === 0 && <div style={{ fontSize: 12.5, color: "#A9A297" }}>{t.emptyLocker}</div>}
              {active.employeeIds.map((id) => {
                const emp = employeeById[id];
                const isOpen = expandedEmpId === id;
                return (
                  <div key={id} style={{ background: "#FFFDF9", border: "1px solid #EFEAE0", borderRadius: 6, marginBottom: 5, overflow: "hidden" }}>
                    <div
                      onClick={() => setExpandedEmpId(isOpen ? null : id)}
                      style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 8px", fontSize: 13, cursor: "pointer" }}
                    >
                      <span>{emp?.name || "?"}</span>
                      <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <ChevronDown size={13} color="#8A9A9D" style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
                        <button className="lr-btn" onClick={(e) => { e.stopPropagation(); unassign(active.id, id); }} style={{ background: "none", color: "#B0463A" }}>
                          <X size={14} />
                        </button>
                      </span>
                    </div>
                    {isOpen && (
                      <div style={{ padding: "0 8px 10px", display: "flex", flexDirection: "column", gap: 5 }}>
                        <input
                          value={emp?.badge || ""}
                          onChange={(e) => updateEmployeeDetails(id, { badge: e.target.value })}
                          placeholder={t.badgePlaceholder}
                          style={{ padding: "6px 8px", borderRadius: 5, border: "1px solid #EFEAE0", fontSize: 12, outline: "none" }}
                        />
                        <input
                          value={emp?.department || ""}
                          onChange={(e) => updateEmployeeDetails(id, { department: e.target.value })}
                          placeholder={t.departmentPlaceholder}
                          style={{ padding: "6px 8px", borderRadius: 5, border: "1px solid #EFEAE0", fontSize: 12, outline: "none" }}
                        />
                        <input
                          value={emp?.phone || ""}
                          onChange={(e) => updateEmployeeDetails(id, { phone: e.target.value })}
                          placeholder={t.phonePlaceholder}
                          style={{ padding: "6px 8px", borderRadius: 5, border: "1px solid #EFEAE0", fontSize: 12, outline: "none" }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {active.employeeIds.length < active.capacity && (
              <>
                <div style={{ fontSize: 11, color: "#8A9A9D", marginBottom: 6 }}>{t.assign}</div>
                <button
                  className="lr-btn"
                  onClick={() => openAddModal(active.id)}
                  style={{
                    width: "100%", background: "#EFEAE0", color: "#2B3A42", border: "1px solid #C7BFB0", borderRadius: 6,
                    padding: "7px 0", fontSize: 12.5, marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  }}
                >
                  <Plus size={13} /> {t.addEmployeeBtn}
                </button>
                <div className="lr-scroll" style={{ maxHeight: 150, overflowY: "auto" }}>
                  {unassigned.length === 0 && <div style={{ fontSize: 12.5, color: "#A9A297" }}>{t.noOneWaiting}</div>}
                  {unassigned.map((e) => (
                    <div key={e.id} onClick={() => assignToLocker(active.id, e.id)} style={{ padding: "7px 8px", borderRadius: 6, marginBottom: 5, fontSize: 13, cursor: "pointer", border: "1px solid #EFEAE0", background: "#FFFDF9" }}>
                      {e.name}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
