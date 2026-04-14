import React, { useState, useEffect } from 'react';
import axios from 'axios';
import MapViewer from './components/MapViewer';
import ControlPanel from './components/ControlPanel';
import './App.css';

// Link tới FastAPI Backend của bạn
const API_BASE_URL = 'http://127.0.0.1:8000/api';

function App() {
  const [locations, setLocations] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  // Vừa mở web lên là gọi API lấy danh sách kho và khách hàng vẽ lên map ngay
  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/locations/`);
      setLocations(response.data);
    } catch (error) {
      console.error("Lỗi khi tải địa điểm:", error);
      alert("Không thể kết nối đến Backend.");
    }
  };

  const handleAddLocation = async (newLocationData) => {
    try {
      await axios.post(`${API_BASE_URL}/locations/`, newLocationData);
      alert("Đã thêm địa điểm thành công!");
      fetchLocations(); // Tải lại danh sách để điểm mới hiện lên bản đồ ngay lập tức
    } catch (error) {
      console.error("Lỗi khi thêm:", error);
      alert("Không thể lưu địa điểm này!");
    }
  };

  // Hàm này được gọi khi bấm nút "Chạy thuật toán"
  // 🌟 Đã thêm tham số algorithmType vào đây
  const handleSolve = async (numVehicles, capacity, algorithmType) => {
    setLoading(true);
    setStats(null);
    setRoutes([]);
    
    try {
      const response = await axios.post(`${API_BASE_URL}/solver/solve-cvrp`, {
        num_vehicles: numVehicles,
        capacity: capacity,
        algorithm_type: algorithmType // 🌟 Truyền biến động vào thay vì gõ chết "greedy_dp"
      });
      
      const data = response.data;
      setRoutes(data.routes); 
      
      setStats({
        total_system_distance: data.total_system_distance,
        execution_time_ms: data.execution_time_ms,
        vehicles_used: data.vehicles_used
      });
    } catch (error) {
      console.error("Lỗi thuật toán:", error);
      alert("Lỗi khi giải bài toán! Xem console để biết chi tiết.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <div className="sidebar-container">
        <ControlPanel onSolve={handleSolve} stats={stats} loading={loading} />
      </div>
      <div className="map-container">
        <MapViewer locations={locations} routes={routes} />
      </div>
    </div>
  );
}

export default App;

