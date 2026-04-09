import React, { useState } from 'react';
import axios from 'axios';

const ControlPanel = ({ onSolve, stats, loading, routes, locations, onSearchResult }) => {
  const [numVehicles, setNumVehicles] = useState(3);
  const [capacity, setCapacity] = useState(20);
  const [algorithm, setAlgorithm] = useState("greedy_dp"); // Trạng thái thuật toán

  // Các state cho chức năng tìm kiếm
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const routeColors = ['#E74C3C', '#2980B9', '#27AE60', '#8E44AD', '#F39C12', '#16A085'];

  // --- HÀM XỬ LÝ TÌM KIẾM ---
  const handleSearch = async (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    
    // Chỉ gọi API khi gõ từ 3 ký tự trở lên để tránh lag
    if (val.length < 3) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const res = await axios.get(`http://127.0.0.1:8000/api/search/?q=${val}`);
      setSearchResults(res.data);
    } catch (err) {
      console.error("Lỗi tìm kiếm:", err);
    } finally {
      setSearching(false);
    }
  };

  // --- HÀM KHI CHỌN KẾT QUẢ TÌM KIẾM ---
  const selectResult = (res) => {
    if (onSearchResult) {
      onSearchResult({ lat: res.lat, lng: res.lng }); // Gửi tọa độ lên App.jsx
    }
    setSearchQuery(""); // Xóa chữ trong ô tìm kiếm
    setSearchResults([]); // Ẩn menu thả xuống
  };

  // --- HÀM CHẠY THUẬT TOÁN ---
  const handleSubmit = (e) => {
    e.preventDefault();
    onSolve(numVehicles, capacity, algorithm); // Gọi hàm onSolve kèm theo thuật toán đã chọn
  };

  return (
    <div className="control-panel">
      <h2>Hệ thống CVRP</h2>
      <p className="subtitle">Tối ưu lộ trình giao hàng</p>

      {/* 1. KHUNG TÌM KIẾM ĐỊA CHỈ */}
      <div className="search-section" style={{ marginBottom: '25px', position: 'relative' }}>
        <label style={{ fontWeight: 'bold', fontSize: '14px' }}>Tìm địa chỉ / Tên đường:</label>
        <input 
          type="text" 
          placeholder="VD: Quận 1, Chợ Bến Thành..."
          value={searchQuery}
          onChange={handleSearch}
          style={{ width: '100%', padding: '10px', borderRadius: '5px', border: 'none', marginTop: '5px', color: '#2c3e50', fontSize: '14px' }}
        />
        
        {searching && <div style={{ fontSize: '12px', marginTop: '5px', color: '#bdc3c7' }}>Đang tìm kiếm...</div>}

        {/* Danh sách kết quả thả xuống */}
        {searchResults.length > 0 && (
          <div className="search-dropdown" style={{
            position: 'absolute', top: '100%', left: 0, right: 0, 
            background: 'white', color: 'black', borderRadius: '5px',
            zIndex: 2000, boxShadow: '0 4px 10px rgba(0,0,0,0.3)', maxHeight: '250px', overflowY: 'auto'
          }}>
            {searchResults.map((res, i) => (
              <div 
                key={i} 
                onClick={() => selectResult(res)}
                style={{ padding: '10px', borderBottom: '1px solid #eee', cursor: 'pointer', fontSize: '13px', lineHeight: '1.4' }}
                onMouseOver={(e) => e.target.style.background = '#f0f0f0'}
                onMouseOut={(e) => e.target.style.background = 'transparent'}
              >
                {res.display_name}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. FORM NHẬP THÔNG SỐ CVRP */}
      <form onSubmit={handleSubmit} className="form-group">
        <label>Số lượng xe tối đa (K):</label>
        <input 
          type="number" 
          value={numVehicles} 
          onChange={(e) => setNumVehicles(parseInt(e.target.value))} 
          min="1" required 
        />

        <label>Sức chứa mỗi xe (C):</label>
        <input 
          type="number" 
          value={capacity} 
          onChange={(e) => setCapacity(parseInt(e.target.value))} 
          min="1" required 
        />

        <label>Thuật toán tối ưu:</label>
        <select 
          value={algorithm} 
          onChange={(e) => setAlgorithm(e.target.value)}
          style={{ padding: '10px', borderRadius: '5px', border: 'none', fontSize: '14px', color: '#2c3e50' }}
        >
          <option value="greedy">Chỉ Gom cụm (Greedy)</option>
          <option value="greedy_dp">Gom cụm + Tối ưu (Greedy + DP)</option>
        </select>

        <button type="submit" disabled={loading} className="solve-btn">
          {loading ? 'Đang tính toán...' : 'Chạy thuật toán Tối ưu'}
        </button>
      </form>

      {/* 3. ỐNG KÊ KẾT QUẢ */}
      {stats && (
        <div className="stats-board">
          <h3>Kết quả thuật toán</h3>
          <p>Trạng thái: <span className="success">Thành công</span></p>
          <p>Tổng quãng đường: <strong>{(stats.total_system_distance / 1000).toFixed(2)} km</strong></p>
          <p>Thời gian chạy: <strong>{stats.execution_time_ms.toFixed(2)} ms</strong></p>
          <p>Số xe thực tế dùng: <strong>{stats.vehicles_used} xe</strong></p>
        </div>
      )}

      {/* CHI TIẾT LỘ TRÌNH */}
      {routes && routes.length > 0 && locations.length > 0 && (
        <div className="itinerary-board">
          <h3>📍 Chi tiết lộ trình</h3>
          {routes.map((route, index) => {
            const color = routeColors[index % routeColors.length];
            
            const pathNames = route.sequence.map((locId) => {
              const locationObj = locations.find(l => l.id === locId);
              return locationObj ? locationObj.name : `Điểm ${locId}`;
            });

            return (
              <div key={route.vehicle_id} className="route-item" style={{ borderLeftColor: color }}>
                <strong style={{ color: color, fontSize: '15px' }}>
                   Xe {route.vehicle_id} 
                  <span style={{ color: '#bdc3c7', fontSize: '12px', marginLeft: '8px', fontWeight: 'normal'}}>
                    (Tải: {route.total_demand} / {capacity})
                  </span>
                </strong>
                <p>
                  {pathNames.map((name, i) => (
                    <span key={i}>
                      {name}
                      {i < pathNames.length - 1 && <span className="route-arrow"> ➔ </span>}
                    </span>
                  ))}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ControlPanel;