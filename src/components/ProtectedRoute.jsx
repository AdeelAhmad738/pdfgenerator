import { useEffect, useState } from "react"
import { Navigate } from "react-router-dom"
import { supabase } from "../services/supabaseClient"

const ProtectedRoute = ({ children, redirectPath = "/" }) => {
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const checkSession = async () => {
      const { data, error } = await supabase.auth.getSession()
      if (!error && data?.session) {
        setIsAuthenticated(true)
      }
      setLoading(false)
    }

    checkSession()
  }, [])

  if (loading) {
    return <div className="container"><div className="card"><h2>Loading…</h2></div></div>
  }

  if (!isAuthenticated) {
    return <Navigate to={redirectPath} replace />
  }

  return children
}

export default ProtectedRoute
