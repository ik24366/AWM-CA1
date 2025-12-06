// Local Business Finder - Main JavaScript functionality

let businessMarkers = L.layerGroup();
let allBusinessesData = [];
 
// Initialize map when page loads
document.addEventListener('DOMContentLoaded', function() {
    initializeMap();
    loadBusinesses();
    setupEventListeners();
});
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/static/service-worker.js')
    .then(reg => console.log('SW registered', reg))
    .catch(err => console.log('SW failed', err));
}



function initializeMap() {
    // Initialize the map - Center on Dublin area 
    map = L.map('map').setView([53.35, -6.26], 12);
 
    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18
    }).addTo(map);
 
    // Add the markers layer group to map
    businessMarkers.addTo(map);
}
 
function loadBusinesses() {
    console.log('Loading businesses...');
    showLoading(true);
   
    fetch('/api/businesses/')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            if (data && data.features && Array.isArray(data.features)) {
                allBusinessesData = data.features;
                displayBusinessesOnMap(allBusinessesData);
                updateBusinessCount(allBusinessesData.length);
                console.log(`Successfully loaded ${allBusinessesData.length} businesses`);
            } else {
                throw new Error('Unexpected API response format');
            }
        })
        .catch(error => {
            console.error('Error loading businesses:', error);
            showAlert(`Error loading businesses: ${error.message}`, 'danger');
        })
        .finally(() => {
            showLoading(false);
        });
        // Fetch business data GeoJSON from API


   

}
 
function displayBusinessesOnMap(businesses) {
    // Clear existing markers
    businessMarkers.clearLayers();
   
    businesses.forEach(business => {
        try {
            const matchaIcon = L.icon({
                iconUrl: '/static/image/Matcha.svg',  // Adjust path as appropriate
                iconSize: [40, 40],        // adjust as needed
                iconAnchor: [20, 40],      // bottom point of the icon corresponds to the marker's actual location
                popupAnchor: [0, -40],     // where popups open relative to the icon
            });

            const { geometry, properties } = business;
           
            if (!geometry || !geometry.coordinates || !Array.isArray(geometry.coordinates)) {
                console.warn('Invalid geometry for business:', properties?.name || 'Unknown');
                return;
            }
           
            const [lng, lat] = geometry.coordinates;
           
            if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
                console.warn('Invalid coordinates for business:', properties?.name, lat, lng);
                return;
            }
           
           const marker = L.marker([lat, lng], { icon: matchaIcon })
            .bindPopup(createPopupContent(properties), { maxWidth: 300, className: 'custom-popup' });

            marker.on('click', function() {
                showBusinessInfo(properties);
            });
           
            marker.businessData = properties;  // store data for reference
           
            businessMarkers.addLayer(marker);
           
        } catch (error) {
            console.error('Error creating marker for business:', business, error);
        }
    });
   
    if (businesses.length > 0) {
        try {
            const group = new L.featureGroup(businessMarkers.getLayers());
            if (group.getLayers().length > 0) {
                map.fitBounds(group.getBounds().pad(0.1));
            }
        } catch (error) {
            console.error('Error fitting map bounds:', error);
        }
    }
}
 
