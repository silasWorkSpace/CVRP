import React, { useState, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import MovingCar from './MovingCar';

// --- 1. ICON CẤU HÌNH ---
const depotIcon = new L.Icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png', iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34] });
const customerIcon = new L.Icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png', iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34] });
const tempIcon = new L.Icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png', iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34] });
const routeColors = ['#E74C3C', '#2980B9', '#27AE60', '#8E44AD', '#F39C12', '#16A085'];

// --- 2. COMPONENT VẼ ĐƯỜNG THẬT ---
const RealRoadLayer = ({ route, locations, color, algorithmType }) => {
  const [realPath, setRealPath] = useState([]);

  // Kịch bản nét đứt
  const getRouteStyle = () => {
    switch (algorithmType) {
      case 'none': 
        return { color: color, weight: 4, opacity: 0.6, dashArray: '10, 15' };
      case 'greedy': 
        return { color: color, weight: 5, opacity: 0.8, dashArray: '8, 8' };
      case 'greedy_dp': 
        return { color: color, weight: 7, opacity: 1.0, dashArray: null };
      default:
        return { color: color, weight: 5, opacity: 0.8, dashArray: '5, 10' };
    }
  };

  const style = getRouteStyle();

  useEffect(() => {
    const fetchOSRMRoute = async () => {
      if (!route.sequence || route.sequence.length < 2) return;

      // 1. LỌC ĐIỂM TRÙNG LẶP 
      const validLocations = [];
      route.sequence.forEach((id, idx) => {
        if (idx > 0 && id === route.sequence[idx - 1]) return; // Bỏ qua điểm giống hệt điểm trước nó
        const loc = locations.find(l => l.id === id);
        if (loc) validLocations.push(loc);
      });

      if (validLocations.length < 2) return;

      const coordinates = validLocations.map(l => `${l.lng},${l.lat}`).join(';');
      const fallbackPath = validLocations.map(l => [l.lat, l.lng]); // Đường dự phòng

      try {
        const response = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=geojson`
        );
        const data = await response.json();

        // 2. CƠ CHẾ FALLBACK 
        if (data.code === "Ok" && data.routes && data.routes.length > 0) {
          const coords = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
          setRealPath(coords);
        } else {
          console.warn("OSRM không vẽ được, tự động chuyển sang đường chim bay.");
          setRealPath(fallbackPath);
        }
      } catch (err) {
        console.error("Lỗi API OSRM:", err);
        setRealPath(fallbackPath); 
      }
    };

    fetchOSRMRoute();
  }, [route.sequence, locations]);

  if (realPath.length === 0) return null;

  return (
    <>
      <Polyline 
        positions={realPath} 
        color={style.color} 
        weight={style.weight} 
        opacity={style.opacity} 
        dashArray={style.dashArray}
        className={algorithmType === 'greedy_dp' ? "optimized-path" : "standard-path"} 
      />
      <MovingCar pathCoordinates={realPath} color={style.color} vehicleId={route.vehicle_id} />
    </>
  );
};

// --- 3. CÁC COMPONENT PHỤ TRỢ ---
function ClickHandler({ setTempLocation }) {
  useMapEvents({ click(e) { setTempLocation({ lat: e.latlng.lat, lng: e.latlng.lng }); } });
  return null;
}

function SearchFlyHandler({ searchCoords }) {
  const map = useMap();
  useEffect(() => {
    if (searchCoords) map.flyTo([searchCoords.lat, searchCoords.lng], 16);
  }, [searchCoords, map]);
  return null;
}

function AddLocationPopup({ position, onSave, onCancel }) {
  const [name, setName] = useState("Khách hàng mới");
  const [demand, setDemand] = useState(10);
  const [isDepot, setIsDepot] = useState(false);
  const markerRef = useRef(null);

  useEffect(() => { if (markerRef.current) markerRef.current.openPopup(); }, []);

  return (
    <Marker position={position} icon={tempIcon} ref={markerRef}>
      <Popup closeOnClick={false} autoClose={false}>
        <div style={{ minWidth: '160px' }}>
          <h4 style={{ margin: '0 0 10px 0' }}>📍 Thêm Địa Điểm</h4>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} style={{ width: '100%', marginBottom: '10px', border: '1px solid #ccc' }} />
          <input type="number" value={demand} onChange={(e) => setDemand(parseInt(e.target.value) || 0)} style={{ width: '100%', marginBottom: '10px', border: '1px solid #ccc' }} />
          <label style={{ display: 'block', marginBottom: '10px' }}>
            <input type="checkbox" checked={isDepot} onChange={(e) => setIsDepot(e.target.checked)} /> Kho hàng
          </label>
          <div style={{ display: 'flex', gap: '5px' }}>
            <button onClick={(e) => { e.stopPropagation(); onSave({ ...position, name, demand, is_depot: isDepot }); }} style={{ background: '#27ae60', color: 'white', flex: 1, border: 'none', padding: '5px' }}>Lưu</button>
            <button onClick={(e) => { e.stopPropagation(); onCancel(); }} style={{ background: '#95a5a6', color: 'white', flex: 1, border: 'none', padding: '5px' }}>Hủy</button>
          </div>
        </div>
      </Popup>
    </Marker>
  );
}

// --- 4. COMPONENT CHÍNH ---
const MapViewer = ({ locations, routes, onAddLocation, searchCoords, algorithmType }) => {
  const [tempLocation, setTempLocation] = useState(null);

  useEffect(() => { if (searchCoords) setTempLocation(searchCoords); }, [searchCoords]);

  const centerPosition = locations.length > 0 ? [locations[0].lat, locations[0].lng] : [10.7725, 106.6980];

  return (
    <MapContainer center={centerPosition} zoom={14} style={{ height: '100%', width: '100%' }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      
      <SearchFlyHandler searchCoords={searchCoords} />
      <ClickHandler setTempLocation={setTempLocation} />

      {locations.map((loc) => (
        <Marker key={loc.id} position={[loc.lat, loc.lng]} icon={loc.is_depot ? depotIcon : customerIcon}>
          <Popup><strong>{loc.name}</strong><br/>{loc.is_depot ? 'Kho' : `Nhu cầu: ${loc.demand}`}</Popup>
        </Marker>
      ))}

      {routes && routes.map((route, index) => (
        <RealRoadLayer 
          key={index} 
          route={route} 
          locations={locations} 
          color={routeColors[index % routeColors.length]} 
          algorithmType={algorithmType} 
        />
      ))}

      {tempLocation && (
        <AddLocationPopup 
          position={tempLocation} 
          onSave={(data) => { onAddLocation(data); setTempLocation(null); }} 
          onCancel={() => setTempLocation(null)} 
        />
      )}
    </MapContainer>
  );
};

export default MapViewer;