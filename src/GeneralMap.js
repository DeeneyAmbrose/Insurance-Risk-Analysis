import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";
import axios from "axios";
import Modal from "react-modal";
import "./Modal.css";
import "leaflet/dist/leaflet.css";

Modal.setAppElement("#root");

const GeneralMap = () => {
  const [locations, setLocations] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await axios.get("/api/tracker/latest-locations");
        setLocations(response.data);
      } catch (error) {
        console.error("Error fetching latest locations:", error);
      }
    };

    fetchLocations();

    const interval = setInterval(fetchLocations, 60000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (timestamp) => {
    const now = new Date();
    const dataTime = new Date(timestamp);
    const diffMinutes = (now - dataTime) / (1000 * 60);

    return diffMinutes <= 5 ? "green" : "purple";
  };

  const handleMarkerClick = async (trackerName) => {
    try {
      const response = await axios.get(`/api/tracker/${trackerName}/details`);
      setSelectedVehicle(response.data);
    } catch (error) {
      console.error("Error fetching tracker details:", error);
    }
  };

  return (
    <>
      <MapContainer
        center={[0, 0]}
        zoom={2}
        style={{ height: "100vh", width: "100%" }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {locations.map((location, index) =>
          location.latitude && location.longitude ? (
            <CircleMarker
              key={index}
              center={[location.latitude, location.longitude]}
              radius={10}
              color={getStatusColor(location.timestamp)}
              eventHandlers={{
                click: () => handleMarkerClick(location.trackerName),
              }}
            >
              <Tooltip>
                <div>
                  <strong>{location.trackerName}</strong>
                  <div>
                    Last Update: {new Date(location.timestamp).toLocaleString()}
                  </div>
                </div>
              </Tooltip>
            </CircleMarker>
          ) : null
        )}
      </MapContainer>

      {selectedVehicle && (
        <div className="modal-overlay" onClick={() => setSelectedVehicle(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{selectedVehicle.trackerName}</h2>
            <p>
              <strong>Last Update:</strong>{" "}
              {new Date(selectedVehicle.timestamp).toLocaleString()}
            </p>
            <p>
              <strong>Status:</strong>{" "}
              {getStatusColor(selectedVehicle.timestamp) === "green"
                ? "Live"
                : "Inactive"}
            </p>
            <p>
              <strong>Last Known Speed:</strong>{" "}
              {selectedVehicle.speed.toFixed(2)} km/h
            </p>
            <p>
              <strong>Location:</strong>{" "}
              {`Lat: ${selectedVehicle.latitude.toFixed(
                5
              )}, Lon: ${selectedVehicle.longitude.toFixed(5)}`}
            </p>
            <button onClick={() => setSelectedVehicle(null)}>Close</button>
          </div>
        </div>
      )}
    </>
  );
};

export default GeneralMap;
