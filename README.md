# Matcha Mapper

A Django + Leaflet web application for mapping cafes with a focus on proximity-based search and interactive map discovery.

---

## Features

- 🌍 Interactive Leaflet map centered on Dublin, displaying all local cafes as custom matcha cup markers.
- 🔍 **Search Bar:** Filter cafes by name or address instantly.
- 📍 **Proximity Search:** Click "Add Cafe", then pick a location on the map to:
    - Drop a pointer marker
    - Instantly see a popup listing all cafes within 1000 meters of the click location
- 🍵 **Theming:** Uses a matcha-inspired color palette and iconography for all map markers and UI.
- 🗺️ **Live Sidebar:** Cafe list updates dynamically based on search or proximity results.

---

## Demo

To try it:

1. Launch the Django development server:
    ```
    python manage.py runserver
    ```
2. Open [http://127.0.0.1:8000/map/](http://127.0.0.1:8000/map/) in your browser.
3. Use the search bar or click "Add Cafe" to explore map features.

---

## Technical Stack

- **Backend:** Django 4.x, Python 3, (GeoDjango recommended), PostgreSQL/PostGIS if spatial filtering is server-side
- **Frontend:** Leaflet.js, Bootstrap 5, Vanilla JS
- **Data Format:** GeoJSON for cafe locations

---

## Key Files

- `map.js` – Interactive map logic (displays, filters, proximity, popups)
- `base.html` – Main template (includes search bar, buttons, and map div)
- `views.py` – Django views, API endpoints (all businesses, proximity)
- `models.py` – Business model: name, address, category, description, lat/lon

---

## How It Works

- On page load, the map fetches all businesses and displays them as custom icons.
- The search bar filters by cafe name/address in real time.
- The “Add Cafe” button enters proximity search mode: clicking the map triggers a backend API call and lists all nearby cafes in a popup.
- The sidebar and map always reflect the current filter or search selection.

---

## Setup

1. **Clone and install dependencies**
    ```
    git clone <your-repo-url>
    cd matcha-mapper
    pip install -r requirements.txt
    ```
2. **Configure PostgreSQL/PostGIS (optional for advanced spatial features)**
3. **Run migrations**:
    ```
    python manage.py migrate
    ```
4. **Load sample data** (if provided), or add cafes through admin.

---

## Credits

- [Leaflet.js](https://leafletjs.com/)
- [Bootstrap](https://getbootstrap.com/)
- Matcha cup icon and matcha theme by project author

---

## Known Issues / TODO

- Add “directions” or “reviews” features in future
- Mobile map UX improvements
- User authentication for cafe submissions

---

## Contact

Developed by Ismail Khan  
For questions or bug reports, open an issue or email [support@example.com](mailto:support@example.com).

---



