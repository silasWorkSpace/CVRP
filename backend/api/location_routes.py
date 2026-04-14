from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

import models, schemas
from database import get_db

# Khởi tạo Router cho đường dẫn bắt đầu bằng /api/locations
router = APIRouter(prefix="/api/locations", tags=["Locations"])

@router.get("/", response_model=List[schemas.LocationResponse])
def get_all_locations(db: Session = Depends(get_db)):
    """Lấy danh sách toàn bộ Depot và Khách hàng từ Database"""
    locations = db.query(models.Location).all()
    return locations

@router.post("/", response_model=schemas.LocationResponse)
def create_location(location: schemas.LocationCreate, db: Session = Depends(get_db)):
    """Thêm một điểm giao hàng mới hoặc Kho mới lên bản đồ"""
    if location.is_depot:
        db.query(models.Location).update({models.Location.is_depot: False})
        
    db_location = models.Location(**location.model_dump())
    db.add(db_location)
    db.commit()
    db.refresh(db_location)
    return db_location

@router.delete("/{location_id}")
def delete_location(location_id: int, db: Session = Depends(get_db)):
    loc = db.query(models.Location).filter(models.Location.id == location_id).first()
    if loc:
        db.delete(loc)
        db.commit()
        return {"status": "success", "message": "Đã xóa địa điểm"}
    raise HTTPException(status_code=404, detail="Không tìm thấy địa điểm")