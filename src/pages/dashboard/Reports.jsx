import { useMemo, useState } from "react"
import { useTasks } from "../../context/TaskContext"
import { jsPDF } from "jspdf"
import * as XLSX from "xlsx"
import { useNavigate } from "react-router-dom"

function Reports() {

const { tasks } = useTasks()
const navigate = useNavigate()

const [startDate, setStartDate] = useState("")
const [endDate, setEndDate] = useState("")
const [statusFilter, setStatusFilter] = useState("all")

const normalizeStatus = (status) => {
if (status === "complete") return "completed"
return status
}

const openTask = (taskId) => {
navigate(`/tasks/${taskId}`)
}

const setTodayFilter = () => {
const today = new Date().toISOString().split("T")[0]
setStartDate(today)
setEndDate(today)
}

const setWeekFilter = () => {
const today = new Date()
const firstDay = new Date(today.setDate(today.getDate() - today.getDay()))
const lastDay = new Date(firstDay)
lastDay.setDate(firstDay.getDate() + 6)

setStartDate(firstDay.toISOString().split("T")[0])
setEndDate(lastDay.toISOString().split("T")[0])
}

const clearFilters = () => {
setStartDate("")
setEndDate("")
setStatusFilter("all")
}

const filteredTasks = useMemo(() => {

let data = tasks

if (statusFilter !== "all") {
data = data.filter(
(t) => normalizeStatus(t.status) === statusFilter
)
}

if (!startDate && !endDate) return data

const start = startDate ? new Date(startDate).getTime() : null
const end = endDate ? new Date(endDate).getTime() + 86400000 - 1 : null

return data.filter((task) => {
const created = task.createdAt || task.created_at || 0
if (start && created < start) return false
if (end && created > end) return false
return true
})

}, [tasks, startDate, endDate, statusFilter])

const stats = useMemo(() => {

const total = filteredTasks.length

const completed = filteredTasks.filter(
(t) => normalizeStatus(t.status) === "completed"
).length

const pending = filteredTasks.filter(
(t) => normalizeStatus(t.status) === "pending"
).length

const overdue = filteredTasks.filter(
(t) =>
t.deadline &&
new Date(t.deadline).getTime() < Date.now() &&
normalizeStatus(t.status) !== "completed"
).length

const completionRate = total
? Math.round((completed / total) * 100)
: 0

const today = new Date().toDateString()

const completedToday = filteredTasks.filter((t) => {
if (normalizeStatus(t.status) !== "completed") return false
const completedDate = t.completedAt
? new Date(t.completedAt).toDateString()
: ""
return completedDate === today
}).length

return {
total,
completed,
pending,
overdue,
completedToday,
completionRate
}

}, [filteredTasks])

const exportPdf = () => {

const doc = new jsPDF()

doc.setFontSize(16)
doc.text("Task Productivity Report", 14, 20)

doc.setFontSize(11)
doc.text(`Total Tasks: ${stats.total}`, 14, 35)
doc.text(`Completed: ${stats.completed}`, 14, 42)
doc.text(`Pending: ${stats.pending}`, 14, 49)
doc.text(`Overdue: ${stats.overdue}`, 14, 56)
doc.text(`Completion Rate: ${stats.completionRate}%`, 14, 63)

let y = 80

filteredTasks.forEach((task, index) => {

const status = normalizeStatus(task.status) || "pending"

const line =
`${index + 1}. ${task.title} | ${status} | ` +
`${task.assignedTo || task.assigned_to_email || "Unassigned"}`

doc.text(line, 14, y)

y += 7

if (y > 280) {
doc.addPage()
y = 20
}

})

doc.save("task-report.pdf")

}

const exportExcel = () => {

const rows = filteredTasks.map((task) => ({
Title: task.title,
Status: normalizeStatus(task.status),
AssignedTo:
task.assignedTo ||
task.assigned_to_email ||
"Unassigned",
Priority: task.priority || "medium",
Created: task.createdAt
? new Date(task.createdAt).toLocaleDateString()
: "-",
Deadline: task.deadline
? new Date(task.deadline).toLocaleDateString()
: "-"
}))

const worksheet = XLSX.utils.json_to_sheet(rows)
const workbook = XLSX.utils.book_new()

XLSX.utils.book_append_sheet(
workbook,
worksheet,
"Tasks"
)

XLSX.writeFile(workbook, "task-report.xlsx")

}

return (

<div className="page-content">

<div className="page-header">
<h1>Reports Dashboard</h1>
<p className="small-text">
Monitor team productivity and export reports
</p>
</div>

<div className="report-stats-row">

<div className="report-stat-card">
<span className="report-stat-card__value">{stats.total}</span>
<span className="report-stat-card__label">Total Tasks</span>
</div>

<div className="report-stat-card report-stat-card--success">
<span className="report-stat-card__value">{stats.completed}</span>
<span className="report-stat-card__label">Completed</span>
</div>

<div className="report-stat-card report-stat-card--warning">
<span className="report-stat-card__value">{stats.pending}</span>
<span className="report-stat-card__label">Pending</span>
</div>

<div className="report-stat-card report-stat-card--danger">
<span className="report-stat-card__value">{stats.overdue}</span>
<span className="report-stat-card__label">Overdue</span>
</div>

<div className="report-stat-card report-stat-card--accent">
<span className="report-stat-card__value">{stats.completionRate}%</span>
<span className="report-stat-card__label">Completion Rate</span>
</div>

</div>

<section className="dashboard__panel" style={{ marginTop: "1.5rem" }}>

<h3>Filters</h3>

<div className="report-export-row">

<div className="form-group">
<label>Status</label>
<select
value={statusFilter}
onChange={(e) =>
setStatusFilter(e.target.value)
}
>
<option value="all">All</option>
<option value="completed">Completed</option>
<option value="pending">Pending</option>
<option value="progress">In Progress</option>
</select>
</div>

<div className="form-group">
<label>From</label>
<input
type="date"
value={startDate}
onChange={(e) =>
setStartDate(e.target.value)
}
/>
</div>

<div className="form-group">
<label>To</label>
<input
type="date"
value={endDate}
onChange={(e) =>
setEndDate(e.target.value)
}
/>
</div>

</div>

<div style={{ marginTop: "10px" }}>

<button className="button" onClick={setTodayFilter}>
Today
</button>

<button className="button" onClick={setWeekFilter}>
This Week
</button>

<button className="button button--ghost" onClick={clearFilters}>
Clear Filters
</button>

</div>

</section>

<section className="dashboard__panel" style={{ marginTop: "1.5rem" }}>

<h3>Productivity Summary</h3>

<p className="small-text">
You completed {stats.completed} tasks out of {stats.total}
</p>

<p className="small-text">
Completion rate {stats.completionRate} percent
</p>

<p className="small-text">
Tasks completed today {stats.completedToday}
</p>

</section>

<section className="dashboard__panel" style={{ marginTop: "1.5rem" }}>

<h3>Filtered Tasks</h3>

{filteredTasks.length === 0 && (
<p className="small-text">
No tasks found
</p>
)}

{filteredTasks.map((task) => {

const status = normalizeStatus(task.status)

return (

<div
key={task.id}
className="activity-item"
onClick={() => openTask(task.id)}
style={{ cursor: "pointer" }}
>

<div style={{ display: "flex", justifyContent: "space-between" }}>
<strong>{task.title}</strong>

<span className={`status-pill status-pill--${status}`}>
{status}
</span>
</div>

<span className="small-text">
{task.assignedTo || task.assigned_to_email || "Unassigned"}
</span>

</div>

)

})}

</section>

<section className="dashboard__panel" style={{ marginTop: "1.5rem" }}>

<h3>Export Reports</h3>

<div className="report-export-actions">

<button
className="button"
type="button"
onClick={exportPdf}
>
Download PDF
</button>

<button
className="button button--ghost"
type="button"
onClick={exportExcel}
>
Download Excel
</button>

</div>

</section>

</div>

)

}

export default Reports