function createPopupContent(business) {
    const name = business.name || 'Unknown Business';
    const category = business.category || 'Unknown Category';
    const description = business.description || '';
    const address = business.address || 'Address not specified';
    const phone = business.phone_number || 'Phone number not available';

    const rating = business.rating !== undefined && business.rating !== null
        ? business.rating.toFixed(1)
        : 'Not rated';

    const price = business.price_range || 'N/A';
    const score = business.score !== undefined ? business.score : null;
    const tags = business.tags ? business.tags.split(',').join(', ') : '';
    
    // Extract lat/lon from the Business model location field
    let lat = null;
    let lon = null;
    
    if (business.location && business.location.coordinates) {
        // GeoJSON format: [longitude, latitude]
        lon = business.location.coordinates[0];
        lat = business.location.coordinates[1];
    }
    
    console.log('Business:', business);
    console.log('Lat:', lat, 'Lon:', lon);
    
    let sunHtml = '<small style="color: gray;">Loading sunrise/sunset...</small>';
    
    // Fetch sunrise/sunset times
    if (lat && lon) {
        fetch(`https://api.sunrise-sunset.org/json?lat=${lat}&lng=${lon}`)
            .then(r => r.json())
            .then(data => {
                if (data.results) {
                    const sunrise = data.results.sunrise.split(' ')[0];
                    const sunset = data.results.sunset.split(' ')[0];
                    sunHtml = `<small>🌅 Sunrise: ${sunrise} • 🌙 Sunset: ${sunset}</small>`;
                    
                    // Update the popup in real-time
                    const popup = document.querySelector('.leaflet-popup-content');
                    if (popup) {
                        const sunSection = popup.querySelector('.sun-section');
                        if (sunSection) {
                            sunSection.innerHTML = sunHtml;
                        }
                    }
                }
            })
            .catch(err => console.log('Sunrise/Sunset API error:', err));
    } else {
        console.log('No lat/lon available for API call');
    }

    return `
        <div class="business-popup">
            <h6>${name}</h6>
            <div><strong>Category:</strong> ${category}</div>
            <div><strong>Rating:</strong> ${rating} / 5</div>
            <div><strong>Price:</strong> ${price}</div>
            ${score !== null ? `<div><strong>Match score:</strong> ${score}</div>` : ''}
            ${tags ? `<div><strong>Tags:</strong> ${tags}</div>` : ''}
            <div><strong>Address:</strong> ${address}</div>
            ${description ? `<div><em>${description}</em></div>` : ''}
            <div><strong>Phone:</strong> ${phone}</div>
            
            <hr style="margin: 8px 0;">
            
            <div class="sun-section" style="font-size: 13px; margin: 6px 0;">
                ${sunHtml}
            </div>
        </div>
    `;
}


 
function showBusinessInfo(business) {
    const infoPanel = document.getElementById('business-info');
    const infoContent = document.getElementById('business-info-content');
   
    if (!infoPanel || !infoContent) {
        console.warn('Business info panel elements not found');
        return;
    }
   
    const name = business.name || 'Unknown Business';
    const category = business.category || 'Unknown Category';
    const description = business.description || '';
    const address = business.address || 'Address not specified';
    const phone = business.phone_number || 'Phone number not available';
   
    infoContent.innerHTML = `
        <h5>${name}</h5>
        <p><strong>Category:</strong> ${category}</p>
        <p><strong>Address:</strong> ${address}</p>
        ${description ? `<p><em>${description}</em></p>` : ''}
        <p><strong>Phone:</strong> ${phone}</p>
    `;
   
    infoPanel.style.display = 'block';
    infoPanel.scrollIntoView({ behavior: 'smooth' });
}
 
function setupEventListeners() {
    // Optionally setup search filter, refresh buttons, etc.
   document.getElementById('search-btn').onclick = function() {
    var query = document.getElementById('city-search').value.trim().toLowerCase();
    var filtered = allBusinessesData.filter(function(feature) {
        var props = feature.properties || {};
        return (props.name && props.name.toLowerCase().includes(query)) ||
               (props.address && props.address.toLowerCase().includes(query));
    });
    displayBusinessesOnMap(filtered);
    updateSidebar(filtered, businessMarkers.getLayers());
    updateBusinessCount(filtered.length);
};
}

     // Proximity search using Add Cafe button
       // Declare variable to hold pointer marker so we can update location on each click
    let pointerMarker = null;

    // Activate map click event after pressing "Add Cafe" button
    const addCafeBtn = document.getElementById('add-city-btn');
    if (addCafeBtn) {
        addCafeBtn.onclick = function(event) {
            event.preventDefault();

            alert('Click on the map to select location for proximity search');

            // Enable map click event listener
            map.once('click', async function(e) {
                const { lat, lng } = e.latlng;

                // Remove previous pointerMarker if it exists
                if (pointerMarker) {
                    map.removeLayer(pointerMarker);
                }

                // Add marker at clicked location
                pointerMarker = L.marker([lat, lng]).addTo(map);

                // Call your backend proximity API with 1000m radius
                try {
                    const response = await fetch(`/search/proximity/?lat=${lat}&lon=${lng}&radius=1000`);
                    const data = await response.json();

                    if (data.error) {
                        alert('Error: ' + data.error);
                        return;
                    }

                    const nearbyCafes = data.results || [];

                    if (nearbyCafes.length === 0) {
                        pointerMarker.bindPopup('No cafes found within 1000 meters.').openPopup();
                        return;
                    }

                    // Build popup content listing all nearby cafes
                    let popupContent = '<div><strong>Cafes within 1000m:</strong><ul>';
                    nearbyCafes.forEach(cafe => {
                        popupContent += `<li><strong>${cafe.name}</strong> - ${cafe.address}</li>`;
                    });
                    popupContent += '</ul></div>';

                    pointerMarker.bindPopup(popupContent).openPopup();

                } catch (error) {
                    console.error('Failed to fetch proximity cafes:', error);
                    alert('Failed to fetch cafes.');
                }
            });
        };
    }
    


 
