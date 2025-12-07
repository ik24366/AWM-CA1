import React, { useEffect, useState, useMemo } from 'react';
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

const toiletIcon = L.icon({
  iconUrl: '/Toilet.svg',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

// Haversine formula to calculate distance in km
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  var R = 6371; // Radius of the earth in km
  var dLat = deg2rad(lat2 - lat1);
  var dLon = deg2rad(lon2 - lon1);
  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat1)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c; // Distance in km
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

function App() {
  const [businesses, setBusinesses] = useState([]);
  const [toilets, setToilets] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [userLocation] = useState({ lat: 53.35, lng: -6.26 }); // Default center

  useEffect(() => {
    // Fetch Businesses
    fetch('http://127.0.0.1:8000/api/businesses/')
      .then((r) => r.json())
      .then((data) => setBusinesses(data.features || []))
      .catch((err) => console.error('Error loading businesses:', err));

    // Fetch Public Toilets
    fetch('/public-toilets-dcc-2021.geojson')
      .then((r) => r.json())
      .then((data) => setToilets(data.features || []))
      .catch((err) => console.error('Error loading toilets:', err));
  }, []);

  const processedBusinesses = useMemo(() => {
    let filtered = businesses.filter((b) => {
      const name = b.properties.name.toLowerCase();
      const term = searchTerm.toLowerCase();
      return name.includes(term);
    });

    // Sort by distance
    filtered.forEach((b) => {
      const [lng, lat] = b.geometry.coordinates;
      b.distance = getDistanceFromLatLonInKm(
        userLocation.lat,
        userLocation.lng,
        lat,
        lng
      );
    });

    filtered.sort((a, b) => a.distance - b.distance);
    return filtered;
  }, [businesses, searchTerm, userLocation]);

  const recommended = processedBusinesses.slice(0, 5);

  return (
    <div className="app-container">
      <header className="header">
        <h1>
          <img src="/Matcha.svg" alt="Logo" className="logo-icon" />
          Cafe Finder
        </h1>
        <input
          type="search"
          placeholder="Search cafes..."
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </header>

      <main className="content">
        <div className="business-sidebar">
          <div className="sidebar-scroll">
            {searchTerm === '' && (
              <div className="recommended-section">
                <h2 className="section-title">Recommended Near You</h2>
                <div className="recommended-list">
                  {recommended.map((feature, idx) => {
                    const props = feature.properties || {};
                    return (
                      <div key={`rec-${idx}`} className="business-card" style={{ marginBottom: '1rem' }}>
                        <h3>{props.name}</h3>
                        <p className="address">{props.address}</p>
                        <span className="distance">{feature.distance.toFixed(1)} km away</span>
                      </div>
                    );
                  })}
                </div>
                <hr style={{ borderColor: 'var(--border-color)', margin: '2rem 0' }} />
              </div>
            )}

            <h2 className="section-title">All Cafes ({processedBusinesses.length})</h2>
            <div className="business-list-items">
              {processedBusinesses.map((feature, idx) => {
                const props = feature.properties || {};
                return (
                  <div key={idx} className="business-card" style={{ marginBottom: '1rem' }}>
                    <h3>{props.name}</h3>
                    <p className="address">{props.address}</p>
                    <span className="distance">{feature.distance.toFixed(1)} km away</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="map-wrapper">
          <MapContainer
            center={[53.35, -6.26]}
            zoom={12}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
            />

            {processedBusinesses.map((feature, idx) => {
              const [lng, lat] = feature.geometry.coordinates;
              const props = feature.properties || {};
              return (
                <Marker key={`biz-${idx}`} position={[lat, lng]} icon={matchaIcon}>
                  <Popup>
                    <strong>{props.name}</strong>
                    <br />
                    {props.address}
                  </Popup>
                </Marker>
              );
            })}

            {toilets.map((feature, idx) => {
              const [lng, lat] = feature.geometry.coordinates;
              const props = feature.properties || {};
              return (
                <Marker key={`toilet-${idx}`} position={[lat, lng]} icon={toiletIcon}>
                  <Popup>
                    <strong>{props.Location}</strong>
                    <br />
                    <span style={{ fontSize: '0.8rem', color: '#666' }}>{props['Opening Hours']}</span>
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
