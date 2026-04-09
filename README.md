# CVRP Optimization Project

A Capacitated Vehicle Routing Problem (CVRP) optimization system that calculates optimal delivery routes based on vehicle capacity and customer demand, utilizing real-world street maps.

## Features

- Real-world street map integration using OpenStreetMap (OSMNX).
- Shortest path calculation using Dijkstra's algorithm.
- Vehicle routing optimization using Greedy Clustering and DP Held-Karp algorithms.
- Interactive map viewer for visualizing routes and locations.
- Address search and geocoding.
- Persistent storage for locations and calculated distance matrices.

## Tech Stack

### Backend
- Framework: FastAPI (Python)
- Database: MySQL with SQLAlchemy ORM
- Mapping/Algorithms: OSMNX, NetworkX, Geopy
- Deployment: Uvicorn

### Frontend
- Framework: React (Vite)
- Mapping: Leaflet, React-Leaflet
- API Client: Axios

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

3. Ensure MySQL is running and update credentials in `database.py` if necessary.

4. Run the server:
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

## Usage

1. Open the frontend application in your browser.
2. Search for and add delivery locations (Depot and Customers).
3. Set vehicle capacity and customer demands.
4. Run the optimization algorithm to generate efficient routes.
5. Visualize the routes on the interactive map.
