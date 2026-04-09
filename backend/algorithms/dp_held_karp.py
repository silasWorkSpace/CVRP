from typing import List, Tuple, Dict

def optimize_route_dp(route: List[int], distance_matrix: Dict[Tuple[int, int], float]) -> Tuple[List[int], float]:
    """
    Áp dụng Quy hoạch động (Held-Karp) để giải bài toán TSP cho một lộ trình đơn lẻ.
    :param route: Danh sách các ID điểm đi qua (VD: [0, 3, 1, 4, 0])
    :return: (Lộ trình sau khi sắp xếp tối ưu, Tổng khoảng cách mới)
    """
    # Lấy các điểm khách hàng 
    nodes = route[1:-1]
    n = len(nodes)
    depot = route[0]
    
    # Nếu xe chỉ chở 0 hoặc 1 khách, không cần tối ưu, tính khoảng cách rồi trả về luôn
    if n <= 1:
        dist = sum(distance_matrix.get((route[i], route[i+1]), 0) for i in range(len(route)-1))
        return route, dist

    # DP Table: memo[(bitmask, last_node_index)] = (min_distance, previous_node_index)
    memo = {}

    # Bước 1: Trạng thái cơ sở - Khoảng cách từ Depot đến từng khách hàng đầu tiên
    for i in range(n):
        mask = 1 << i  # Bật bit thứ i lên 1
        dist_from_depot = distance_matrix.get((depot, nodes[i]), float('inf'))
        memo[(mask, i)] = (dist_from_depot, -1)

    # Bước 2: Xây dựng bảng DP từ tập hợp con cỡ 2 đến n
    import itertools
    for subset_size in range(2, n + 1):
        # Duyệt qua mọi tổ hợp có subset_size điểm
        for subset in itertools.combinations(range(n), subset_size):
            # Tạo bitmask cho tổ hợp hiện tại
            mask = sum(1 << bit for bit in subset)
            
            # Chọn điểm 'i' làm điểm kết thúc của chuỗi hiện tại
            for i in subset:
                prev_mask = mask ^ (1 << i) # Bỏ điểm 'i' ra khỏi mask
                
                min_dist = float('inf')
                min_prev = -1
                
                # Tìm điểm 'j' ngay trước 'i' sao cho quãng đường là nhỏ nhất
                for j in subset:
                    if j == i: continue
                    
                    dist_j_to_i = distance_matrix.get((nodes[j], nodes[i]), float('inf'))
                    prev_cost = memo[(prev_mask, j)][0]
                    cost = prev_cost + dist_j_to_i
                    
                    if cost < min_dist:
                        min_dist = cost
                        min_prev = j
                        
                memo[(mask, i)] = (min_dist, min_prev)

    # Bước 3: Tìm điểm cuối cùng để quay về Depot
    final_mask = (1 << n) - 1
    min_total_dist = float('inf')
    last_node = -1
    
    for i in range(n):
        cost_to_depot = distance_matrix.get((nodes[i], depot), float('inf'))
        total_cost = memo[(final_mask, i)][0] + cost_to_depot
        
        if total_cost < min_total_dist:
            min_total_dist = total_cost
            last_node = i

    # Bước 4: Truy vết (Backtracking) để lấy ra mảng lộ trình chuẩn xác
    optimal_path = []
    current_mask = final_mask
    current_node = last_node
    
    while current_node != -1:
        optimal_path.append(nodes[current_node])
        next_node = memo[(current_mask, current_node)][1]
        current_mask ^= (1 << current_node)
        current_node = next_node
        
    optimal_path.reverse()
    
    # Gắn lại Depot vào điểm đầu và điểm cuối
    final_route = [depot] + optimal_path + [depot]
    return final_route, min_total_dist