import { BrowserRouter, Routes, Route } from "react-router-dom"
import Login from "./pages/auth/Login"
import Signup from "./pages/auth/Signup"
import UpdatePassword from "./pages/auth/UpdatePassword"
import Landing from "./pages/Landing"
import DashboardLayout from "./components/DashboardLayout"
import Dashboard from "./pages/dashboard/Dashboard"
import CreateTask from "./pages/dashboard/CreateTask"
import MyTasks from "./pages/dashboard/MyTasks"
import TeamTasks from "./pages/dashboard/TeamTasks"
import Reports from "./pages/dashboard/Reports"
import Settings from "./pages/dashboard/Settings"
import Collaboration from "./pages/dashboard/Collaboration"
import Profile from "./pages/profile/Profile"
import Notifications from "./pages/notifications/Notifications"
import ProtectedRoute from "./components/ProtectedRoute"
import { TaskProvider } from "./context/TaskContext"

function App() {
  return (
    <TaskProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/landing" element={<Landing />} />
          <Route path="/" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/update-password" element={<UpdatePassword />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="create" element={<CreateTask />} />
            <Route path="tasks" element={<MyTasks />} />
            <Route path="tasks/:taskId" element={<MyTasks />} />
            <Route path="team" element={<TeamTasks />} />
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<Settings />} />
            <Route path="collaboration" element={<Collaboration />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="profile" element={<Profile />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </TaskProvider>
  )
}

export default App
