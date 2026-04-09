from fastapi import APIRouter, Query
from geopy.geocoders import Nominatim
from typing import List

router = APIRouter(prefix="/api/search", tags=["Search"])

geolocator = Nominatim(user_agent="cvrp_optimization_app")

@router.get("/")
def search_address(q: str = Query(..., description="Từ khóa tìm kiếm (địa chỉ, quận, tên điểm)")):
    """Tìm kiếm tọa độ dựa trên tên địa chỉ"""
    try:
        # Giới hạn tìm kiếm trong Việt Nam
        results = geolocator.geocode(q, exactly_one=False, limit=5, country_codes="vn")
        
        if not results:
            return []
            
        return [
            {
                "display_name": r.address,
                "lat": r.latitude,
                "lng": r.longitude
            } for r in results
        ]
    except Exception as e:
        return {"error": str(e)}