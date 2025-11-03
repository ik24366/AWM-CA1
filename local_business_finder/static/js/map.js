// Local Business Finder - Main JavaScript functionality
let map;
let businessMarkers = L.layerGroup();
let allBusinessesData = [];
 
// Initialize map when page loads
document.addEventListener('DOMContentLoaded', function() {
    initializeMap();
    loadBusinesses();
    setupEventListeners();
});
 
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
fetch('/api/businesses/')
  .then(response => response.json())
  .then(data => {
    // Initialize map centered on Dublin
    const map = L.map('map').setView([53.3498, -6.2603], 13);

    // Add OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // Create a layer group for markers
    const markers = L.layerGroup().addTo(map);

    // Sidebar cafe list container
    const cafeList = document.getElementById('cafe-list');

    // For each business feature, add a marker and sidebar entry
    data.features.forEach(feature => {
      const coords = feature.geometry.coordinates;
      const props = feature.properties;

      // Create marker
      const marker = L.marker([coords[1], coords[0]]).addTo(markers);

      // Create popup content
      const popupContent = `
        <strong>${props.name}</strong><br>
        <em>${props.category}</em><br>
        ${props.description ? props.description + '<br>' : ''}
        Address: ${props.address}<br>
        Phone: ${props.phone_number}
      `;

      marker.bindPopup(popupContent);

      // Create sidebar list item
      const li = document.createElement('li');
      li.innerHTML = `<strong>${props.name}</strong><br><small>${props.address}</small>`;
      cafeList.appendChild(li);

      // Click on list item opens popup and centers map
      li.addEventListener('click', () => {
        marker.openPopup();
        map.panTo(marker.getLatLng());
      });
    });

    // Optional: Fit map bounds to markers
    const group = new L.featureGroup(markers.getLayers());
    map.fitBounds(group.getBounds(), { padding: [50, 50] });
  })
  .catch(error => console.error('Error loading business data:', error));

}
 
function displayBusinessesOnMap(businesses) {
    // Clear existing markers
    businessMarkers.clearLayers();
   
    businesses.forEach(business => {
        try {
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
           
            const marker = L.marker([lat, lng])
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

    return `
        <div class="business-popup">
            <h6>${name}</h6>
            <div><strong>Category:</strong> ${category}</div>
            <div><strong>Address:</strong> ${address}</div>
            ${description ? `<div><em>${description}</em></div>` : ''}
            <div><strong>Phone:</strong> ${phone}</div>
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
