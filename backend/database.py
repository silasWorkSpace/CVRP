from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base

# Cấu hình kết nối MySQL
DB_USER = "root"
DB_PASSWORD = ""
DB_HOST = "localhost"
DB_NAME = "cvrp_db"

# Chuỗi kết nối tới database đích
SQLALCHEMY_DATABASE_URL = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}/{DB_NAME}"

# Tạo database nếu chưa tồn tại
server_engine = create_engine(f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}")
with server_engine.connect() as connection:
    connection.execute(text(f"CREATE DATABASE IF NOT EXISTS `{DB_NAME}`"))
    connection.commit()

# Khởi tạo Engine cho database ứng dụng
engine = create_engine(SQLALCHEMY_DATABASE_URL)

# Tạo Session class để làm việc với DB
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class để các Model kế thừa
Base = declarative_base()

# Dependency: Hàm này sẽ cung cấp 1 phiên làm việc (session) mỗi khi có request tới API
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
