import React, { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Polyline,
  CircleMarker,
  Tooltip,
  Popup,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import axios from "axios";
import Sidebar from "./Sidebar";
import "./MapView.css";
import PlaybackControl from "./PlaybackControl";
import { useMap } from "react-leaflet";
import ReactLeafletDriftMarker from "react-leaflet-drift-marker";
import L from "leaflet";
import ReactDOMServer from "react-dom/server";
import { FaRegCircleDot } from "react-icons/fa6";

const MapUpdater = ({ positions }) => {
  const map = useMap();
  useEffect(() => {
    if (positions.length > 0) {
      map.fitBounds(positions);
    }
  }, [positions, map]);
  return null;
};

const MapView = () => {
  const [trackers, setTrackers] = useState([]);
  const [trackerName, setTrackerName] = useState(null);
  const [sections, setSections] = useState([]);
  const [selectedSection, setSelectedSection] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [totalTime, setTotalTime] = useState(0);

  // Fetch the list of trackers on component mount
  useEffect(() => {
    const fetchTrackers = async () => {
      try {
        const response = await axios.get("/api/tracker");
        setTrackers(response.data);
      } catch (error) {
        console.error("Error fetching trackers:", error);
      }
    };

    fetchTrackers();
  }, []);

  // Fetch the last 10 sections for the selected tracker
  useEffect(() => {
    const fetchSections = async () => {
      try {
        const response = await axios.get(
          `/api/tracker/${trackerName}/sections`
        );
        setSections(response.data);
      } catch (error) {
        console.error("Error fetching sections:", error);
      }
    };

    if (trackerName) {
      fetchSections();
    }
  }, [trackerName]);

  // Update totalTime when a new section is selected
  useEffect(() => {
    if (selectedSection) {
      setTotalTime(selectedSection.entries.length - 1);
    }
  }, [selectedSection]);

  // Playback control effect
  useEffect(() => {
    let interval = null;
    if (isPlaying && selectedSection) {
      interval = setInterval(() => {
        setCurrentTime((prevTime) => {
          const increment = playbackSpeed * 0.1; // Adjust for 100ms interval
          const newTime = prevTime + increment;
          if (newTime >= totalTime) {
            clearInterval(interval);
            setIsPlaying(false);
            return totalTime;
          }
          return newTime;
        });
      }, 100); // 100ms interval
    } else if (!isPlaying && currentTime !== 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed, selectedSection, totalTime]);

  const onSeek = (time) => {
    setCurrentTime(parseFloat(time));
  };

  const onSpeedChange = (speed) => {
    setPlaybackSpeed(parseFloat(speed));
  };

  const onSelectSection = (section) => {
    setSelectedSection(section);
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleSearch = async (startDate, endDate) => {
    try {
      const response = await axios.get(
        `/api/tracker/${trackerName}/search?startDate=${startDate}&endDate=${endDate}`
      );
      const entries = response.data;

      // Group entries by sectionID
      const sections = groupEntriesBySection(entries);

      setSections(sections);
    } catch (error) {
      console.error("Error searching data:", error);
    }
  };

  const groupEntriesBySection = (entries) => {
    const sectionsMap = {};

    entries.forEach((entry) => {
      const sectionID = entry.sectionID;
      if (!sectionsMap[sectionID]) {
        sectionsMap[sectionID] = {
          _id: sectionID,
          date: entry.date,
          entries: [],
        };
      }
      sectionsMap[sectionID].entries.push(entry);
    });

    return Object.values(sectionsMap);
  };

  const renderMap = () => {
    if (!selectedSection) {
      return <div>Please select a section to view the map.</div>;
    }

    const sectionData = selectedSection.entries;

    if (!sectionData || sectionData.length === 0) {
      return <div>No data available for this section.</div>;
    }

    const positions = sectionData.map((entry) => [
      entry.latitude,
      entry.longitude,
    ]);

    // Calculate current and next entries
    const currentEntryIndex = Math.floor(currentTime);
    const nextEntryIndex = Math.min(
      currentEntryIndex + 1,
      sectionData.length - 1
    );
    const currentEntry = sectionData[currentEntryIndex];
    const nextEntry = sectionData[nextEntryIndex];

    // Interpolate position
    const fraction = currentTime - currentEntryIndex;
    const lat =
      currentEntry.latitude +
      (nextEntry.latitude - currentEntry.latitude) * fraction;
    const lng =
      currentEntry.longitude +
      (nextEntry.longitude - currentEntry.longitude) * fraction;
    const interpolatedPosition = [lat, lng];

    // Create custom marker icon
    const iconMarkup = ReactDOMServer.renderToString(
      <FaRegCircleDot size={24} color="blue" />
    );
    const customMarkerIcon = L.divIcon({
      html: iconMarkup,
      className: "custom-marker-icon",
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    // Route segments with colors based on speeding
    // Note: Ensure routeSegments are recalculated when selectedSection changes
    const routeSegments = [];

    for (let i = 0; i < sectionData.length - 1; i++) {
      const entry = sectionData[i];
      const nextEntry = sectionData[i + 1];
      const isSpeeding = entry.speed > 60; // speed threshold as needed
      const color = isSpeeding ? "red" : "blue"; // Red for speeding, blue otherwise

      routeSegments.push(
        <Polyline
          key={`segment-${i}`}
          positions={[
            [entry.latitude, entry.longitude],
            [nextEntry.latitude, nextEntry.longitude],
          ]}
          color={color}
          weight={5}
        >
          <Tooltip>
            <div>
              <div>Time: {new Date(entry.timestamp).toLocaleString()}</div>
              <div>Speed: {entry.speed.toFixed(2)} km/h</div>
            </div>
          </Tooltip>
        </Polyline>
      );
    }

    // Circle markers for swerve and brake events
    const eventMarkers = sectionData
      .filter(
        (entry) => entry.eventType === "swerve" || entry.eventType === "brake"
      )
      .map((entry, index) => (
        <CircleMarker
          key={`event-${index}`}
          center={[entry.latitude, entry.longitude]}
          radius={5}
          color={entry.eventType === "swerve" ? "orange" : "yellow"}
        >
          <Tooltip>
            <div>
              <strong>{entry.eventType.toUpperCase()}</strong>
              <div>Time: {entry.timestamp}</div>
              <div>Speed: {entry.speed.toFixed(2)} km/h</div>
            </div>
          </Tooltip>
        </CircleMarker>
      ));

    // Generate event marks for the slider
    const eventMarks = {};
    sectionData.forEach((entry, index) => {
      if (entry.eventType === "swerve" || entry.eventType === "brake") {
        const time = index;
        eventMarks[time] = {
          style: { color: entry.eventType === "swerve" ? "orange" : "yellow" },
          label: "|",
        };
      }
    });

    return (
      <div key={selectedSection._id} style={{ flex: 1, position: "relative" }}>
        <h3>
          Tracker: {trackerName}, Section: {selectedSection._id}, Date:{" "}
          {selectedSection.date}
        </h3>
        <MapContainer
          center={positions[0]}
          zoom={15}
          style={{ height: "500px", width: "100%" }}
        >
          <MapUpdater positions={positions} />
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {routeSegments}
          {eventMarkers}
          <ReactLeafletDriftMarker
            position={interpolatedPosition}
            duration={100}
            icon={customMarkerIcon}
            keepAtCenter={false}
          >
            <Popup>{`Time: ${currentEntry.timestamp}`}</Popup>
          </ReactLeafletDriftMarker>
        </MapContainer>
        <PlaybackControl
          totalTime={totalTime}
          currentTime={currentTime}
          onPlayPause={() => setIsPlaying(!isPlaying)}
          onSeek={onSeek}
          isPlaying={isPlaying}
          playbackSpeed={playbackSpeed}
          onSpeedChange={onSpeedChange}
          eventMarks={eventMarks}
        />
      </div>
    );
  };

  return (
    <div style={{ display: "flex" }}>
      <Sidebar
        trackers={trackers}
        sections={sections}
        onSelectTracker={setTrackerName}
        onSelectSection={onSelectSection}
        onSearch={handleSearch}
      />
      <div style={{ flex: 1, padding: "10px" }}>
        {selectedSection ? (
          renderMap()
        ) : (
          <div>Please select a section to view the map.</div>
        )}
      </div>
    </div>
  );
};

export default MapView;
