from database import SessionLocal
from models import Location

def seed_hcmc_trap():
    db = SessionLocal()
    try:
        db.query(Location).delete()
        
        locations = [
            # Kho (Depot) - Nằm ở trung tâm
            {"name": "Kho - Hồ Con Rùa", "lat": 10.7827, "lng": 106.6958, "demand": 0, "is_depot": True},
            
            {"name": "Chùa Vĩnh Nghiêm", "lat": 10.7934, "lng": 106.6828, "demand": 4, "is_depot": False},
            {"name": "Dinh Độc Lập", "lat": 10.7770, "lng": 106.6954, "demand": 3, "is_depot": False},
            
            {"name": "Landmark 81", "lat": 10.7950, "lng": 106.7219, "demand": 5, "is_depot": False},
            {"name": "Thảo Cầm Viên", "lat": 10.7875, "lng": 106.7053, "demand": 2, "is_depot": False},
            {"name": "Bến Bạch Đằng", "lat": 10.7756, "lng": 106.7068, "demand": 4, "is_depot": False},
        ]

        for loc_data in locations:
            db.add(Location(**loc_data))
        db.commit()
        print("DONE")
    except Exception as e:
        db.rollback()
        print(f"Lỗi: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_hcmc_trap()