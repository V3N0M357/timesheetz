"use client";

import { useState, useTransition } from "react";
import { addWorkEntryAction, deleteWorkEntryAction } from "./actions/workActions";
import { logoutAction } from "./actions/authActions";
import { Clock, DollarSign, Search, Trash2, LogOut, Plus, Calendar, Briefcase, TrendingUp } from "lucide-react";

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
  userEmail: string;
  initialEntries: WorkEntry[];
}

export default function DashboardClient({ userEmail, initialEntries }: DashboardClientProps) {
  const [entries, setEntries] = useState<WorkEntry[]>(initialEntries);
  const [searchQuery, setSearchQuery] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Get current date in YYYY-MM-DD format for form default
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

  // Handle adding a new entry
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
        // Optimistic/Local state update
        const newEntry: WorkEntry = {
          id: Math.random().toString(), // Temp ID, page refresh will get real one
          user_id: "",
          work_date: formData.get("work_date") as string,
          hours: parseFloat(formData.get("hours") as string),
          hourly_rate: parseFloat(formData.get("hourly_rate") as string),
          description: formData.get("description") as string,
          created_at: new Date().toISOString(),
        };

        setEntries([newEntry, ...entries]);
        
        // Reset form inputs (except date and hourly rate which user might want to reuse)
        setHours("");
        setDescription("");
        setIsAdding(false);
      }
    } catch (err) {
      setFormError("Failed to add entry. Connection error.");
      setIsAdding(false);
    }
  };

  // Handle deleting an entry
  const handleDeleteEntry = async (id: string) => {
    if (!confirm("Are you sure you want to delete this work entry?")) return;

    // Save previous state for rollback
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

  // Logout handler
  const handleLogout = () => {
    startTransition(async () => {
      await logoutAction();
    });
  };

  // Filtering
  const filteredEntries = entries.filter((entry) =>
    entry.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.work_date.includes(searchQuery)
  );

  // Stats calculations
  const totalHours = filteredEntries.reduce((sum, entry) => sum + entry.hours, 0);
  const totalEarnings = filteredEntries.reduce((sum, entry) => sum + (entry.hours * entry.hourly_rate), 0);
  const averageHourlyRate = totalHours > 0 ? totalEarnings / totalHours : 0;

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem 1.5rem" }}>
      {/* Header Panel */}
      <header className="glass-panel animate-fade-in" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.5rem 2rem", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontSize: "1.25rem", fontWeight: "700", color: "var(--text-main)" }}>
            Timesheetz
          </h1>
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.1rem" }}>
            Logged in as <span style={{ color: "var(--text-main)", fontWeight: "500" }}>{userEmail}</span>
          </p>
        </div>
        <button className="btn btn-danger" onClick={handleLogout} disabled={isPending} style={{ padding: "0.5rem 1rem", fontSize: "0.85rem" }}>
          <LogOut size={14} />
          <span>Sign Out</span>
        </button>
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

        {/* Horizontal Form Layout: Date, Hours, Rate, Description, Submit */}
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

          <button type="submit" className="btn btn-primary" disabled={isAdding} style={{ flex: "0 0 auto", height: "43px", padding: "0 1.5rem" }}>
            {isAdding ? "Saving..." : "Add Entry"}
          </button>
        </form>
      </section>

      {/* History Log Section */}
      <section className="glass-panel animate-fade-in" style={{ padding: "2rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", marginBottom: "1.5rem" }}>
          <h3 style={{ fontSize: "1.1rem", fontWeight: "700" }}>Work History Log</h3>
          
          {/* Search bar */}
          <div style={{ position: "relative", width: "100%", maxWidth: "300px" }}>
            <Search size={16} style={{ position: "absolute", left: "0.85rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input
              type="text"
              placeholder="Search description or date..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field"
              style={{ paddingLeft: "2.3rem", fontSize: "0.85rem", paddingTop: "0.5rem", paddingBottom: "0.5rem" }}
            />
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
                  <th style={{ width: "80px", textAlign: "center" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredEntries.map((entry) => (
                  <tr key={entry.id}>
                    <td style={{ fontWeight: "500" }}>{entry.work_date}</td>
                    <td>{entry.hours} hrs</td>
                    <td>{formatCurrency(entry.hourly_rate)}</td>
                    <td style={{ color: "var(--text-muted)" }}>{entry.description}</td>
                    <td style={{ fontWeight: "600", color: "#10b981" }}>
                      {formatCurrency(entry.hours * entry.hourly_rate)}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <button
                        onClick={() => handleDeleteEntry(entry.id)}
                        className="btn btn-danger btn-icon-only"
                        title="Delete log"
                        style={{ padding: "6px" }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
