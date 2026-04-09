from pydantic import BaseModel, Field
from typing import List, Optional

# 1. SCHEMAS CHO ĐỊA ĐIỂM (LOCATIONS)

class LocationBase(BaseModel):
    name: Optional[str] = "Khách hàng"
    lat: float = Field(..., description="Vĩ độ (Latitude)")
    lng: float = Field(..., description="Kinh độ (Longitude)")
    demand: int = Field(default=0, ge=0, description="Nhu cầu hàng hóa (>=0)")
    is_depot: bool = Field(default=False, description="True nếu là Kho hàng")

class LocationCreate(LocationBase):
    """Schema dùng khi React gửi request tạo khách hàng mới"""
    pass

class LocationResponse(LocationBase):
    """Schema dùng khi trả dữ liệu khách hàng từ DB về cho React"""
    id: int

    class Config:
        from_attributes = True  # Pydantic v2 giúp convert từ SQLAlchemy Model sang JSON

# 2. SCHEMAS CHO THUẬT TOÁN CVRP (SOLVER)

class CVRPSolveRequest(BaseModel):
    """Schema nhận thông số chạy thuật toán từ form của React"""
    num_vehicles: int = Field(..., gt=0, description="Số lượng xe tối đa (>0)")
    capacity: int = Field(..., gt=0, description="Sức chứa của mỗi xe (>0)")
    algorithm_type: str = Field(default="greedy_dp", description="Chọn 'greedy' hoặc 'greedy_dp'")

class RouteDetail(BaseModel):
    """Chi tiết của một lộ trình đơn lẻ)"""
    vehicle_id: int
    total_demand: int
    route_distance: float
    # Mảng chứa ID các điểm đi qua (VD: [0, 3, 1, 0])
    sequence: List[int] 
    # Mảng 2 chiều chứa toàn bộ tọa độ khúc cua từ Dijkstra để vẽ lên bản đồ
    # VD: [[10.772, 106.698], [10.773, 106.699], ...]
    path_coordinates: List[List[float]] 

class CVRPSolveResponse(BaseModel):
    """Schema trả kết quả tổng thể sau khi giải xong bài toán"""
    status: str
    total_system_distance: float
    execution_time_ms: float
    vehicles_used: int
    routes: List[RouteDetail]