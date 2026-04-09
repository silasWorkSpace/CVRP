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
const RealRoadLayer = ({ route, locations, color }) => {
  const [realPath, setRealPath] = useState([]);

  useEffect(() => {
    const fetchOSRMRoute = async () => {
      if (!route.sequence || route.sequence.length < 2) return;

      // Chuyển danh sách ID thành chuỗi tọa độ: "lng,lat;lng,lat;..."
      const coordinates = route.sequence
        .map(id => {
          const loc = locations.find(l => l.id === id);
          return loc ? `${loc.lng},${loc.lat}` : null;
        })
        .filter(c => c !== null)
        .join(';');

      try {
        // Gọi API OSRM để lấy đường đi thực tế
        const response = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=geojson`
        );
        const data = await response.json();

        if (data.routes && data.routes.length > 0) {
          // OSRM trả về [lng, lat], Leaflet cần [lat, lng]
          const coords = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
          setRealPath(coords);
        }
      } catch (err) {
        console.error("OSRM Error:", err);
      }
    };

    fetchOSRMRoute();
  }, [route.sequence, locations]);

  if (realPath.length === 0) return null;

  return (
    <>
      <Polyline 
        positions={realPath} 
        color={color} 
        weight={5} 
        opacity={0.8} 
        dashArray="1, 10"
        className="animated-path" 
      />
      <MovingCar pathCoordinates={realPath} color={color} vehicleId={route.vehicle_id} />
    </>
  );
};

// --- 3. CÁC COMPONENT PHỤ TRỢ (CLICK, SEARCH, POPUP) ---
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
const MapViewer = ({ locations, routes, onAddLocation, searchCoords }) => {
  const [tempLocation, setTempLocation] = useState(null);

  useEffect(() => { if (searchCoords) setTempLocation(searchCoords); }, [searchCoords]);

  const centerPosition = locations.length > 0 ? [locations[0].lat, locations[0].lng] : [10.7725, 106.6980];

  return (
    <MapContainer center={centerPosition} zoom={14} style={{ height: '100%', width: '100%' }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      
      <SearchFlyHandler searchCoords={searchCoords} />
      <ClickHandler setTempLocation={setTempLocation} />

      {/* Địa điểm từ DB */}
      {locations.map((loc) => (
        <Marker key={loc.id} position={[loc.lat, loc.lng]} icon={loc.is_depot ? depotIcon : customerIcon}>
          <Popup><strong>{loc.name}</strong><br/>{loc.is_depot ? 'Kho' : `Nhu cầu: ${loc.demand}`}</Popup>
        </Marker>
      ))}

      {/* LỘ TRÌNH THỰC TẾ (OSRM) */}
      {routes && routes.map((route, index) => (
        <RealRoadLayer 
          key={index} 
          route={route} 
          locations={locations} 
          color={routeColors[index % routeColors.length]} 
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