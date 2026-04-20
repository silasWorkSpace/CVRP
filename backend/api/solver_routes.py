from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import time

import models, schemas
from database import get_db
from algorithms.osmnx_dijkstra import load_street_graph, calculate_real_distance
from algorithms.greedy import run_greedy_clustering
from algorithms.dp_held_karp import optimize_route_dp

router = APIRouter(prefix="/api/solver", tags=["Solver"])

# Biến toàn cục để lưu bản đồ trong RAM, tránh việc mỗi lần tính toán lại phải tải lại bản đồ
STREET_GRAPH = None 

def get_graph():
    global STREET_GRAPH
    if STREET_GRAPH is None:
        STREET_GRAPH = load_street_graph()
    return STREET_GRAPH

@router.post("/solve-cvrp", response_model=schemas.CVRPSolveResponse)
def solve_routing_problem(request: schemas.CVRPSolveRequest, db: Session = Depends(get_db)):
    start_time = time.time()
    
    # 1. Lấy dữ liệu Location
    locations = db.query(models.Location).all()
    if len(locations) < 2:
        raise HTTPException(status_code=400, detail="Cần ít nhất 1 Kho và 1 Khách hàng")
        
    depot = next((loc for loc in locations if loc.is_depot), None)
    if not depot:
        raise HTTPException(status_code=400, detail="Chưa có Kho hàng (Depot)")

    # 2. Xử lý Ma trận khoảng cách & Caching (Dijkstra)
    # Lấy toàn bộ khoảng cách đã lưu trong DB ra
    saved_distances = db.query(models.DistanceMatrix).all()
    dist_dict = {(d.from_location_id, d.to_location_id): d for d in saved_distances}
    
    distance_matrix_value = {} # Chỉ lưu giá trị số thực để đưa vào thuật toán
    
    graph = None # Lazy load bản đồ
    
    # Kiểm tra cặp điểm nào chưa có khoảng cách thì chạy Dijkstra bù vào
    for orig in locations:
        for dest in locations:
            if orig.id == dest.id:
                distance_matrix_value[(orig.id, dest.id)] = 0.0
                continue
                
            if (orig.id, dest.id) not in dist_dict:
                if graph is None: graph = get_graph()
                
                # Chạy Dijkstra thực tế
                dist, coords = calculate_real_distance(graph, orig.lat, orig.lng, dest.lat, dest.lng)
                
                # Lưu ngay vào Database để lần sau dùng (Caching)
                new_dist = models.DistanceMatrix(
                    from_location_id=orig.id, 
                    to_location_id=dest.id, 
                    distance=dist, 
                    path_coordinates=coords
                )
                db.add(new_dist)
                db.commit()
                
                dist_dict[(orig.id, dest.id)] = new_dist
                
            distance_matrix_value[(orig.id, dest.id)] = dist_dict[(orig.id, dest.id)].distance

    # 3. Chạy Thuật toán Lõi
    # Chuẩn bị Data cho thuật toán
    customers_data = {loc.id: {'demand': loc.demand} for loc in locations if not loc.is_depot}
    
    # Chạy Thuật toán chia cụm
    if request.algorithm_type == "none":
        # KHÔNG TỐI ƯU: Nhét bừa vào xe theo thứ tự danh sách
        initial_routes = []
        current_route = [depot.id]
        current_load = 0
        for cid, cdata in customers_data.items():
            if current_load + cdata['demand'] <= request.capacity:
                current_route.append(cid)
                current_load += cdata['demand']
            else:
                current_route.append(depot.id)
                initial_routes.append(current_route)
                current_route = [depot.id, cid]
                current_load = cdata['demand']
        if len(current_route) > 1:
            current_route.append(depot.id)
            initial_routes.append(current_route)
    else:
        # TỐI ƯU: Chạy Greedy phân cụm thông minh
        initial_routes = run_greedy_clustering(
            customers=customers_data, 
            capacity=request.capacity, 
            distance_matrix=distance_matrix_value, 
            depot_id=depot.id
        )
    
    # Chạy DP (Quy hoạch động) cho từng cụm và build RouteDetail
    final_routes_detail = []
    total_system_distance = 0.0
    
    for idx, route in enumerate(initial_routes):
        # Tối ưu hóa thứ tự
        if request.algorithm_type == "greedy_dp":
            optimized_route, route_dist = optimize_route_dp(route, distance_matrix_value)
        else:
            optimized_route = route # Nếu chỉ chọn Greedy thì giữ nguyên
            route_dist = sum(distance_matrix_value.get((route[i], route[i+1]), 0) for i in range(len(route)-1))
            
        total_system_distance += route_dist
        
        # Lấy mảng tọa độ 
        full_path_coords = []
        for i in range(len(optimized_route) - 1):
            from_id = optimized_route[i]
            to_id = optimized_route[i+1]
            if from_id != to_id:
                db_record = dist_dict.get((from_id, to_id))
                if db_record and db_record.path_coordinates:
                    full_path_coords.extend(db_record.path_coordinates)
        
        # Đóng gói dữ liệu lộ trình
        total_demand = sum(customers_data[node]['demand'] for node in optimized_route[1:-1])
        
        final_routes_detail.append(schemas.RouteDetail(
            vehicle_id=idx + 1,
            total_demand=total_demand,
            route_distance=route_dist,
            sequence=optimized_route,
            path_coordinates=full_path_coords
        ))

    execution_time = (time.time() - start_time) * 1000 # Đổi ra mili-giây
    
    # 4. Trả về kết quả JSON
    return schemas.CVRPSolveResponse(
        status="success",
        total_system_distance=total_system_distance,
        execution_time_ms=execution_time,
        vehicles_used=len(final_routes_detail),
        routes=final_routes_detail
    )