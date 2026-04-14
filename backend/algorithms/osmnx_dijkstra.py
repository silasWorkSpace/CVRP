import osmnx as ox
import networkx as nx
from typing import Tuple, List
import math


def load_street_graph(place_name: str = "District 1, Ho Chi Minh City, Vietnam"):
    """
    Tải đồ thị đường phố từ OpenStreetMap.
    Chỉ lấy các tuyến đường cho phép ô tô/xe máy chạy (drive).
    """
    print(f"Đang tải bản đồ khu vực: {place_name}...")
    G = ox.graph_from_place(place_name, network_type="drive")
    print("Tải bản đồ hoàn tất!")
    return G


def calculate_real_distance(
    G,
    origin_lat: float,
    origin_lng: float,
    dest_lat: float,
    dest_lng: float,
) -> Tuple[float, List[List[float]]]:
    """
    Tìm đường đi ngắn nhất giữa 2 tọa độ GPS bằng thuật toán Dijkstra.
    Trả về: (Khoảng cách tính bằng mét, Danh sách tọa độ các ngã rẽ)
    """
    try:
        # 1. Ánh xạ tọa độ GPS vào Node gần nhất trên đồ thị
        orig_node = ox.distance.nearest_nodes(G, origin_lng, origin_lat)
        dest_node = ox.distance.nearest_nodes(G, dest_lng, dest_lat)

        # 2. Chạy Dijkstra
        path = nx.shortest_path(G, orig_node, dest_node, weight="length")
        distance = nx.shortest_path_length(G, orig_node, dest_node, weight="length")

        # 3. Trích xuất tọa độ [Lat, Lng]
        path_coords = [[G.nodes[node]["y"], G.nodes[node]["x"]] for node in path]

        return distance, path_coords

    except nx.NetworkXNoPath:
        # Dùng công thức Haversine tính đường thẳng rồi nhân hệ số 1.5
        R = 6371000 # Bán kính trái đất (mét)
        phi1, phi2 = math.radians(origin_lat), math.radians(dest_lat)
        dphi = math.radians(dest_lat - origin_lat)
        dlambda = math.radians(dest_lng - origin_lng)
        a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlambda/2)**2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
        straight_dist = R * c
        return straight_dist * 1.5, []
