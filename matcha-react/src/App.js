import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import './App.css';

const matchaIcon = L.icon({
  iconUrl: '/Matcha.svg',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

function App() {
  const [businesses, setBusinesses] = useState([]);

  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/businesses/')
      .then((r) => r.json())
      .then((data) => setBusinesses(data.features || []))
      .catch((err) => console.error('Error loading businesses:', err));
  }, []);

  return (
    <div className="app-container">
      <header className="header">
        <h1>
          <img src="/Matcha.svg" alt="Logo" className="logo-icon" />
          Cafe Finder
        </h1>
      </header>

      <main className="content">
        <div className="business-list">
          <div className="list-header">
            <h2>Nearby Businesses ({businesses.length})</h2>
          </div>

          {businesses.map((feature, idx) => {
            const props = feature.properties || {};
            return (
              <div key={idx} className="business-card" onClick={() => {
                // Future: flyTo map location
              }}>
                <h3>{props.name}</h3>
                <p className="address">{props.address}</p>
              </div>
            );
          })}
        </div>

        <div className="map-wrapper">
          <MapContainer
            center={[53.35, -6.26]}
            zoom={12}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            />

            {businesses.map((feature, idx) => {
              const [lng, lat] = feature.geometry.coordinates;
              const props = feature.properties || {};
              return (
                <Marker key={idx} position={[lat, lng]} icon={matchaIcon}>
                  <Popup>
                    <strong>{props.name}</strong>
                    <br />
                    {props.address}
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>
      </main>
    </div>
  );
}

export default App;
