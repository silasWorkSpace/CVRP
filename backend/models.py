from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, JSON
from database import Base

class Location(Base):
    __tablename__ = "locations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=True)          # Tên địa điểm (VD: "Kho Quận 1")
    lat = Column(Float, nullable=False)                # Vĩ độ
    lng = Column(Float, nullable=False)                # Kinh độ
    demand = Column(Integer, default=0)                # Khối lượng hàng (Depot = 0)
    is_depot = Column(Boolean, default=False)          # Đánh dấu đây là kho hay khách hàng

class DistanceMatrix(Base):
    __tablename__ = "distance_matrix"

    # Khóa chính kép (Composite Primary Key) từ 2 địa điểm
    from_location_id = Column(Integer, ForeignKey("locations.id"), primary_key=True)
    to_location_id = Column(Integer, ForeignKey("locations.id"), primary_key=True)
    
    distance = Column(Float, nullable=False)           # Quãng đường thực tế (met hoặc km)
    travel_time = Column(Float, nullable=True)         # Thời gian di chuyển (giây/phút) - tùy chọn
    
    # Lưu mảng tọa độ [lat, lng] của đường đi để vẽ đè lên bản đồ
    path_coordinates = Column(JSON, nullable=True)