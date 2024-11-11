import React, { useState } from "react";
import "./Sidebar.css";

const Sidebar = ({
  trackers,
  sections,
  onSelectTracker,
  onSelectSection,
  onSearch,
}) => {
  const [selectedTracker, setSelectedTracker] = useState(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const handleTrackerSelect = (trackerName) => {
    setSelectedTracker(trackerName);
    onSelectTracker(trackerName);
  };

  const handleSearch = () => {
    onSearch(startDate, endDate);
  };

  return (
    <div className="sidebar">
      <h2>Trackers</h2>
      <ul className="tracker-list">
        {trackers.map((tracker) => (
          <li
            key={tracker._id}
            onClick={() => handleTrackerSelect(tracker.name)}
            className={tracker.name === selectedTracker ? "active" : ""}
          >
            {tracker.name}
          </li>
        ))}
      </ul>

      {selectedTracker && (
        <>
          <h2>Search Sections</h2>
          <div className="search-container">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
            <button onClick={handleSearch}>Search</button>
          </div>

          <h2>Sections</h2>
          <ul className="section-list">
            {sections.map((section) => (
              <li key={section._id} onClick={() => onSelectSection(section)}>
                {`Section ${section._id} - ${section.date}`}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
};

export default Sidebar;
