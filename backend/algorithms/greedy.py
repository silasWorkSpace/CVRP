from typing import Dict, List, Tuple

def run_greedy_clustering(customers: Dict[int, Dict], capacity: int, distance_matrix: Dict[Tuple[int, int], float], depot_id: int = 0) -> List[List[int]]:
    """
    Khởi tạo lộ trình cơ bản bằng phương pháp Heuristic (Nearest Neighbor).
    
    :param customers: Dictionary chứa thông tin khách {id: {'demand': int}}
    :param capacity: Sức chứa tối đa của mỗi xe
    :param distance_matrix: Dictionary lưu cache khoảng cách {(từ, đến): khoảng_cách}
    :return: Mảng 2 chiều chứa các lộ trình (VD: [[0, 1, 3, 0], [0, 2, 0]])
    """
    routes = []
    # Tập hợp các ID khách hàng cần giao (loại bỏ Depot)
    unvisited = set(c_id for c_id in customers.keys() if c_id != depot_id)
    
    while unvisited:
        current_route = [depot_id]
        current_load = 0
        current_node = depot_id
        
        while unvisited:
            nearest_customer = None
            min_dist = float('inf')
            
            # Tìm khách hàng chưa thăm có khoảng cách gần nhất với vị trí hiện tại
            for customer_id in unvisited:
                # Lấy khoảng cách (Nếu không có trong ma trận, gán là vô cực)
                dist = distance_matrix.get((current_node, customer_id), float('inf'))
                
                # Ràng buộc tải trọng: Xe phải chở nổi đơn hàng này
                if dist < min_dist and (current_load + customers[customer_id]['demand'] <= capacity):
                    min_dist = dist
                    nearest_customer = customer_id
                    
            if nearest_customer is not None:
                # Quyết định giao cho khách này, cập nhật trạng thái
                current_route.append(nearest_customer)
                current_load += customers[nearest_customer]['demand']
                unvisited.remove(nearest_customer)
                current_node = nearest_customer
            else:
                # Không tìm được khách phù hợp (xe đã đầy hoặc các khách còn lại ở quá xa)
                break 
                
        # Kết thúc chuyến, xe quay về Depot
        current_route.append(depot_id)
        routes.append(current_route)
        
    return routes