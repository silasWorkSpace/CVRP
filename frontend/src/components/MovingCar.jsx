import React, { useState, useEffect } from 'react';
import { Marker } from 'react-leaflet';
import L from 'leaflet';

const MovingCar = ({ pathCoordinates, color, vehicleId }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!pathCoordinates || pathCoordinates.length < 2) return;

    // Vòng lặp di chuyển xe dọc theo mảng tọa độ
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        // Nếu xe chạy đến cuối đường, cho vòng lại từ đầu để mô phỏng liên tục
        if (prevIndex >= pathCoordinates.length - 1) {
          return 0; 
        }
        return prevIndex + 1;
      });
    }, 200); // Tốc độ xe chạy

    return () => clearInterval(interval);
  }, [pathCoordinates]);

  if (!pathCoordinates || pathCoordinates.length === 0) return null;

  const currentPosition = pathCoordinates[currentIndex];

  // Tính toán góc quay của xe (Bearing) để mũi tên chỉ đúng hướng
  let angle = 0;
  if (currentIndex < pathCoordinates.length - 1) {
    const nextPosition = pathCoordinates[currentIndex + 1];
    const dy = nextPosition[0] - currentPosition[0]; // Vĩ độ
    const dx = nextPosition[1] - currentPosition[1]; // Kinh độ
    // Công thức tính góc trên bản đồ (0 độ là hướng Bắc)
    angle = Math.atan2(dx, dy) * (180 / Math.PI);
  }

  const carIcon = L.divIcon({
    className: 'moving-car-icon',
    html: `<div style="
      background-color: ${color};
      color: white;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      border: 3px solid white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      font-weight: bold;
      transform: rotate(${angle}deg);
      box-shadow: 0 0 8px rgba(0,0,0,0.5);
      transition: transform 0.1s linear;
    ">▲</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14], // Đặt tâm icon chính xác vào tọa độ
  });

  return <Marker position={currentPosition} icon={carIcon} zIndexOffset={1000} />;
};

export default MovingCar;