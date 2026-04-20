import React, { useState, useEffect } from 'react';
import axios from 'axios';
import MapViewer from './components/MapViewer';
import ControlPanel from './components/ControlPanel';
import './App.css';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [locations, setLocations] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchCoords, setSearchCoords] = useState(null);
  
  // Lưu thuật toán đang chạy
  const [currentAlgorithm, setCurrentAlgorithm] = useState('greedy_dp');

  useEffect(() => { fetchLocations(); }, []);

  const fetchLocations = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/locations/`);
      setLocations(res.data);
    } catch (error) { console.error("Lỗi:", error); }
  };

  const handleAddLocation = async (data) => {
    try {
      await axios.post(`${API_BASE_URL}/locations/`, data);
      fetchLocations();
    } catch (error) { alert("Không thể lưu!"); }
  };

  // Xóa địa điểm
  const handleDeleteLocation = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa địa điểm này?")) return;
    try {
      await axios.delete(`${API_BASE_URL}/locations/${id}`);
      fetchLocations();
      setRoutes([]); // Xóa đường đi cũ đi vì bản đồ đã thay đổi
    } catch (error) { alert("Lỗi khi xóa!"); }
  };

  const handleSolve = async (numVehicles, capacity, algorithmType) => {
    setLoading(true); setStats(null); setRoutes([]);
    
    // LƯU LẠI THUẬT TOÁN ĐỂ TRUYỀN XUỐNG BẢN ĐỒ
    setCurrentAlgorithm(algorithmType);

    try {
      const res = await axios.post(`${API_BASE_URL}/solver/solve-cvrp`, {
        num_vehicles: numVehicles, capacity, algorithm_type: algorithmType 
      });
      setRoutes(res.data.routes); 
      setStats({
        total_system_distance: res.data.total_system_distance,
        execution_time_ms: res.data.execution_time_ms,
        vehicles_used: res.data.vehicles_used
      });
      setActiveTab('home'); 
    } catch (error) { alert("Lỗi tính toán!"); } 
    finally { setLoading(false); }
  };

  return (
    <div className="app-container">
      <nav className="navbar">
        <div className="nav-brand">CVRP Optimizer</div>
        <div className="nav-links">
          <button className={activeTab === 'home' ? 'active' : ''} onClick={() => setActiveTab('home')}>
            Trang chủ (Bản đồ)
          </button>
          <button className={activeTab === 'data' ? 'active' : ''} onClick={() => setActiveTab('data')}>
            Quản lý Dữ liệu ({locations.length})
          </button>
        </div>
      </nav>

      {/* Phần chính */}
      <div className="main-content">
        {activeTab === 'home' ? (
          <>
            <div className="sidebar-container">
              <ControlPanel onSolve={handleSolve} stats={stats} loading={loading} routes={routes} locations={locations} onSearchResult={setSearchCoords} />
            </div>
            <div className="map-container">
              {/* TRUYỀN algorithmType XUỐNG ĐÂY */}
              <MapViewer 
                locations={locations} 
                routes={routes} 
                onAddLocation={handleAddLocation} 
                searchCoords={searchCoords} 
                algorithmType={currentAlgorithm}
              />
            </div>
          </>
        ) : (
          // Tab quản lý dữ liệu
          <div className="data-panel">
            <h2>Danh sách Địa điểm đã lưu</h2>
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th><th>Tên địa điểm</th><th>Phân loại</th><th>Nhu cầu (Demand)</th><th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {locations.map(loc => (
                  <tr key={loc.id}>
                    <td>#{loc.id}</td><td><strong>{loc.name}</strong></td>
                    <td>{loc.is_depot ? <span className="badge depot">Kho hàng</span> : <span className="badge customer">Khách hàng</span>}</td>
                    <td>{loc.is_depot ? '-' : loc.demand}</td>
                    <td><button className="delete-btn" onClick={() => handleDeleteLocation(loc.id)}>Xóa</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;