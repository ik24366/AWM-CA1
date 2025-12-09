# 🚂 Irish Rail Finder (Matcha Mapper CA2)

A full‑stack location‑based services app for real‑time Irish Rail tracking, delay analysis, weather‑aware journey planning, and proximity‑based cafe discovery around stations.

---

## ✨ Features

- Live Irish Rail arrivals/departures with passive delay‑tendency stats and reliability badges per route.  
- Weather‑aware journey planning using Open‑Meteo plus solar data for destination stations.  
- Interactive Leaflet map with Irish Rail stations, cafes, and public toilets, including search and rich filtering.  
- Proximity search: click on the map to find nearby cafes within a radius using PostGIS distance queries.  
- Progressive Web App with offline support, “Add to Home Screen”, and dark/light mode.  
- Deep links into the official Irish Rail journey planner for one‑click booking.

---

## 🛠 Technology Stack

- **Backend:** Django 4.x, Django REST Framework, Python, PostgreSQL + PostGIS for spatial data.  
- **Frontend:** React 18, Leaflet, Bootstrap/Vanilla JS, PWA service worker + manifest.  
- **Infrastructure:** Docker & Docker Compose, Nginx reverse proxy, optional pgAdmin for DB management.  
- **External APIs:** Irish Rail (XML), Open‑Meteo (weather), Sunrise‑Sunset, plus OpenStreetMap tiles.

---

## 🏗 Architecture & Key Files

- Dockerised multi‑container setup: Nginx → React frontend → Django API → PostgreSQL/PostGIS database.  
- Django app (`local_business_finder/businesses`) exposes REST endpoints for trains, businesses, proximity search, and weather.  
- React app (`matcha-react/src/App.js`) consumes APIs, renders the Leaflet map, handles filters, delay stats, and PWA behaviour.  
- Core files: `models.py` (Business, TrainLog), `views.py` (Irish Rail, weather, proximity), `serializers.py`, `urls.py`, `map/App.js`, `serviceWorkerRegistration.js`.

---

## 🚀 Getting Started

1. **Clone & configure**
git clone <repository-url>
cd AWM-CA1
cp .env.example .env

Update `.env` with PostgreSQL, pgAdmin, and port settings.

2. **Run with Docker**
docker-compose up --build
- App: http://localhost  
- API root: http://localhost/api/  
- Django admin: http://localhost/api/admin/  
- pgAdmin: http://localhost:5050  

3. **Initial data (optional)**
docker-compose exec web python manage.py createsuperuser
docker-compose exec web python manage.py loaddata sample_businesses.json

---

## 📚 CA Requirements Coverage (Summary)

- **PostgreSQL/PostGIS:** Spatial storage and proximity queries for cafes and stations.  
- **Django + DRF:** MVC‑style middle layer with REST endpoints for trains, businesses, weather, and GeoJSON.  
- **Front‑end (PWA):** React + Leaflet map with offline support, responsive UI, and mobile‑friendly design.  
- **Cloud‑ready deployment:** Dockerised stack behind Nginx, suitable for deployment to AWS/Azure/DigitalOcean.  
- **Innovation & UX:** Delay‑tendency analytics, weather overlays, deep booking links, theming, and rich proximity search.

---

## 👨‍💻 Author

Developed by **Ismail Khan** for Advanced Web Mapping CA2 (TU Dublin).  
For questions or issues, please open a GitHub issue or contact the author.
