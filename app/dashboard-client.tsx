"use client";

import { useState } from "react";
import { addWorkEntryAction, deleteWorkEntryAction, updateWorkEntryAction, addMultipleWorkEntriesAction } from "./actions/workActions";
import { Clock, DollarSign, Search, Trash2, Plus, Calendar, Briefcase, TrendingUp, Download, Mail, Edit2, Check, X, Layers, Filter, FileText } from "lucide-react";

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
  const [hourlyRate, setHourlyRate] = useState("");
  const [description, setDescription] = useState("");

  // Format currency helper
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  // 1. Single Add Entry handler
  const handleAddEntry = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);
    setIsAdding(true);

    const formData = new FormData(e.currentTarget);

    try {
      const res = await addWorkEntryAction(null, formData);
      if (res && res.error) {
        setFormError(res.error);
        setIsAdding(false);
      } else {
        // Refresh local UI state
        const newEntry: WorkEntry = {
          id: Math.random().toString(), // Temporary ID until page reload fetches Turso UUID
          user_id: "default-user",
          work_date: formData.get("work_date") as string,
          hours: parseFloat(formData.get("hours") as string),
          hourly_rate: parseFloat(formData.get("hourly_rate") as string),
          description: formData.get("description") as string,
          created_at: new Date().toISOString(),
        };

        setEntries([newEntry, ...entries]);
        
        // Reset dynamic inputs
        setHours("");
        setDescription("");
        setIsAdding(false);
      }
    } catch (err) {
      setFormError("Failed to add entry. Connection error.");
      setIsAdding(false);
    }
  };

  // 2. Delete Entry handler
  const handleDeleteEntry = async (id: string) => {
    if (!confirm("Are you sure you want to delete this work entry?")) return;

    const previousEntries = [...entries];
    setEntries(entries.filter((entry) => entry.id !== id));

    try {
      const res = await deleteWorkEntryAction(id);
      if (res && res.error) {
        alert(res.error);
        setEntries(previousEntries);
      }
    } catch (err) {
      alert("Failed to delete entry due to a network error.");
      setEntries(previousEntries);
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
        const mappedLocal: WorkEntry[] = validEntries.map(ent => ({
          id: Math.random().toString(),
          user_id: "default-user",
          work_date: ent.work_date,
          hours: ent.hours,
          hourly_rate: ent.hourly_rate,
          description: ent.description,
          created_at: new Date().toISOString()
        }));

        setEntries([...mappedLocal, ...entries]);
        setIsBatchSaving(false);
        setIsMassAddOpen(false);
      }
    } catch (err) {
      setMassAddError("Connection error while saving batch logs.");
      setIsBatchSaving(false);
    }
  };

  // Helper: check if a date falls in a time period
  const isInTimePeriod = (dateStr: string) => {
    if (timePeriod === "all") return true;

    const date = new Date(dateStr + "T00:00:00");
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth(); // 0-indexed

    if (timePeriod === "this-month") {
      return date.getFullYear() === currentYear && date.getMonth() === currentMonth;
    }
    if (timePeriod === "last-month") {
      const targetMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const targetYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      return date.getFullYear() === targetYear && date.getMonth() === targetMonth;
    }
    if (timePeriod === "this-year") {
      return date.getFullYear() === currentYear;
    }
    if (timePeriod === "last-year") {
      return date.getFullYear() === currentYear - 1;
    }
    return true;
  };

  // Helper: check if hours match filter criteria
  const matchesHoursFilter = (hoursVal: number) => {
    if (hoursFilter === "all") return true;
    if (hoursFilter === "under-2") return hoursVal < 2;
    if (hoursFilter === "2-5") return hoursVal >= 2 && hoursVal <= 5;
    if (hoursFilter === "5-8") return hoursVal > 5 && hoursVal <= 8;
    if (hoursFilter === "over-8") return hoursVal > 8;
    return true;
  };

  // Apply filters: Search, Period, Custom Dates, and Hours
  const filteredEntries = entries
    .filter((entry) => {
      // 1. Text Search Filter (Matches Description or Date)
      const matchesSearch =
        entry.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.work_date.includes(searchQuery);

      // 2. Preset Time Period Filter
      const matchesPeriod = isInTimePeriod(entry.work_date);

      // 3. Custom Date Range Filters
      const matchesFromDate = fromDate ? entry.work_date >= fromDate : true;
      const matchesToDate = toDate ? entry.work_date <= toDate : true;

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
        return a.work_date.localeCompare(b.work_date) || a.created_at.localeCompare(b.created_at);
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
      <div className="no-print" style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem 1.5rem" }}>
      {/* Header Panel */}
      <header className="glass-panel animate-fade-in" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.25rem 2rem", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontSize: "1.25rem", fontWeight: "700", color: "var(--text-main)" }}>
            Timesheetz
          </h1>
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.1rem" }}>
            Scenic Work Tracker
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
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

      {/* Input Form Panel */}
      <section className="glass-panel animate-fade-in" style={{ padding: "2rem", marginBottom: "2rem" }}>
        <h3 style={{ fontSize: "1.1rem", fontWeight: "700", marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Plus size={18} style={{ color: "var(--primary)" }} />
          Log New Work Session
        </h3>

        {formError && (
          <div style={{ padding: "0.75rem", background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: "var(--border-radius-sm)", color: "#fca5a5", fontSize: "0.875rem", marginBottom: "1rem" }}>
            {formError}
          </div>
        )}

        {/* Horizontal Form Layout */}
        <form onSubmit={handleAddEntry} style={{ display: "flex", flexWrap: "wrap", gap: "1.25rem", alignItems: "flex-end" }}>
          <div className="form-group" style={{ flex: "1 1 180px" }}>
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

          <div className="form-group" style={{ flex: "1 1 120px" }}>
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

          <div className="form-group" style={{ flex: "1 1 120px" }}>
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

          <div className="form-group" style={{ flex: "2 1 250px" }}>
            <label className="form-label">
              <Briefcase size={12} style={{ marginRight: "4px", display: "inline" }} />
              What I Did (Description)
            </label>
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

          <button type="submit" className="btn btn-primary" disabled={isAdding} style={{ flex: "0 0 auto", height: "39px", padding: "0 1.5rem" }}>
            {isAdding ? "Saving..." : "Add Entry"}
          </button>
        </form>
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
              onChange={(e) => setTimePeriod(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Time</option>
              <option value="this-month">This Month</option>
              <option value="last-month">Last Month</option>
              <option value="this-year">This Year</option>
              <option value="last-year">Last Year</option>
            </select>
          </div>

          <div className="filter-group">
            <span className="filter-label">From Date</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="filter-select"
              style={{ padding: "0.45rem 0.65rem" }}
            />
          </div>

          <div className="filter-group">
            <span className="filter-label">To Date</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
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

          <div className="filter-group" style={{ flex: "1 1 200px", maxWidth: "300px", marginLeft: "auto" }}>
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
                              onClick={() => handleDeleteEntry(entry.id)}
                              className="btn btn-danger btn-icon-only"
                              title="Delete log"
                              style={{ padding: "6px" }}
                            >
                              <Trash2 size={14} />
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
                          <input
                            type="text"
                            placeholder="e.g. Added dynamic search features"
                            required
                            value={row.description}
                            onChange={(e) => updateMassRow(idx, "description", e.target.value)}
                            className="input-field"
                            style={{ padding: "0.4rem 0.6rem", fontSize: "0.85rem" }}
                          />
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
        <div>
          <h1 className="print-title">TIMESHEET REPORT</h1>
          <p className="print-subtitle">Generated Work Log Summary Report</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p className="print-meta-label">Generated On</p>
          <p className="print-meta-val">
            {new Date().toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
      </div>

      <div className="print-details">
        <div>
          <h3 className="print-sec-title">Owner Details</h3>
          <p className="print-text" style={{ fontWeight: "600" }}>Default Timesheetz User</p>
          <p className="print-text" style={{ color: "#64748b", fontSize: "0.8rem", marginTop: "0.1rem" }}>
            default@example.com
          </p>
        </div>
        <div style={{ textAlign: "right" }}>
          <h3 className="print-sec-title">Report Summary</h3>
          <p className="print-text">
            Period: {timePeriod === "all" ? "All Time" : timePeriod.replace("-", " ")}
          </p>
          {(fromDate || toDate) && (
            <p className="print-text" style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "0.1rem" }}>
              Range: {fromDate || "Start"} to {toDate || "End"}
            </p>
          )}
        </div>
      </div>

      <div className="print-metrics">
        <div className="print-card">
          <span className="print-card-label">Total Earnings</span>
          <span className="print-card-val" style={{ color: "var(--success)" }}>
            {formatCurrency(totalEarnings)}
          </span>
        </div>
        <div className="print-card">
          <span className="print-card-label">Total Hours Worked</span>
          <span className="print-card-val">{totalHours.toFixed(1)} hrs</span>
        </div>
        <div className="print-card">
          <span className="print-card-label">Average Hourly Rate</span>
          <span className="print-card-val" style={{ color: "var(--accent)" }}>
            {formatCurrency(averageHourlyRate)}/hr
          </span>
        </div>
      </div>

      <table className="print-table">
        <thead>
          <tr>
            <th style={{ width: "15%" }}>Date Worked</th>
            <th style={{ width: "12%", textAlign: "right" }}>Hours</th>
            <th style={{ width: "15%", textAlign: "right" }}>Hourly Rate</th>
            <th>Activity (What I Did)</th>
            <th style={{ width: "18%", textAlign: "right" }}>Total Earned</th>
          </tr>
        </thead>
        <tbody>
          {filteredEntries.map((entry) => (
            <tr key={entry.id}>
              <td style={{ fontWeight: "500" }}>{entry.work_date}</td>
              <td style={{ textAlign: "right" }}>{entry.hours} hrs</td>
              <td style={{ textAlign: "right" }}>{formatCurrency(entry.hourly_rate)}</td>
              <td style={{ color: "#334155" }}>{entry.description}</td>
              <td style={{ textAlign: "right", fontWeight: "700", color: "#0f766e" }}>
                {formatCurrency(entry.hours * entry.hourly_rate)}
              </td>
            </tr>
          ))}
          {/* Total Summary Row */}
          <tr style={{ borderTop: "2.5px solid #1e293b", borderBottom: "3px double #1e293b", fontWeight: "700" }}>
            <td>TOTALS</td>
            <td style={{ textAlign: "right" }}>{totalHours.toFixed(1)} hrs</td>
            <td style={{ textAlign: "right" }}>—</td>
            <td style={{ color: "#475569" }}>Summary of {filteredEntries.length} logged items</td>
            <td style={{ textAlign: "right", fontSize: "0.85rem", color: "#0f766e" }}>{formatCurrency(totalEarnings)}</td>
          </tr>
        </tbody>
      </table>

      <div className="print-footer">
        <span>Thank you for using Timesheetz.</span>
        <span>Generated dynamically via Timesheetz Web Console</span>
      </div>
    </div>
  </>
  );
}
