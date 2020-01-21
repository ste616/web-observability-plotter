import React, { useState, useEffect } from "react";

// Hook to make the page sidebars work.
export default function(props) {
  const [sidebarOpen, setSidebarOpen] = useState(props.open);

  const toggleSidebar = function(e) {
    setSidebarOpen(!sidebarOpen);
    props.setOpen(!sidebarOpen);
  };

  useEffect(() => {
    if (props.open !== sidebarOpen) {
      setSidebarOpen(props.open);
    }
  }, [props.open]);

  return (
    <div id={props.side} className={sidebarOpen ? "open" : "closed"}>
      <div className="icon" onClick={toggleSidebar}>
        &equiv;
      </div>
      <div className={`sidebar ${sidebarOpen ? "open" : "closed"}`}>
        <div className="header">
          <h3 className="title">{props.headerTitle}</h3>
        </div>
        <div className="content">{props.children}</div>
      </div>
    </div>
  );
}