function updateBusinessCount(count) {
    const countElement = document.getElementById('business-count');
    if (countElement) {
        countElement.textContent = `${count} businesses loaded`;
    }
}
 
function showLoading(show) {
    const btn = document.getElementById('refresh-btn');
    if (btn) {
        if (show) {
            btn.innerHTML = '<span class="loading"></span> Loading...';
            btn.disabled = true;
        } else {
            btn.innerHTML = 'Refresh Map';
            btn.disabled = false;
        }
    }
}
 
function showAlert(message, type) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    alertDiv.style.top = '20px';
    alertDiv.style.right = '20px';
    alertDiv.style.zIndex = '9999';
    alertDiv.style.minWidth = '300px';
   
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
   
    document.body.appendChild(alertDiv);
   
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 5000);
}
function updateSidebar(businesses, markers) {
    const cafeList = document.getElementById('cafe-list');
    cafeList.innerHTML = '';
    businesses.forEach((feature, idx) => {
        const props = feature.properties;
        const li = document.createElement('li');
        li.className = 'list-group-item';
        li.innerHTML = `<strong>${props.name}</strong><br><small>${props.address || ''}</small>`;
        li.addEventListener('click', () => {
            // Open the corresponding marker popup and pan map to marker when list item clicked
            if (markers[idx]) {
                markers[idx].openPopup();
                map.panTo(markers[idx].getLatLng());
            }
        });
        cafeList.appendChild(li);
    });
}
// Bottom-left Recommendations (click on map to choose location)
const proximityBtn = document.getElementById('proximity-search-btn');

if (proximityBtn) {
    proximityBtn.addEventListener('click', () => {
        const radius = document.getElementById('radius-input').value || 1000;

        alert('Click on the map to get recommended cafes near that location.');

        map.once('click', async (e) => {
            const lat = e.latlng.lat;
            const lon = e.latlng.lng;

            const url = `/search/recommend/?lat=${lat}&lon=${lon}&radius=${radius}`;

            try {
                const response = await fetch(url);
                const data = await response.json();

                if (!response.ok || data.success === false) {
                    alert('Recommendation error: ' + JSON.stringify(data.errors || data.error || {}));
                    return;
                }

                const recommendations = data.results || [];
                if (recommendations.length === 0) {
                    alert('No recommended cafes within ' + radius + ' meters.');
                    return;
                }

                // 1) Popup listing top recommended cafes at clicked location
                let popupContent = '<div><strong>Top recommended cafes:</strong><ul>';
                recommendations.forEach(cafe => {
                    const rating = cafe.rating !== null && cafe.rating !== undefined
                        ? Number(cafe.rating).toFixed(1)
                        : 'N/A';
                    const price = cafe.price_range || '€€';
                    popupContent += `<li><strong>${cafe.name}</strong> (${rating}/5, ${price})<br><small>${cafe.address || ''}</small></li>`;
                });
                popupContent += '</ul></div>';

                const recMarker = L.marker([lat, lon]).addTo(map);
                recMarker.bindPopup(popupContent, { maxWidth: 320 }).openPopup();

                // 2) Also plot each recommended cafe as markers
                businessMarkers.clearLayers();
                recommendations.forEach(cafe => {
                    const matchaIcon = L.icon({
                        iconUrl: '/static/image/Matcha.svg',
                        iconSize: [40, 40],
                        iconAnchor: [20, 40],
                        popupAnchor: [0, -40],
                    });

                    const marker = L.marker([cafe.latitude, cafe.longitude], { icon: matchaIcon })
                        .bindPopup(createPopupContent(cafe), { maxWidth: 300, className: 'custom-popup' });

                    businessMarkers.addLayer(marker);
                });

                const group = new L.featureGroup(businessMarkers.getLayers());
                if (group.getLayers().length > 0) {
                    map.fitBounds(group.getBounds().pad(0.1));
                }

            } catch (err) {
                console.error('Failed to fetch recommendations:', err);
                alert('Failed to fetch recommendations.');
            }
        });
    });
}
