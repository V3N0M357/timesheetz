"use client";

import { useState, useEffect } from "react";
import { addWorkEntryAction, deleteWorkEntryAction, updateWorkEntryAction, addMultipleWorkEntriesAction, generateAIDescriptionAction, refineAllDescriptionsAction } from "./actions/workActions";
import { Clock, DollarSign, Search, Trash2, Plus, Calendar, Briefcase, TrendingUp, Download, Mail, Edit2, Check, X, Layers, Filter, FileText, Sparkles, Sliders } from "lucide-react";

interface WorkEntry {
  id: string;
  user_id: string;
  work_date: string;
  hours: number;
  hourly_rate: number;
  description: string;
  created_at: string;
}

interface DashboardClientProps {
  initialEntries: WorkEntry[];
}

export default function DashboardClient({ initialEntries }: DashboardClientProps) {
  const [entries, setEntries] = useState<WorkEntry[]>(initialEntries);
  const [searchQuery, setSearchQuery] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isRefiningAll, setIsRefiningAll] = useState(false);
  const [massAddLoadingIndex, setMassAddLoadingIndex] = useState<number | null>(null);

  // Single Add Work Session Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Inline Editing States
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editWorkDate, setEditWorkDate] = useState("");
  const [editHours, setEditHours] = useState("");
  const [editHourlyRate, setEditHourlyRate] = useState("");
  const [editDescription, setEditDescription] = useState("");

  // Mass Add Modal States
  const [isMassAddOpen, setIsMassAddOpen] = useState(false);
  const [massAddRows, setMassAddRows] = useState<Array<{
    work_date: string;
    hours: string;
    hourly_rate: string;
    description: string;
  }>>([]);
  const [massAddError, setMassAddError] = useState<string | null>(null);
  const [isBatchSaving, setIsBatchSaving] = useState(false);

  // Filter States
  const [timePeriod, setTimePeriod] = useState("all"); // all, this-month, last-month, this-year, last-year
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [hoursFilter, setHoursFilter] = useState("all"); // all, under-2, 2-5, 5-8, over-8
  const [sortBy, setSortBy] = useState("date-desc"); // date-desc, date-asc, earned-desc, earned-asc, hours-desc, hours-asc

  // Get current date in YYYY-MM-DD format
  const getTodayDateString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Form states
  const [workDate, setWorkDate] = useState(getTodayDateString());
  const [hours, setHours] = useState("");
  const [hourlyRate, setHourlyRate] = useState("30");
  const [description, setDescription] = useState("");

  // Custom AI Prompt state
  const [customAIPrompt, setCustomAIPrompt] = useState("");
  const [showPromptInput, setShowPromptInput] = useState(false);

  // AI Description Generator for single form
  const handleGenerateAIDescription = async () => {
    setIsGeneratingAI(true);
    const pastDescs = entries.map((e) => e.description);
    try {
      const res = await generateAIDescriptionAction(pastDescs, customAIPrompt);
      if (res && res.description) {
        setDescription(res.description);
      }
    } catch (err) {
      console.error("AI Generator Error:", err);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // AI Description Generator for Mass Add Modal
  const handleMassGenerateAI = async (index: number) => {
    setMassAddLoadingIndex(index);
    const pastDescs = entries.map((e) => e.description);
    try {
      const res = await generateAIDescriptionAction(pastDescs, customAIPrompt);
      if (res && res.description) {
        updateMassRow(index, "description", res.description);
      }
    } catch (err) {
      console.error("Mass AI Generator Error:", err);
    } finally {
      setMassAddLoadingIndex(null);
    }
  };

  // Format currency helper
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  // AI Refine All Descriptions Handler
  const handleRefineAll = async () => {
    if (entries.length === 0) return;
    setIsRefiningAll(true);
    setFormError(null);

    try {
      const payload = entries.map((e) => ({ id: e.id, description: e.description }));
      const res = await refineAllDescriptionsAction(payload);
      if (res && res.error) {
        setFormError(res.error);
      } else if (res && res.updatedEntries) {
        const updateMap = new Map(res.updatedEntries.map((item) => [item.id, item.description]));
        setEntries((prev) =>
          prev.map((e) => ({
            ...e,
            description: updateMap.get(e.id) || e.description
          }))
        );
      }
    } catch (err) {
      setFormError("Failed to refine descriptions due to a network error.");
    } finally {
      setIsRefiningAll(false);
    }
  };

  // 1. Single Add Entry handler
  const handleAddEntry = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);

    const targetDate = workDate || getTodayDateString();
    const targetHours = hours.trim();
    const targetRate = hourlyRate.trim() || "30";
    const targetDesc = description.trim();

    if (!targetDate || !targetHours || !targetDesc) {
      setFormError("Please fill in hours worked and activity description.");
      return;
    }

    const parsedHours = parseFloat(targetHours);
    const parsedRate = parseFloat(targetRate);

    if (isNaN(parsedHours) || parsedHours <= 0) {
      setFormError("Hours worked must be a positive number.");
      return;
    }

    setIsAdding(true);

    const formData = new FormData();
    formData.append("work_date", targetDate);
    formData.append("hours", targetHours);
    formData.append("hourly_rate", targetRate);
    formData.append("description", targetDesc);

    try {
      const res = await addWorkEntryAction(null, formData);
      if (res && res.error) {
        setFormError(res.error);
        setIsAdding(false);
      } else {
        if (res && res.entry) {
          setEntries((prev) => [res.entry, ...prev]);
        } else {
          const newEntry: WorkEntry = {
            id: Math.random().toString(),
            user_id: "default-user",
            work_date: targetDate,
            hours: parsedHours,
            hourly_rate: parsedRate,
            description: targetDesc,
            created_at: new Date().toISOString(),
          };
          setEntries((prev) => [newEntry, ...prev]);
        }
        
        // Reset dynamic inputs & close popup modal
        setHours("");
        setDescription("");
        setIsAdding(false);
        setIsAddModalOpen(false);
      }
    } catch (err) {
      setFormError("Failed to add entry. Connection error.");
      setIsAdding(false);
    }
  };

  // 2. Delete Entry handler
  const handleDeleteEntry = async (id: string) => {
    if (!id) return;
    const targetId = String(id).trim();

    // Optimistically remove from local UI state immediately
    setEntries((prev) => prev.filter((entry) => String(entry.id).trim() !== targetId));

    try {
      const res = await deleteWorkEntryAction(targetId);
      if (res && res.error) {
        setFormError(res.error);
      }
    } catch (err) {
      console.error("Failed to delete entry on server:", err);
    }
  };

  // 3. Inline Edit Triggers
  const startEdit = (entry: WorkEntry) => {
    setEditingId(entry.id);
    setEditWorkDate(entry.work_date);
    setEditHours(entry.hours.toString());
    setEditHourlyRate(entry.hourly_rate.toString());
    setEditDescription(entry.description);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = async (id: string) => {
    if (!editWorkDate || !editHours || !editHourlyRate || !editDescription) {
      alert("Please fill in all editing fields");
      return;
    }

    const updatedHours = parseFloat(editHours);
    const updatedRate = parseFloat(editHourlyRate);

    if (isNaN(updatedHours) || updatedHours <= 0 || isNaN(updatedRate) || updatedRate < 0) {
      alert("Invalid numeric entries for hours or rate");
      return;
    }

    const previousEntries = [...entries];
    
    // Optimistically update locally
    setEntries(entries.map((e) => e.id === id ? {
      ...e,
      work_date: editWorkDate,
      hours: updatedHours,
      hourly_rate: updatedRate,
      description: editDescription
    } : e));

    setEditingId(null);

    const formData = new FormData();
    formData.append("work_date", editWorkDate);
    formData.append("hours", editHours);
    formData.append("hourly_rate", editHourlyRate);
    formData.append("description", editDescription);

    try {
      const res = await updateWorkEntryAction(id, formData);
      if (res && res.error) {
        alert(res.error);
        setEntries(previousEntries);
      }
    } catch (err) {
      alert("Failed to save changes due to a network error.");
      setEntries(previousEntries);
    }
  };

  // 4. CSV Downloader
  const getCSVFilename = () => {
    const dateToday = new Date().toISOString().split("T")[0];
    if (fromDate || toDate) {
      const start = fromDate || "start";
      const end = toDate || "end";
      return `timesheet_${start}_to_${end}.csv`;
    }
    if (timePeriod !== "all") {
      return `timesheet_${timePeriod}.csv`;
    }
    return `timesheet_all_time_${dateToday}.csv`;
  };

  const getDownloadButtonLabel = () => {
    if (fromDate || toDate) return "Download Range CSV";
    if (timePeriod !== "all") {
      if (timePeriod === "this-month") return "Download This Month CSV";
      if (timePeriod === "last-month") return "Download Last Month CSV";
      if (timePeriod === "this-year") return "Download This Year CSV";
      if (timePeriod === "last-year") return "Download Last Year CSV";
    }
    return "Download All CSV";
  };

  const downloadCSV = () => {
    if (filteredEntries.length === 0) {
      alert("No data available to export matching current filters.");
      return;
    }
    
    const headers = ["Date Worked", "Hours Worked", "Hourly Rate ($)", "What I Did", "Total Earned ($)"];
    const rows = filteredEntries.map((entry) => [
      entry.work_date,
      entry.hours,
      entry.hourly_rate,
      `"${entry.description.replace(/"/g, '""')}"`,
      entry.hours * entry.hourly_rate,
    ]);

    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", getCSVFilename());
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadPDF = () => {
    if (filteredEntries.length === 0) {
      alert("No data available to print matching current filters.");
      return;
    }
    const originalTitle = document.title;
    const filterDesc = timePeriod !== "all" ? `_${timePeriod}` : (fromDate || toDate ? "_filtered_range" : "");
    document.title = `Timesheet_Report${filterDesc}_${new Date().toISOString().split("T")[0]}`;
    window.print();
    document.title = originalTitle;
  };

  // 5. Email timesheet composer
  const emailTimesheet = () => {
    if (filteredEntries.length === 0) {
      alert("No entries to email.");
      return;
    }

    const recipient = prompt("Enter recipient email address (optional):") || "";
    const subject = encodeURIComponent("Timesheet Work Summary");

    let bodyText = "Work Timesheet Log:\n\n";
    filteredEntries.forEach((entry) => {
      bodyText += `Date: ${entry.work_date}\n`;
      bodyText += `Hours: ${entry.hours} hrs\n`;
      bodyText += `Rate: ${formatCurrency(entry.hourly_rate)}/hr\n`;
      bodyText += `Activity: ${entry.description}\n`;
      bodyText += `Total Earned: ${formatCurrency(entry.hours * entry.hourly_rate)}\n`;
      bodyText += `----------------------------------------\n\n`;
    });

    bodyText += `TOTALS:\n`;
    bodyText += `Total Hours: ${totalHours.toFixed(1)} hrs\n`;
    bodyText += `Total Earnings: ${formatCurrency(totalEarnings)}\n`;
    bodyText += `Average Hourly Rate: ${formatCurrency(averageHourlyRate)}/hr\n`;

    window.location.href = `mailto:${recipient}?subject=${subject}&body=${encodeURIComponent(bodyText)}`;
  };

  // 6. Bulk Add Modals Triggers
  const openMassAdd = () => {
    // Start with 3 prefilled rows
    setMassAddRows([
      { work_date: getTodayDateString(), hours: "", hourly_rate: hourlyRate || "30", description: "" },
      { work_date: getTodayDateString(), hours: "", hourly_rate: hourlyRate || "30", description: "" },
      { work_date: getTodayDateString(), hours: "", hourly_rate: hourlyRate || "30", description: "" }
    ]);
    setMassAddError(null);
    setIsMassAddOpen(true);
  };

  const closeMassAdd = () => {
    setIsMassAddOpen(false);
  };

  const addMassRow = () => {
    const lastRate = massAddRows[massAddRows.length - 1]?.hourly_rate || "30";
    setMassAddRows([...massAddRows, { work_date: getTodayDateString(), hours: "", hourly_rate: lastRate, description: "" }]);
  };

  const removeMassRow = (index: number) => {
    if (massAddRows.length === 1) return;
    setMassAddRows(massAddRows.filter((_, idx) => idx !== index));
  };

  const updateMassRow = (index: number, field: string, value: string) => {
    setMassAddRows(massAddRows.map((row, idx) => idx === index ? { ...row, [field]: value } : row));
  };

  const handleMassSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMassAddError(null);

    const validEntries = [];
    for (let i = 0; i < massAddRows.length; i++) {
      const row = massAddRows[i];
      if (!row.work_date || !row.hours || !row.hourly_rate || !row.description.trim()) {
        setMassAddError(`Please fill in all fields for Row #${i + 1}`);
        return;
      }

      const parsedHours = parseFloat(row.hours);
      const parsedRate = parseFloat(row.hourly_rate);

      if (isNaN(parsedHours) || parsedHours <= 0 || isNaN(parsedRate) || parsedRate < 0) {
        setMassAddError(`Invalid numbers in Row #${i + 1}. Hours and Rate must be positive.`);
        return;
      }

      validEntries.push({
        work_date: row.work_date,
        hours: parsedHours,
        hourly_rate: parsedRate,
        description: row.description.trim()
      });
    }

    setIsBatchSaving(true);

    try {
      const res = await addMultipleWorkEntriesAction(validEntries);
      if (res && res.error) {
        setMassAddError(res.error);
        setIsBatchSaving(false);
      } else {
        if (res && res.entries) {
          setEntries((prev) => [...res.entries, ...prev]);
        } else {
          const mappedLocal: WorkEntry[] = validEntries.map(ent => ({
            id: Math.random().toString(),
            user_id: "default-user",
            work_date: ent.work_date,
            hours: ent.hours,
            hourly_rate: ent.hourly_rate,
            description: ent.description,
            created_at: new Date().toISOString()
          }));
          setEntries((prev) => [...mappedLocal, ...prev]);
        }

        setIsBatchSaving(false);
        setIsMassAddOpen(false);
      }
    } catch (err) {
      setMassAddError("Connection error while saving batch logs.");
      setIsBatchSaving(false);
    }
  };

  // Date parsing helper that converts YYYY-MM-DD, ISO timestamps, or MM/DD/YYYY to a normalized Date object at midnight local time
  const parseEntryDateObject = (dateStr: string): Date | null => {
    if (!dateStr) return null;
    const isoMatch = dateStr.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (isoMatch) {
      const y = parseInt(isoMatch[1], 10);
      const m = parseInt(isoMatch[2], 10) - 1;
      const d = parseInt(isoMatch[3], 10);
      return new Date(y, m, d);
    }
    const usMatch = dateStr.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
    if (usMatch) {
      const m = parseInt(usMatch[1], 10) - 1;
      const d = parseInt(usMatch[2], 10);
      const y = parseInt(usMatch[3], 10);
      return new Date(y, m, d);
    }
    const parsedDate = new Date(dateStr);
    if (!isNaN(parsedDate.getTime())) {
      return new Date(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate());
    }
    return null;
  };

  const parseEntryDate = (dateStr: string): { year: number; month: number; day: number } | null => {
    const d = parseEntryDateObject(dateStr);
    if (!d) return null;
    return {
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      day: d.getDate(),
    };
  };

  // Helper: check if a date falls in a selected time period
  const isInTimePeriod = (dateStr: string) => {
    if (!dateStr || timePeriod === "all") return true;

    const entryDate = parseEntryDateObject(dateStr);
    if (!entryDate) return true;

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const currentYear = startOfToday.getFullYear();
    const currentMonth = startOfToday.getMonth(); // 0-11

    if (timePeriod === "this-month") {
      return entryDate.getFullYear() === currentYear && entryDate.getMonth() === currentMonth;
    }
    if (timePeriod === "last-month") {
      const targetMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const targetYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      return entryDate.getFullYear() === targetYear && entryDate.getMonth() === targetMonth;
    }
    if (timePeriod === "last-30-days") {
      const diffTime = startOfToday.getTime() - entryDate.getTime();
      const diffDays = Math.round(diffTime / (1000 * 3600 * 24));
      return diffDays >= 0 && diffDays <= 30;
    }
    if (timePeriod === "last-60-days") {
      const diffTime = startOfToday.getTime() - entryDate.getTime();
      const diffDays = Math.round(diffTime / (1000 * 3600 * 24));
      return diffDays >= 0 && diffDays <= 60;
    }
    if (timePeriod === "last-90-days") {
      const diffTime = startOfToday.getTime() - entryDate.getTime();
      const diffDays = Math.round(diffTime / (1000 * 3600 * 24));
      return diffDays >= 0 && diffDays <= 90;
    }
    if (timePeriod === "this-year") {
      return entryDate.getFullYear() === currentYear;
    }
    if (timePeriod === "last-year") {
      return entryDate.getFullYear() === currentYear - 1;
    }
    // Specific month format "YYYY-MM"
    if (timePeriod.includes("-")) {
      const [reqYear, reqMonth] = timePeriod.split("-").map((n) => parseInt(n, 10));
      if (reqYear && reqMonth) {
        return entryDate.getFullYear() === reqYear && (entryDate.getMonth() + 1) === reqMonth;
      }
    }

    return true;
  };

  // Dynamic calculation of unique logged months present in entries
  const availableMonths = Array.from(
    new Set(
      entries
        .map((e) => {
          const p = parseEntryDate(e.work_date);
          return p ? `${p.year}-${String(p.month).padStart(2, "0")}` : null;
        })
        .filter(Boolean) as string[]
    )
  ).sort((a, b) => b.localeCompare(a));

  // Helper: check if hours match filter criteria
  const matchesHoursFilter = (hoursVal: number) => {
    if (hoursFilter === "all") return true;
    if (hoursFilter === "under-2") return hoursVal < 2;
    if (hoursFilter === "2-5") return hoursVal >= 2 && hoursVal <= 5;
    if (hoursFilter === "5-8") return hoursVal > 5 && hoursVal <= 8;
    if (hoursFilter === "over-8") return hoursVal > 8;
    return true;
  };

  // Helper: check if any filters are currently active
  const isAnyFilterActive =
    timePeriod !== "all" ||
    fromDate !== "" ||
    toDate !== "" ||
    hoursFilter !== "all" ||
    searchQuery.trim() !== "";

  const resetAllFilters = () => {
    setTimePeriod("all");
    setFromDate("");
    setToDate("");
    setHoursFilter("all");
    setSearchQuery("");
  };

  // Apply filters: Search, Period, Custom Dates, and Hours
  const filteredEntries = entries
    .filter((entry) => {
      // 1. Text Search Filter (Matches Description or Date)
      const matchesSearch =
        searchQuery.trim() === "" ||
        entry.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.work_date.includes(searchQuery);

      // 2. Preset Time Period Filter
      const matchesPeriod = isInTimePeriod(entry.work_date);

      // 3. Custom Date Range Filters (Robust timestamp comparison)
      const entryDateObj = parseEntryDateObject(entry.work_date);
      const fromDateObj = fromDate ? parseEntryDateObject(fromDate) : null;
      const toDateObj = toDate ? parseEntryDateObject(toDate) : null;

      const matchesFromDate =
        !fromDateObj || !entryDateObj
          ? true
          : entryDateObj.getTime() >= fromDateObj.getTime();

      const matchesToDate =
        !toDateObj || !entryDateObj
          ? true
          : entryDateObj.getTime() <= toDateObj.getTime();

      // 4. Hours worked Filter
      const matchesHours = matchesHoursFilter(entry.hours);

      return matchesSearch && matchesPeriod && matchesFromDate && matchesToDate && matchesHours;
    })
    .sort((a, b) => {
      // Apply Sorting
      if (sortBy === "date-desc") {
        return b.work_date.localeCompare(a.work_date) || b.created_at.localeCompare(a.created_at);
      }
      if (sortBy === "date-asc") {
        return a.work_date.localeCompare(b.work_date) || a.created_at.localeCompare(a.created_at);
      }
      if (sortBy === "earned-desc") {
        return (b.hours * b.hourly_rate) - (a.hours * a.hourly_rate);
      }
      if (sortBy === "earned-asc") {
        return (a.hours * a.hourly_rate) - (b.hours * b.hourly_rate);
      }
      if (sortBy === "hours-desc") {
        return b.hours - a.hours;
      }
      if (sortBy === "hours-asc") {
        return a.hours - b.hours;
      }
      return 0;
    });

  // Calculate Metrics based on filtered records
  const totalHours = filteredEntries.reduce((sum, entry) => sum + entry.hours, 0);
  const totalEarnings = filteredEntries.reduce((sum, entry) => sum + (entry.hours * entry.hourly_rate), 0);
  const averageHourlyRate = totalHours > 0 ? totalEarnings / totalHours : 0;

  return (
    <>
      <div className="no-print" style={{ maxWidth: "1200px", margin: "0 auto", padding: "0.5rem 1.25rem 1.5rem 1.25rem" }}>
      {/* Header Panel */}
      <header className="glass-panel animate-fade-in" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.25rem 2rem", marginBottom: "1.25rem" }}>
        <div>
          <h1 style={{ fontSize: "1.25rem", fontWeight: "700", color: "var(--text-main)" }}>
            Timesheetz
          </h1>
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.1rem" }}>
            Scenic Work Tracker
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <button
            className="btn btn-accent"
            onClick={handleRefineAll}
            disabled={isRefiningAll || entries.length === 0}
            style={{ display: "flex", alignItems: "center", gap: "0.35rem", padding: "0.5rem 1rem", fontSize: "0.85rem" }}
            title="Refine spelling, grammar, capitalization, and punctuation for all work logs"
          >
            <Sparkles size={14} className={isRefiningAll ? "animate-spin" : ""} />
            <span>{isRefiningAll ? "Refining Logs..." : "Refine All Logs"}</span>
          </button>
          <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)} style={{ display: "flex", alignItems: "center", gap: "0.35rem", padding: "0.5rem 1rem", fontSize: "0.85rem" }}>
            <Plus size={16} />
            <span>Log New Session</span>
          </button>
          <button className="btn" onClick={openMassAdd} style={{ display: "flex", alignItems: "center", gap: "0.35rem", padding: "0.5rem 1rem", fontSize: "0.85rem", border: "1.5px solid var(--accent)", color: "var(--accent)" }}>
            <Layers size={14} />
            <span>Mass Add</span>
          </button>
        </div>
      </header>

      {/* Metrics Cards Grid */}
      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem", marginBottom: "2rem" }}>
        {/* Earnings Card */}
        <div className="glass-panel animate-fade-in" style={{ padding: "1.5rem", display: "flex", alignItems: "center", gap: "1.25rem" }}>
          <div style={{ padding: "0.75rem", borderRadius: "8px", background: "var(--success-bg)", color: "var(--success)" }}>
            <DollarSign size={24} />
          </div>
          <div>
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" }}>Total Earnings</p>
            <h2 style={{ fontSize: "1.75rem", fontWeight: "700", color: "var(--success)", marginTop: "0.15rem" }}>{formatCurrency(totalEarnings)}</h2>
          </div>
        </div>

        {/* Hours Card */}
        <div className="glass-panel animate-fade-in" style={{ padding: "1.5rem", display: "flex", alignItems: "center", gap: "1.25rem" }}>
          <div style={{ padding: "0.75rem", borderRadius: "8px", background: "var(--primary-glow)", color: "var(--primary)" }}>
            <Clock size={24} />
          </div>
          <div>
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" }}>Total Hours</p>
            <h2 style={{ fontSize: "1.75rem", fontWeight: "700", color: "var(--primary)", marginTop: "0.15rem" }}>{totalHours.toFixed(1)} hrs</h2>
          </div>
        </div>

        {/* Average Rate Card */}
        <div className="glass-panel animate-fade-in" style={{ padding: "1.5rem", display: "flex", alignItems: "center", gap: "1.25rem" }}>
          <div style={{ padding: "0.75rem", borderRadius: "8px", background: "var(--accent-glow)", color: "var(--accent)" }}>
            <TrendingUp size={24} />
          </div>
          <div>
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" }}>Average Rate</p>
            <h2 style={{ fontSize: "1.75rem", fontWeight: "700", color: "var(--accent)", marginTop: "0.15rem" }}>{formatCurrency(averageHourlyRate)}<span style={{ fontSize: "0.85rem", fontWeight: "500", color: "var(--text-muted)" }}>/hr</span></h2>
          </div>
        </div>
      </section>

      {/* History Log Section */}
      <section className="glass-panel animate-fade-in" style={{ padding: "2rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", marginBottom: "1rem" }}>
          <h3 style={{ fontSize: "1.1rem", fontWeight: "700" }}>Work History Log</h3>
          
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button className="btn" onClick={downloadCSV} title="Export spreadsheet data" style={{ display: "flex", alignItems: "center", gap: "0.35rem", padding: "0.45rem 0.85rem", fontSize: "0.8rem" }}>
              <Download size={14} />
              <span>{getDownloadButtonLabel()}</span>
            </button>
            <button className="btn" onClick={downloadPDF} title="Download printable PDF report" style={{ display: "flex", alignItems: "center", gap: "0.35rem", padding: "0.45rem 0.85rem", fontSize: "0.8rem" }}>
              <FileText size={14} />
              <span>Download PDF</span>
            </button>
            <button className="btn" onClick={emailTimesheet} title="Send work report by email" style={{ display: "flex", alignItems: "center", gap: "0.35rem", padding: "0.45rem 0.85rem", fontSize: "0.8rem" }}>
              <Mail size={14} />
              <span>Email Report</span>
            </button>
          </div>
        </div>

        {/* Filter Controls Panel */}
        <div className="filter-panel animate-fade-in">
          <div className="filter-group">
            <span className="filter-label">
              <Calendar size={12} style={{ marginRight: "4px", display: "inline" }} />
              Time Period
            </span>
            <select
              value={timePeriod}
              onChange={(e) => {
                setTimePeriod(e.target.value);
                setFromDate("");
                setToDate("");
              }}
              className="filter-select"
            >
              <option value="all">All Logged History</option>
              <option value="this-month">This Month ({new Date().toLocaleString('default', { month: 'short' })})</option>
              <option value="last-month">Last Month</option>
              <option value="last-30-days">Past 30 Days</option>
              <option value="last-60-days">Past 60 Days</option>
              <option value="last-90-days">Past 90 Days</option>
              <option value="this-year">This Year ({new Date().getFullYear()})</option>
              <option value="last-year">Last Year ({new Date().getFullYear() - 1})</option>
              {availableMonths.length > 0 && (
                <optgroup label="Specific Logged Months">
                  {availableMonths.map((m) => {
                    const [y, mon] = m.split("-");
                    const d = new Date(parseInt(y, 10), parseInt(mon, 10) - 1, 1);
                    const label = d.toLocaleString("default", { month: "long", year: "numeric" });
                    return (
                      <option key={m} value={m}>
                        {label}
                      </option>
                    );
                  })}
                </optgroup>
              )}
            </select>
          </div>

          <div className="filter-group">
            <span className="filter-label">From Date</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setTimePeriod("all");
              }}
              className="filter-select"
              style={{ padding: "0.45rem 0.65rem" }}
            />
          </div>

          <div className="filter-group">
            <span className="filter-label">To Date</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setTimePeriod("all");
              }}
              className="filter-select"
              style={{ padding: "0.45rem 0.65rem" }}
            />
          </div>

          <div className="filter-group">
            <span className="filter-label">
              <Clock size={12} style={{ marginRight: "4px", display: "inline" }} />
              Hours Worked
            </span>
            <select
              value={hoursFilter}
              onChange={(e) => setHoursFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Hours</option>
              <option value="under-2">&lt; 2 hrs</option>
              <option value="2-5">2 - 5 hrs</option>
              <option value="5-8">5 - 8 hrs</option>
              <option value="over-8">&gt; 8 hrs</option>
            </select>
          </div>

          <div className="filter-group">
            <span className="filter-label">Sort By</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="filter-select"
            >
              <option value="date-desc">Date (Newest)</option>
              <option value="date-asc">Date (Oldest)</option>
              <option value="earned-desc">Earnings (High to Low)</option>
              <option value="earned-asc">Earnings (Low to High)</option>
              <option value="hours-desc">Hours (High to Low)</option>
              <option value="hours-asc">Hours (Low to High)</option>
            </select>
          </div>

          <div className="filter-group" style={{ flex: "1 1 180px", maxWidth: "260px", marginLeft: "auto" }}>
            <span className="filter-label">Search Activity</span>
            <div style={{ position: "relative", width: "100%" }}>
              <Search size={14} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              <input
                type="text"
                placeholder="Type keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field"
                style={{ paddingLeft: "2.1rem", fontSize: "0.85rem", paddingTop: "0.45rem", paddingBottom: "0.45rem" }}
              />
            </div>
          </div>

          {isAnyFilterActive && (
            <div style={{ display: "flex", alignItems: "flex-end" }}>
              <button
                className="btn"
                onClick={resetAllFilters}
                style={{
                  fontSize: "0.75rem",
                  padding: "0.45rem 0.75rem",
                  color: "#ef4444",
                  borderColor: "rgba(239, 68, 68, 0.4)",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.25rem",
                  whiteSpace: "nowrap"
                }}
                title="Reset all search and date filters"
              >
                <X size={12} />
                <span>Clear Filters</span>
              </button>
            </div>
          )}
        </div>

        {/* Entries Table */}
        {filteredEntries.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem 1.5rem", color: "var(--text-muted)" }}>
            <p>No work entries found matching your criteria.</p>
            {entries.length === 0 && <p style={{ fontSize: "0.85rem", marginTop: "0.5rem" }}>Start by adding a work log using the form above!</p>}
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Date Worked</th>
                  <th>Hours Worked</th>
                  <th>Hourly Rate</th>
                  <th>What I Did</th>
                  <th>Total Earned</th>
                  <th style={{ width: "120px", textAlign: "center" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEntries.map((entry) => (
                  <tr key={entry.id}>
                    {/* Inline Edit Checking */}
                    {editingId === entry.id ? (
                      <>
                        <td>
                          <input
                            type="date"
                            value={editWorkDate}
                            onChange={(e) => setEditWorkDate(e.target.value)}
                            className="input-field"
                            style={{ padding: "0.35rem 0.5rem", fontSize: "0.8rem" }}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            step="0.1"
                            min="0.1"
                            value={editHours}
                            onChange={(e) => setEditHours(e.target.value)}
                            className="input-field"
                            style={{ padding: "0.35rem 0.5rem", fontSize: "0.8rem" }}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={editHourlyRate}
                            onChange={(e) => setEditHourlyRate(e.target.value)}
                            className="input-field"
                            style={{ padding: "0.35rem 0.5rem", fontSize: "0.8rem" }}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                            className="input-field"
                            style={{ padding: "0.35rem 0.5rem", fontSize: "0.8rem" }}
                          />
                        </td>
                        <td style={{ fontWeight: "600", color: "var(--success)" }}>
                          {formatCurrency(parseFloat(editHours || "0") * parseFloat(editHourlyRate || "0"))}
                        </td>
                        <td style={{ display: "flex", gap: "0.35rem", justifyContent: "center" }}>
                          <button
                            onClick={() => saveEdit(entry.id)}
                            className="btn btn-primary btn-icon-only"
                            title="Save"
                            style={{ padding: "4px", borderColor: "var(--success)", background: "var(--success)" }}
                          >
                            <Check size={14} />
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="btn btn-icon-only"
                            title="Cancel"
                            style={{ padding: "4px" }}
                          >
                            <X size={14} />
                          </button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td style={{ fontWeight: "500" }}>{entry.work_date}</td>
                        <td>{entry.hours} hrs</td>
                        <td>{formatCurrency(entry.hourly_rate)}</td>
                        <td style={{ color: "var(--text-muted)" }}>{entry.description}</td>
                        <td style={{ fontWeight: "600", color: "var(--success)" }}>
                          {formatCurrency(entry.hours * entry.hourly_rate)}
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: "0.35rem", justifyContent: "center" }}>
                            <button
                              onClick={() => startEdit(entry)}
                              className="btn btn-icon-only"
                              title="Edit inline"
                              style={{ padding: "6px" }}
                            >
                              <Edit2 size={14} style={{ color: "var(--primary)" }} />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                handleDeleteEntry(entry.id);
                              }}
                              className="btn btn-danger btn-icon-only"
                              title="Delete log"
                              style={{ padding: "6px", cursor: "pointer" }}
                            >
                              <Trash2 size={14} style={{ pointerEvents: "none" }} />
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Single Add Work Session Modal Layer */}
      {isAddModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel" style={{ maxWidth: "680px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", borderBottom: "1px solid var(--border)", paddingBottom: "1rem" }}>
              <h3 style={{ fontSize: "1.25rem", fontWeight: "700", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Plus size={20} style={{ color: "var(--primary)" }} />
                Log New Work Session
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="btn btn-icon-only" style={{ border: "none" }}>
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div style={{ padding: "0.75rem", background: "var(--danger-bg)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: "var(--border-radius-sm)", color: "#f87171", fontSize: "0.875rem", marginBottom: "1rem" }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleAddEntry} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "1rem" }}>
                <div className="form-group">
                  <label className="form-label">
                    <Calendar size={12} style={{ marginRight: "4px", display: "inline" }} />
                    Date Worked
                  </label>
                  <input
                    type="date"
                    name="work_date"
                    required
                    value={workDate}
                    onChange={(e) => setWorkDate(e.target.value)}
                    className="input-field"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <Clock size={12} style={{ marginRight: "4px", display: "inline" }} />
                    Hours Worked
                  </label>
                  <input
                    type="number"
                    name="hours"
                    step="0.1"
                    min="0.1"
                    required
                    placeholder="e.g. 8"
                    value={hours}
                    onChange={(e) => setHours(e.target.value)}
                    className="input-field"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <DollarSign size={12} style={{ marginRight: "2px", display: "inline" }} />
                    Hourly Rate ($)
                  </label>
                  <input
                    type="number"
                    name="hourly_rate"
                    step="0.01"
                    min="0"
                    required
                    placeholder="e.g. 50"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(e.target.value)}
                    className="input-field"
                  />
                </div>
              </div>

              <div className="form-group">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.2rem" }}>
                  <label className="form-label" style={{ marginBottom: 0 }}>
                    <Briefcase size={12} style={{ marginRight: "4px", display: "inline" }} />
                    What I Did (Description)
                  </label>
                  <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
                    <button
                      type="button"
                      onClick={() => setShowPromptInput(!showPromptInput)}
                      className="btn"
                      style={{
                        padding: "0.18rem 0.5rem",
                        fontSize: "0.7rem",
                        borderRadius: "6px",
                        height: "22px",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.2rem",
                        borderColor: showPromptInput ? "var(--primary)" : "rgba(255,255,255,0.15)",
                        color: showPromptInput ? "var(--primary)" : "var(--text-muted)"
                      }}
                      title="Configure custom AI prompt and QA categories"
                    >
                      <Sliders size={10} />
                      <span>{showPromptInput ? "Hide Prompt Options" : "Custom Prompt"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleGenerateAIDescription}
                      disabled={isGeneratingAI}
                      className="btn btn-accent"
                      style={{
                        padding: "0.18rem 0.55rem",
                        fontSize: "0.72rem",
                        borderRadius: "6px",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.25rem",
                        height: "22px"
                      }}
                      title="Generate smart AI description based on QA prompts & past entries"
                    >
                      <Sparkles size={11} className={isGeneratingAI ? "animate-spin" : ""} />
                      <span>{isGeneratingAI ? "AI Generating..." : "AI Suggest"}</span>
                    </button>
                  </div>
                </div>

                {/* Custom AI Prompt Options Drawer */}
                {showPromptInput && (
                  <div className="animate-fade-in" style={{ marginBottom: "0.5rem", padding: "0.6rem 0.75rem", background: "rgba(10, 15, 26, 0.8)", borderRadius: "8px", border: "1px solid var(--border)" }}>
                    <div style={{ fontSize: "0.7rem", fontWeight: "700", color: "var(--primary)", marginBottom: "0.35rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                      <Sparkles size={10} />
                      <span>CUSTOM AI PROMPT INSTRUCTIONS & QA FOCUS</span>
                    </div>
                    <input
                      type="text"
                      placeholder="e.g. Focus on mobile touch controls, or type custom instructions..."
                      value={customAIPrompt}
                      onChange={(e) => setCustomAIPrompt(e.target.value)}
                      className="input-field"
                      style={{ padding: "0.35rem 0.6rem", fontSize: "0.8rem", marginBottom: "0.4rem" }}
                    />
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem", alignItems: "center" }}>
                      <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", fontWeight: "600" }}>QA Presets:</span>
                      <button
                        type="button"
                        onClick={() => setCustomAIPrompt("Functionality testing: navigation links, forms, user workflows")}
                        style={{ fontSize: "0.65rem", padding: "2px 6px", borderRadius: "4px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--text-main)", cursor: "pointer" }}
                      >
                        1. Functionality
                      </button>
                      <button
                        type="button"
                        onClick={() => setCustomAIPrompt("Browser and device testing: cross-browser, responsive layout, touchscreens")}
                        style={{ fontSize: "0.65rem", padding: "2px 6px", borderRadius: "4px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--text-main)", cursor: "pointer" }}
                      >
                        2. Browser & Device
                      </button>
                      <button
                        type="button"
                        onClick={() => setCustomAIPrompt("Visual and content review: image quality, alignment, typography")}
                        style={{ fontSize: "0.65rem", padding: "2px 6px", borderRadius: "4px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--text-main)", cursor: "pointer" }}
                      >
                        3. Visual & Content
                      </button>
                      <button
                        type="button"
                        onClick={() => setCustomAIPrompt("Usability and accessibility: keyboard navigation, zoom scaling")}
                        style={{ fontSize: "0.65rem", padding: "2px 6px", borderRadius: "4px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--text-main)", cursor: "pointer" }}
                      >
                        4. Usability & Accessibility
                      </button>
                      <button
                        type="button"
                        onClick={() => setCustomAIPrompt("Bug reporting and project support: issue reproduction and dev fixes")}
                        style={{ fontSize: "0.65rem", padding: "2px 6px", borderRadius: "4px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--text-main)", cursor: "pointer" }}
                      >
                        5. Bug Reporting
                      </button>
                      {customAIPrompt && (
                        <button
                          type="button"
                          onClick={() => setCustomAIPrompt("")}
                          style={{ fontSize: "0.65rem", padding: "2px 6px", borderRadius: "4px", background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171", cursor: "pointer" }}
                        >
                          Clear Prompt
                        </button>
                      )}
                    </div>
                  </div>
                )}

                <input
                  type="text"
                  name="description"
                  required
                  placeholder="e.g. Developed dashboard views and API integrations"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="input-field"
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", borderTop: "1px solid var(--border)", paddingTop: "1.25rem", marginTop: "0.5rem" }}>
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="btn">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isAdding}>
                  {isAdding ? "Saving..." : "Save Work Session"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mass Addition Modal Layer */}
      {isMassAddOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", borderBottom: "1px solid var(--border)", paddingBottom: "1rem" }}>
              <h3 style={{ fontSize: "1.25rem", fontWeight: "700", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Layers size={20} style={{ color: "var(--accent)" }} />
                Mass Add Work Logs
              </h3>
              <button onClick={closeMassAdd} className="btn btn-icon-only" style={{ border: "none" }}>
                <X size={18} />
              </button>
            </div>

            {massAddError && (
              <div style={{ padding: "0.75rem", background: "var(--danger-bg)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: "var(--border-radius-sm)", color: "#b91c1c", fontSize: "0.85rem", marginBottom: "1.25rem" }}>
                {massAddError}
              </div>
            )}

            <form onSubmit={handleMassSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <div className="modal-scroll-area">
                <table className="custom-table" style={{ border: "none" }}>
                  <thead>
                    <tr>
                      <th style={{ width: "50px", textAlign: "center" }}>#</th>
                      <th style={{ width: "160px" }}>Date</th>
                      <th style={{ width: "100px" }}>Hours</th>
                      <th style={{ width: "100px" }}>Rate ($)</th>
                      <th>What I Did (Description)</th>
                      <th style={{ width: "60px", textAlign: "center" }}>Del</th>
                    </tr>
                  </thead>
                  <tbody>
                    {massAddRows.map((row, idx) => (
                      <tr key={idx}>
                        <td style={{ textAlign: "center", fontWeight: "600", color: "var(--text-muted)", fontSize: "0.8rem" }}>
                          {idx + 1}
                        </td>
                        <td>
                          <input
                            type="date"
                            value={row.work_date}
                            required
                            onChange={(e) => updateMassRow(idx, "work_date", e.target.value)}
                            className="input-field"
                            style={{ padding: "0.4rem 0.6rem", fontSize: "0.85rem" }}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            step="0.1"
                            min="0.1"
                            placeholder="Hours"
                            required
                            value={row.hours}
                            onChange={(e) => updateMassRow(idx, "hours", e.target.value)}
                            className="input-field"
                            style={{ padding: "0.4rem 0.6rem", fontSize: "0.85rem" }}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="Rate"
                            required
                            value={row.hourly_rate}
                            onChange={(e) => updateMassRow(idx, "hourly_rate", e.target.value)}
                            className="input-field"
                            style={{ padding: "0.4rem 0.6rem", fontSize: "0.85rem" }}
                          />
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: "0.35rem", alignItems: "center" }}>
                            <input
                              type="text"
                              placeholder="e.g. Added dynamic search features"
                              required
                              value={row.description}
                              onChange={(e) => updateMassRow(idx, "description", e.target.value)}
                              className="input-field"
                              style={{ padding: "0.4rem 0.6rem", fontSize: "0.85rem", flex: 1 }}
                            />
                            <button
                              type="button"
                              onClick={() => handleMassGenerateAI(idx)}
                              disabled={massAddLoadingIndex === idx}
                              className="btn btn-accent btn-icon-only"
                              style={{ padding: "4px 7px" }}
                              title="Generate AI description based on past work logs"
                            >
                              <Sparkles size={12} className={massAddLoadingIndex === idx ? "animate-spin" : ""} style={{ pointerEvents: "none" }} />
                            </button>
                          </div>
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <button
                            type="button"
                            onClick={() => removeMassRow(idx)}
                            disabled={massAddRows.length === 1}
                            className="btn btn-danger btn-icon-only"
                            style={{ padding: "4px", opacity: massAddRows.length === 1 ? 0.3 : 1 }}
                          >
                            <Trash2 size={12} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border)", paddingTop: "1.25rem" }}>
                <button type="button" onClick={addMassRow} className="btn" style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                  <Plus size={14} />
                  <span>Add Row</span>
                </button>

                <div style={{ display: "flex", gap: "0.75rem" }}>
                  <button type="button" onClick={closeMassAdd} className="btn">
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={isBatchSaving} style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                    {isBatchSaving ? "Saving Batch..." : "Submit Batch"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>

    {/* Beautiful PDF Report Container (Printed only, hidden on screen) */}
    <div className="print-report-container">
      <div className="print-header">
        <div className="print-header-left">
          <h1 className="print-title">TIMESHEET STATEMENT</h1>
          <p className="print-subtitle">Statement of logged hours and services rendered</p>
          
          <div style={{ marginTop: "1rem" }}>
            <p className="print-meta-label">Statement Date</p>
            <p className="print-meta-val">
              {new Date().toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </div>
        
        <div className="print-header-right">
          <div className="print-total-badge">
            <span className="print-badge-label">Statement Total</span>
            <span className="print-badge-val">{formatCurrency(totalEarnings)}</span>
            <span className="print-badge-sub">{totalHours.toFixed(1)} hrs logged</span>
          </div>
        </div>
      </div>

      <div className="print-details-grid">
        <div className="print-party-box">
          <h3 className="print-sec-title">Service Provider</h3>
          <p className="print-party-name">Steve Katen</p>
          <p className="print-party-text">stevekaten@gmail.com</p>
        </div>
        <div className="print-party-box">
          <h3 className="print-sec-title">Client Details</h3>
          <p className="print-party-name">Syrus</p>
          <p className="print-party-text">syrus</p>
        </div>
      </div>

      <div className="print-filter-summary">
        <span style={{ fontWeight: "700", color: "#4f46e5" }}>Filter Period: </span>
        <span>{timePeriod === "all" ? "All Logged History" : timePeriod.replace("-", " ")}</span>
        {(fromDate || toDate) && (
          <span style={{ marginLeft: "1.5rem" }}>
            <span style={{ fontWeight: "700", color: "#4f46e5" }}>Range: </span>
            <span>{fromDate || "Start"} to {toDate || "End"}</span>
          </span>
        )}
      </div>

      <table className="print-table">
        <thead>
          <tr>
            <th style={{ width: "15%" }}>Date Worked</th>
            <th>Activity Description</th>
            <th style={{ width: "12%", textAlign: "right" }}>Hours</th>
            <th style={{ width: "15%", textAlign: "right" }}>Rate / hr</th>
            <th style={{ width: "18%", textAlign: "right" }}>Line Total</th>
          </tr>
        </thead>
        <tbody>
          {filteredEntries.map((entry) => (
            <tr key={entry.id}>
              <td style={{ fontWeight: "500" }}>{entry.work_date}</td>
              <td style={{ color: "#334155" }}>{entry.description}</td>
              <td style={{ textAlign: "right" }}>{entry.hours.toFixed(1)} hrs</td>
              <td style={{ textAlign: "right" }}>{formatCurrency(entry.hourly_rate)}</td>
              <td style={{ textAlign: "right", fontWeight: "700", color: "#1e3a8a" }}>
                {formatCurrency(entry.hours * entry.hourly_rate)}
              </td>
            </tr>
          ))}
          {/* Table Footer Totals */}
          <tr className="print-table-total-row">
            <td>TOTALS</td>
            <td style={{ color: "#64748b", fontStyle: "italic" }}>
              Summary of {filteredEntries.length} logged items
            </td>
            <td style={{ textAlign: "right" }}>{totalHours.toFixed(1)} hrs</td>
            <td style={{ textAlign: "right" }}>—</td>
            <td style={{ textAlign: "right", fontSize: "0.9rem", color: "#1e3a8a" }}>
              {formatCurrency(totalEarnings)}
            </td>
          </tr>
        </tbody>
      </table>



      <div className="print-footer">
        <span>Timesheet Statement &copy; {new Date().getFullYear()}</span>
        <span>Page 1 of 1</span>
      </div>
    </div>
  </>
  );
}
