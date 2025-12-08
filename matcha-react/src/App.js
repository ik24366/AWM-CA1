import React, { useState, useEffect, useMemo, useRef } from 'react';
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

const trainIcon = L.icon({
  iconUrl: '/Train.svg',
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
  const [stations, setStations] = useState([]);
  const [selectedStation, setSelectedStation] = useState(null);
  const [realtimeTrains, setRealtimeTrains] = useState([]);
  const [solarData, setSolarData] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [userLocation, setUserLocation] = useState({ lat: 53.35, lng: -6.26 }); // Default center

  // Theme State
  const [darkMode, setDarkMode] = useState(true);

  // Refs for markers to enable sidebar clicking
  const markerRefs = useRef({});

  useEffect(() => {
    // Fetch Businesses
    fetch('/api/businesses/')
      .then((r) => r.json())
      .then((data) => setBusinesses(data.features || []))
      .catch((err) => console.error('Error loading businesses:', err));

    // Fetch Public Toilets
    fetch('/public-toilets-dcc-2021.geojson')
      .then((r) => r.json())
      .then((data) => setToilets(data.features || []))
      .catch((err) => console.error('Error loading toilets:', err));

    // Fetch Train Stations
    fetch('/api/irish-rail-stations/')
      .then((r) => r.json())
      .then((data) => setStations(data.stations || []))
      .catch((err) => console.error('Error loading stations:', err));

    // Fetch Sunrise/Sunset Data (Dublin)
    fetch('https://api.sunrise-sunset.org/json?lat=53.3498&lng=-6.2603&date=today')
      .then(r => r.json())
      .then(data => setSolarData(data.results))
      .catch(err => console.error('Error loading solar data:', err));
  }, []);

  // Sync Body Class for Theme
  useEffect(() => {
    if (darkMode) {
      document.body.classList.remove('light-mode');
    } else {
      document.body.classList.add('light-mode');
    }
  }, [darkMode]);

  // Fetch real-time data when a station is selected
  useEffect(() => {
    if (selectedStation) {
      setRealtimeTrains([]); // Clear previous data
      fetch(`/api/irish-rail-realtime/${selectedStation.code}/`)
        .then(r => r.json())
        .then(data => setRealtimeTrains(data.trains || []))
        .catch(err => console.error('Error loading realtime info:', err));
    }
  }, [selectedStation]);

  const handleProximitySearch = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          // Ideally fly to user location too, but we need map ref for that directly.
          // For now, the list updates automatically via processedBusinesses
        },
        (error) => {
          console.error("Error getting location:", error);
          alert("Could not get your location.");
        }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  };

  const handleSidebarClick = (businessId, lat, lng) => {
    // Fly to location (need map instance, or we can just open popup if we had map ref)
    // Since we don't have easy map instance access here without refactoring MapContainer,
    // we will focus on opening the popup via ref.
    const marker = markerRefs.current[businessId];
    if (marker) {
      marker.openPopup();
      // If we had the map instance we could flyTo here.
    }
  };

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
        <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
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
        </div>
        <div style={{ display: 'flex', gap: '10px', marginLeft: '1rem' }}>
          <button className="theme-btn" onClick={handleProximitySearch}>
            📍 Cafe Nearby
          </button>
          <button className="theme-btn" onClick={() => setDarkMode(!darkMode)}>
            {darkMode ? '☀️ Light' : '🌙 Dark'}
          </button>
        </div>
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
                    // Use a unique ID based on business ID or fallback to index
                    const uniqueId = props.id || `biz-${idx}`;
                    return (
                      <div
                        key={`rec-${idx}`}
                        className="business-card"
                        style={{ marginBottom: '1rem', cursor: 'pointer' }}
                        onClick={() => {
                          const [lng, lat] = feature.geometry.coordinates;
                          handleSidebarClick(uniqueId, lat, lng);
                        }}
                      >
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
                const uniqueId = props.id || `biz-${idx}`;
                return (
                  <div
                    key={idx}
                    className="business-card"
                    style={{ marginBottom: '1rem', cursor: 'pointer' }}
                    onClick={() => {
                      const [lng, lat] = feature.geometry.coordinates;
                      handleSidebarClick(uniqueId, lat, lng);
                    }}
                  >
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
          {/* Station Details Panel */}
          {selectedStation && (
            <div className="station-panel">
              <div className="panel-header">
                <div>
                  <h2>{selectedStation.name}</h2>
                  <small style={{ color: '#aaa' }}>Station Code: {selectedStation.code}</small>
                </div>
                <button onClick={() => setSelectedStation(null)}>&times;</button>
              </div>
              <div className="panel-content">
                {realtimeTrains.length === 0 ? (
                  <p style={{ color: '#888', textAlign: 'center' }}>Loading live data...</p>
                ) : (
                  realtimeTrains.map((train, i) => {
                    // Helper to determine ticket info
                    const getTicketInfo = (destination) => {
                      const dest = destination.toLowerCase();
                      let price = null;
                      if (dest.includes('cork')) price = '32.00';
                      else if (dest.includes('galway')) price = '25.00';
                      else if (dest.includes('belfast')) price = '16.00';
                      else if (dest.includes('maynooth')) price = '4.50';

                      // Construct Deep Link for Journey Planner
                      // Example format provided: https://journeyplanner.irishrail.ie/webapp/?start=1&REQ0JourneyStopsS0G=Dublin%20Connolly&REQ0JourneyStopsZ0G=Maynooth&journey_mode=single&REQ0JourneyDate=08%2F12%2F2025
                      const originName = selectedStation.name;
                      const date = new Date();
                      const dateStr = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;

                      const params = new URLSearchParams({
                        start: '1',
                        REQ0JourneyStopsS0G: originName,
                        REQ0JourneyStopsZ0G: destination,
                        journey_mode: 'single',
                        REQ0JourneyDate: dateStr,
                        Number_adults: '1'
                      });

                      const link = `https://journeyplanner.irishrail.ie/webapp/?${params.toString()}`;

                      return { price, link };
                    };

                    const ticket = getTicketInfo(train.Destination);

                    return (
                      <div key={i} className="train-card">
                        <div className="train-route">
                          <span>{train.Origin}</span>
                          <span className="arrow">&rarr;</span>
                          <span>{train.Destination}</span>
                        </div>

                        <div className="train-meta">
                          <span style={{ backgroundColor: '#007aff', color: '#fff', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem' }}>
                            {train.Traincode}
                          </span>
                          <span className={`train-status ${train.Late === '0' ? 'status-ontime' : 'status-late'}`}>
                            {train.Late === '0' ? 'On Time' : `${train.Late} min late`}
                          </span>
                        </div>

                        <div className="timeline">
                          <div className="dot"></div>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span>Arrives {train.Exparrival}</span>
                              <span>Departs {train.Expdepart}</span>
                            </div>
                          </div>
                        </div>

                        <div className="ticket-info">
                          {ticket.price && <span style={{ marginRight: '10px', color: '#aaa' }}>Approx. from €{ticket.price}</span>}
                          <a href={ticket.link} target="_blank" rel="noopener noreferrer" className="book-btn">
                            Book via Irish Rail &rarr;
                          </a>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          <MapContainer
            center={userLocation} /* Dynamic center based on user location if updated*/
            zoom={12}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              url={darkMode
                ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"}
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
            />
            {/* User Location Marker if not default */}
            {userLocation.lat !== 53.35 && (
              <Marker position={[userLocation.lat, userLocation.lng]}>
                <Popup>You are here</Popup>
              </Marker>
            )}

            {processedBusinesses.map((feature, idx) => {
              const [lng, lat] = feature.geometry.coordinates;
              const props = feature.properties || {};
              const uniqueId = props.id || `biz-${idx}`;

              return (
                <Marker
                  key={`biz-${uniqueId}`}
                  position={[lat, lng]}
                  icon={matchaIcon}
                  ref={(ref) => {
                    if (ref) markerRefs.current[uniqueId] = ref;
                  }}
                >
                  <Popup className="business-popup">
                    <h3 style={{ margin: '0 0 5px 0', color: '#78A153' }}>{props.name}</h3>

                    <div style={{ fontSize: '0.9rem', lineHeight: '1.4' }}>
                      <div><strong>Category:</strong> {props.category}</div>
                      <div><strong>Rating:</strong> {props.rating} / 5</div>
                      <div><strong>Price:</strong> {props.price_range}</div>
                      {props.tags && <div><strong>Tags:</strong> {props.tags}</div>}

                      <div style={{ marginTop: '5px' }}><strong>Address:</strong> {props.address}</div>

                      {props.description && (
                        <div style={{ fontStyle: 'italic', margin: '8px 0', color: '#555' }}>
                          {props.description}
                        </div>
                      )}

                      {props.phone_number && <div><strong>Phone:</strong> {props.phone_number}</div>}
                    </div>

                    {solarData && (
                      <div style={{
                        marginTop: '10px',
                        paddingTop: '8px',
                        borderTop: '1px solid #ccc',
                        display: 'flex',
                        gap: '10px',
                        fontSize: '0.85rem'
                      }}>
                        <span>🌅 Sunrise: {solarData.sunrise}</span>
                        <span>🌙 Sunset: {solarData.sunset}</span>
                      </div>
                    )}
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

            {stations.map((station, idx) => {
              const { latitude, longitude, name, code } = station;
              if (!latitude || !longitude) return null;
              return (
                <Marker
                  key={`station-${idx}`}
                  position={[latitude, longitude]}
                  icon={trainIcon}
                  eventHandlers={{
                    click: () => {
                      setSelectedStation(station);
                    },
                  }}
                >
                  <Popup>
                    <strong>{name}</strong>
                    <br />
                    <small>Code: {code}</small>
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
