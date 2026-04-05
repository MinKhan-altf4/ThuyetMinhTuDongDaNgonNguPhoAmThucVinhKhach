<?php
session_start();
include 'config.php';

// Kiểm tra đăng nhập qua session username (thiết lập ở check_login.php)
if (!isset($_SESSION['username'])) {
    header("Location: login.php");
    exit();
}

// Lấy thông tin user hiện tại để biết họ quản lý nhà hàng nào (nếu cần)
$current_user = $_SESSION['username'];
$user_query = $conn->query("SELECT restaurant_id FROM users WHERE username = '$current_user'");
$user_data = $user_query->fetch_assoc();
$my_restaurant_id = $user_data['restaurant_id'];
?>

<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <title>Bảng điều khiển Food App</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css">
</head>
<body class="bg-light">
    <div class="container mt-4">
        <div class="d-flex justify-content-between align-items-center bg-white p-3 shadow-sm rounded">
            <div>
                <h4 class="mb-0">Xin chào, <?php echo htmlspecialchars($current_user); ?>!</h4>
                <small class="text-muted">Hệ thống quản lý thực đơn nhà hàng</small>
            </div>
            <a href="logout.php" class="btn btn-danger btn-sm">Đăng xuất</a>
        </div>

        <div class="row mt-4">
            <div class="col-md-4">
                <div class="card border-0 shadow-sm bg-primary text-white p-3">
                    <h6>Tổng số món ăn (Dishes)</h6>
                    <?php 
                        $res = $conn->query("SELECT COUNT(*) as total FROM dish");
                        echo "<h2 class='mb-0'>" . $res->fetch_assoc()['total'] . "</h2>";
                    ?>
                </div>
            </div>

            <div class="col-md-4">
                <div class="card border-0 shadow-sm bg-success text-white p-3">
                    <h6>Số lượng nhà hàng</h6>
                    <?php 
                        $res = $conn->query("SELECT COUNT(*) as total FROM restaurant");
                        echo "<h2 class='mb-0'>" . $res->fetch_assoc()['total'] . "</h2>";
                    ?>
                </div>
            </div>

            <div class="col-md-4">
                <div class="card border-0 shadow-sm bg-warning text-dark p-3">
                    <h6>Tổng lượt khách ghé thăm</h6>
                    <?php 
                        $res = $conn->query("SELECT COUNT(*) as total FROM customer_visits");
                        echo "<h2 class='mb-0'>" . $res->fetch_assoc()['total'] . "</h2>";
                    ?>
                </div>
            </div>
        </div>

        <div class="card mt-4 border-0 shadow-sm">
            <div class="card-header bg-white py-3">
                <h5 class="mb-0">Danh sách thực đơn (Dữ liệu từ bảng dish)</h5>
            </div>
            <div class="card-body p-0">
                <table class="table table-hover mb-0">
                    <thead class="table-light">
                        <tr>
                            <th>ID</th>
                            <th>Tên món (Dish Name)</th>
                            <th>Mô tả</th>
                            <th class="text-end">Giá bán</th>
                            <th class="text-center">Trạng thái</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php
                        // Truy vấn chính xác các cột: dish_id, name, description, price, is_active từ bảng dish
                        $sql = "SELECT dish_id, name, description, price, is_active FROM dish ORDER BY dish_id DESC";
                        $result = $conn->query($sql);

                        if ($result && $result->num_rows > 0) {
                            while($row = $result->fetch_assoc()) {
                                $status_class = $row['is_active'] ? 'bg-success' : 'bg-secondary';
                                $status_text = $row['is_active'] ? 'Đang bán' : 'Ngừng bán';
                                
                                echo "<tr>
                                        <td>#{$row['dish_id']}</td>
                                        <td><strong>{$row['name']}</strong></td>
                                        <td><small class='text-muted'>{$row['description']}</small></td>
                                        <td class='text-end text-primary fw-bold'>" . number_format($row['price'], 0, ',', '.') . " đ</td>
                                        <td class='text-center'>
                                            <span class='badge $status_class'>$status_text</span>
                                        </td>
                                      </tr>";
                            }
                        } else {
                            echo "<tr><td colspan='5' class='text-center py-4'>Không có món ăn nào trong hệ thống.</td></tr>";
                        }
                        ?>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</body>
</html>