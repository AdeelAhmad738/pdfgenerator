import React from "react"

const Sidebar = ({ children, className = "" }) => {
  return <aside className={`sidebar ${className}`}>{children}</aside>
}

export default Sidebar
