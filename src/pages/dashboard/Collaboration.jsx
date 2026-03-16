import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useTasks } from "../../context/TaskContext"

const formatDate = (value) => {
if (!value) return "-"
const date = new Date(value)
if (Number.isNaN(date.getTime())) return "-"
return date.toLocaleDateString(undefined,{year:"numeric",month:"short",day:"numeric"})
}

function Collaboration() {

const navigate = useNavigate()

const {
tasks,
invites,
addInvite,
removeInvite,
respondToInvite,
currentUserEmail,
currentUserId
} = useTasks()

const [inviteEmail,setInviteEmail] = useState("")
const [sending,setSending] = useState(false)
const [search,setSearch] = useState("")
const [statusFilter,setStatusFilter] = useState("all")

const assignedTasks = useMemo(()=>{
return tasks.filter(t=>t.assignedTo || t.assigned_to_email)
},[tasks])

const filteredTasks = useMemo(()=>{

let data = assignedTasks

if(statusFilter !== "all"){
data = data.filter(t=>t.status === statusFilter)
}

if(search){
data = data.filter(t =>
(t.title || "").toLowerCase().includes(search.toLowerCase())
)
}

return data

},[assignedTasks,search,statusFilter])

const incomingInvites = useMemo(()=>{
const email=(currentUserEmail || "").toLowerCase()
return invites.filter(i=>(i.to_email || i.email || "").toLowerCase()===email)
},[invites,currentUserEmail])

const sentInvites = useMemo(()=>{
return invites.filter(i=>i.from_user_id===currentUserId)
},[invites,currentUserId])

const pendingIncoming = incomingInvites.filter(i=>i.status==="pending")

const workload = useMemo(()=>{

const map={}

assignedTasks.forEach(task=>{
const user=task.assignedTo || task.assigned_to_email || "Unassigned"
map[user]=(map[user] || 0)+1
})

return Object.entries(map)

},[assignedTasks])

const handleInviteSubmit = async (e)=>{
e.preventDefault()
if(!inviteEmail.trim()) return
setSending(true)
await addInvite(inviteEmail.trim())
setInviteEmail("")
setSending(false)
}

return(

<div className="page-content">

<div className="page-header">
<div>
<h1>Team Collaboration</h1>
<p className="small-text">Manage teammates and shared tasks</p>
</div>
</div>

{/* Collaboration Stats */}
<div className="dashboard__stats" style={{marginBottom:"1.5rem"}}>
<div className="stat-card">
<h4>Pending Invites</h4>
<strong style={{fontSize:"28px", color:"#3b82f6"}}>{pendingIncoming.length}</strong>
</div>
<div className="stat-card">
<h4>Sent Invites</h4>
<strong style={{fontSize:"28px", color:"#f59e0b"}}>{sentInvites.filter(i=>i.status==="pending").length}</strong>
</div>
<div className="stat-card">
<h4>Active Collaborators</h4>
<strong style={{fontSize:"28px", color:"#10b981"}}>{workload.length}</strong>
</div>
</div>


{/* Workload summary */}

{workload.length>0 &&(

<section className="dashboard__panel">

<h3>Team Workload</h3>

<div className="task-list">

{workload.map(([user,count])=>(
<div key={user} className="activity-item">

<strong>{user}</strong>

<span className="small-text">
{count} assigned task{count>1?"s":""}
</span>

</div>
))}

</div>

</section>

)}


{/* Pending invites */}

{pendingIncoming.length>0 &&(

<section className="dashboard__panel" style={{marginTop:"1.5rem"}}>

<h3>Pending Invites</h3>

<div className="task-list">

{pendingIncoming.map(invite=>(

<div key={invite.id} className="activity-item" style={{background:"rgba(59, 130, 246, 0.05)", padding:"12px", borderRadius:"8px", borderLeft:"3px solid #3b82f6"}}>

<div style={{marginBottom:"8px"}}>

<strong style={{fontSize:"16px"}}>
{invite.invite_type==="task"
?`📌 Task: ${invite.task_title || "Untitled"}`
:"🤝 Collaboration Invite"}
</strong>

<p className="small-text" style={{marginTop:"4px"}}>
From <strong>{invite.from_email || "Teammate"}</strong>
{invite.task_priority && ` · Priority: ${invite.task_priority}`}
{invite.task_deadline && ` · Due: ${new Date(invite.task_deadline).toLocaleDateString()}`}
</p>

{invite.task_description && (
<p className="small-text" style={{marginTop:"6px", color:"#64748b"}}>
{invite.task_description}
</p>
)}

</div>

<div className="task-tags">

<button
className="button button--small"
onClick={()=>respondToInvite(invite,"accepted")}
style={{background:"#10b981", border:"none"}}
>
✓ Accept
</button>

<button
className="button button--ghost button--small"
onClick={()=>respondToInvite(invite,"declined")}
>
✕ Decline
</button>

</div>

</div>

))}

</div>

</section>

)}


{/* Invite teammate */}

<section className="dashboard__panel" style={{marginTop:"1.5rem"}}>

<h3>Invite Teammate</h3>

<form onSubmit={handleInviteSubmit} className="task-form">

<div className="form-group">

<label>Email address</label>

<input
type="email"
value={inviteEmail}
onChange={(e)=>setInviteEmail(e.target.value)}
placeholder="teammate@email.com"
required
/>

</div>

<button className="button" disabled={sending}>
{sending?"Sending":"Send Invite"}
</button>

</form>

</section>


{/* Sent invites */}

<section className="dashboard__panel" style={{marginTop:"1.5rem"}}>

<h3>Sent Invites</h3>

{sentInvites.length===0 ?(
<p className="small-text">No invites sent</p>
):(

<div className="task-list">

{sentInvites.map(invite=>(

<div key={invite.id} className="activity-item">

<span>{invite.to_email || invite.email}</span>

<div className="task-tags">

<span className={`status-pill status-pill--${invite.status==="accepted"?"completed":invite.status==="declined"?"pending":"progress"}`}>
{invite.status}
</span>

{invite.status==="pending" &&(

<button
className="link-button link-button--danger"
onClick={()=>removeInvite(invite.id)}
>
Cancel
</button>

)}

</div>

</div>

))}

</div>

)}

</section>


{/* Assigned tasks */}

<section className="dashboard__panel" style={{marginTop:"1.5rem"}}>

<h3>Shared Tasks</h3>

<div style={{display:"flex",gap:"10px",marginBottom:"1rem"}}>

<input
type="text"
placeholder="Search task"
value={search}
onChange={(e)=>setSearch(e.target.value)}
/>

<select
value={statusFilter}
onChange={(e)=>setStatusFilter(e.target.value)}
>

<option value="all">All</option>
<option value="pending">Pending</option>
<option value="progress">In Progress</option>
<option value="completed">Completed</option>

</select>

</div>

{filteredTasks.length===0 ?(

<p className="small-text">No tasks found</p>

):(

<div className="task-list">

{filteredTasks.map(task=>(

<div key={task.id} className="collab-task">

<div>

<strong>{task.title}</strong>

<p className="small-text">
→ {task.assignedTo || task.assigned_to_email}
{task.deadline ? ` · Due ${formatDate(task.deadline)}`:""}
</p>

</div>

<button
className="button button--ghost"
onClick={()=>navigate(`/dashboard/tasks/${task.id}`)}
>
Open
</button>

</div>

))}

</div>

)}

</section>

</div>

)

}

export default Collaboration