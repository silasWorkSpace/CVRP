from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
import models

from api import location_routes, solver_routes, search_routes

Base.metadata.create_all(bind=engine)

app = FastAPI(title="CVRP Optimization API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(location_routes.router)
app.include_router(solver_routes.router)
app.include_router(search_routes.router) 

@app.get("/")
def read_root():
    return {"message": "Hệ thống CVRP Backend đã sẵn sàng!"}