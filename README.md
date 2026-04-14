# CVRP Optimization Project

A Capacitated Vehicle Routing Problem (CVRP) optimization system that calculates optimal delivery routes based on vehicle capacity and customer demand, utilizing real-world street maps.

## Features

- Real-world street map integration using OpenStreetMap (OSMNX).
- Shortest path calculation using Dijkstra's algorithm.
- Vehicle routing optimization using Greedy Clustering and DP Held-Karp algorithms.
- Interactive map viewer for visualizing routes and locations.
- Address search and geocoding.
- Persistent storage for locations and calculated distance matrices.

## Project Structure

```text
CVRP/
├── backend/            # FastAPI Backend
│   ├── algorithms/    # Routing logic (Greedy, DP)
│   ├── api/           # API Endpoints
│   ├── main.py        # Application entry point
│   ├── models.py      # SQLAlchemy DB models
│   └── database.py    # DB Configuration
├── frontend/           # React Frontend (Vite)
│   ├── src/           # Component & App source
│   └── public/        # Static assets
├── requirements.txt    # Python dependencies
└── README.md           # Documentation
```

## Tech Stack

- **Backend:** FastAPI, SQLAlchemy (MySQL), OSMNX, NetworkX
- **Frontend:** React, Vite, Leaflet, Axios

## Installation

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   pip install -r ../requirements.txt
   ```
3. Update MySQL credentials in `database.py`.
4. Start the server:
   ```bash
   uvicorn main:app --reload
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```

### Seeding Data

To populate your database with real-world locations in Ho Chi Minh City (HCMC):

1. From the `backend` directory, run:
   ```bash
   python seed_data.py
   ```
   This will add a central Depot (Hồ Con Rùa) and several customer locations (Dinh Độc Lập, Landmark 81, etc.) to your MySQL database.

## Usage

1. Open the interactive map on the frontend.
2. Select the **Maximum Vehicles** and **Vehicle Capacity**.
3. Choose an **Optimization Algorithm**:
   - **Greedy Clustering (Nearest Neighbor):** Fast, rule-based grouping.
   - **Greedy + DP (Held-Karp):** Combines clustering with dynamic programming for optimized route sequences.
4. Click **Run Optimization** to visualize the routes and view total distance and execution time.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
