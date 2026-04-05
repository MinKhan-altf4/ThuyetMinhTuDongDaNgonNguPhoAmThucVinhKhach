<?php
session_start();
require_once __DIR__ . '/config.php';

if (!isset($_SESSION['user_id'])) {
    header("Location: login.php");
    exit();
}

$restaurant_id = $_SESSION['restaurant_id'];
$user_id = $_SESSION['user_id'];
$pageTitle = "Tổng quan";

// Lấy thông tin nhà hàng
$stmt = $pdo->prepare("SELECT * FROM restaurant WHERE restaurant_id = ?");
$stmt->execute([$restaurant_id]);
$restaurant = $stmt->fetch(PDO::FETCH_ASSOC);

// Lấy thông tin user
$stmt = $pdo->prepare("SELECT * FROM users WHERE user_id = ?");
$stmt->execute([$user_id]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

// Thống kê
$stats = [
    'total_dishes' => 0,
    'active_dishes' => 0,
    'total_visits' => 0,
    'today_visits' => 0,
    'avg_rating' => 0,
    'total_orders' => 0
];

if ($restaurant_id) {
    // Tổng món ăn
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM dish WHERE restaurant_id = ?");
    $stmt->execute([$restaurant_id]);
    $stats['total_dishes'] = $stmt->fetchColumn();

    // Món ăn đang bán
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM dish WHERE restaurant_id = ? AND is_active = 1");
    $stmt->execute([$restaurant_id]);
    $stats['active_dishes'] = $stmt->fetchColumn();

    // Tổng lượt ghé thăm
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM customer_visits WHERE restaurant_id = ?");
    $stmt->execute([$restaurant_id]);
    $stats['total_visits'] = $stmt->fetchColumn();

    // Lượt ghé thăm hôm nay (try-catch để xử lý nếu cột không tồn tại)
    try {
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM customer_visits WHERE restaurant_id = ? AND DATE(visited_at) = CURDATE()");
        $stmt->execute([$restaurant_id]);
        $stats['today_visits'] = $stmt->fetchColumn();
    } catch (Exception $e) {
        $stats['today_visits'] = 0;
    }

    // Đánh giá trung bình
    if ($restaurant) {
        $stats['avg_rating'] = $restaurant['rating'] ?? 0;
    }

    // Tổng đơn hàng (nếu có bảng orders)
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM customer_visits WHERE restaurant_id = ?");
    $stmt->execute([$restaurant_id]);
    $stats['total_orders'] = $stmt->fetchColumn();
}

include 'header.php';
?>

<div class="p-6 bg-slate-50 min-h-screen">
    <!-- Header section -->
    <div class="mb-8">
        <div class="flex items-center justify-between mb-6">
            <div>
                <h1 class="text-4xl font-bold text-slate-900">Bảng điều khiển</h1>
                <p class="text-slate-500 mt-1">Tổng quan về hiệu suất nhà hàng của bạn</p>
            </div>
            <div class="text-right">
                <p class="text-sm text-slate-500">Xin chào,</p>
                <p class="text-lg font-semibold text-slate-800"><?= htmlspecialchars($user['name'] ?? 'Người dùng') ?></p>
            </div>
        </div>
    </div>

    <!-- Stats Cards Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <!-- Card 1: Tổng món ăn -->
        <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 hover:shadow-md transition-shadow">
            <div class="flex items-start justify-between">
                <div class="flex-1">
                    <p class="text-sm font-medium text-slate-500 mb-2">Tổng số món ăn</p>
                    <h3 class="text-4xl font-bold text-slate-900"><?= $stats['total_dishes'] ?></h3>
                    <p class="text-xs text-slate-400 mt-2">
                        <span class="text-emerald-600 font-semibold"><?= $stats['active_dishes'] ?></span> đang bán
                    </p>
                </div>
                <div class="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <svg class="w-7 h-7 text-blue-600" fill="currentColor" viewBox="0 0 20 20"><path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 6H6.28l-.31-1.243A1 1 0 005 4H3z"/></svg>
                </div>
            </div>
        </div>

        <!-- Card 2: Lượt ghé thăm -->
        <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 hover:shadow-md transition-shadow">
            <div class="flex items-start justify-between">
                <div class="flex-1">
                    <p class="text-sm font-medium text-slate-500 mb-2">Lượt ghé thăm</p>
                    <h3 class="text-4xl font-bold text-slate-900"><?= number_format($stats['total_visits']) ?></h3>
                    <p class="text-xs text-slate-400 mt-2">
                        <span class="text-orange-600 font-semibold"><?= $stats['today_visits'] ?></span> hôm nay
                    </p>
                </div>
                <div class="w-14 h-14 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
                    <svg class="w-7 h-7 text-orange-600" fill="currentColor" viewBox="0 0 20 20"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v4h8v-4zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"/></svg>
                </div>
            </div>
        </div>

        <!-- Card 3: Đánh giá -->
        <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 hover:shadow-md transition-shadow">
            <div class="flex items-start justify-between">
                <div class="flex-1">
                    <p class="text-sm font-medium text-slate-500 mb-2">Đánh giá trung bình</p>
                    <div class="flex items-baseline gap-2">
                        <h3 class="text-4xl font-bold text-slate-900"><?= number_format($stats['avg_rating'], 1) ?></h3>
                        <span class="text-2xl">⭐</span>
                    </div>
                    <p class="text-xs text-slate-400 mt-2">Dựa trên đánh giá của khách</p>
                </div>
                <div class="w-14 h-14 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <svg class="w-7 h-7 text-amber-600" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                </div>
            </div>
        </div>
    </div>

    <!-- Info Cards -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <!-- Thông tin nhà hàng -->
        <div class="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl border border-blue-200 p-6 shadow-sm">
            <div class="flex items-start gap-4">
                <div class="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center text-white text-xl flex-shrink-0">
                    🏪
                </div>
                <div class="flex-1">
                    <h3 class="font-semibold text-slate-900 text-lg"><?= htmlspecialchars($restaurant['name'] ?? 'Chưa cập nhật') ?></h3>
                    <p class="text-sm text-slate-600 mt-1"><?= htmlspecialchars($restaurant['address'] ?? 'Chưa cập nhật địa chỉ') ?></p>
                    <div class="flex items-center gap-4 mt-3">
                        <span class="text-xs text-slate-600">
                            🕐 <?= htmlspecialchars($restaurant['open_hour'] ?? '--:--') ?> - <?= htmlspecialchars($restaurant['close_hour'] ?? '--:--') ?>
                        </span>
                        <span class="text-xs text-slate-600">
                            📞 <?= htmlspecialchars($restaurant['phone'] ?? 'Chưa cập nhật') ?>
                        </span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Thông tin tài khoản -->
        <div class="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl border border-purple-200 p-6 shadow-sm">
            <div class="flex items-start gap-4">
                <div class="w-12 h-12 rounded-xl bg-purple-500 flex items-center justify-center text-white text-xl flex-shrink-0">
                    👤
                </div>
                <div class="flex-1">
                    <h3 class="font-semibold text-slate-900 text-lg"><?= htmlspecialchars($user['name'] ?? 'Người dùng') ?></h3>
                    <p class="text-sm text-slate-600 mt-1"><?= htmlspecialchars($user['email'] ?? 'Chưa cập nhật email') ?></p>
                    <div class="flex items-center gap-4 mt-3">
                        <span class="text-xs text-slate-600">
                            📱 <?= htmlspecialchars($user['phone'] ?? 'Chưa cập nhật') ?>
                        </span>
                        <span class="text-xs text-slate-600">
                            🆔 ID: #<?= $user['user_id'] ?>
                        </span>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Quick Actions -->
    <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-8">
        <h3 class="text-lg font-semibold text-slate-900 mb-4">🚀 Hành động nhanh</h3>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
            <a href="dishes.php" class="block p-4 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors text-center border border-blue-200">
                <div class="text-2xl mb-2">🍽️</div>
                <p class="text-sm font-medium text-blue-900">Quản lý món ăn</p>
            </a>
            <a href="visits.php" class="block p-4 rounded-xl bg-orange-50 hover:bg-orange-100 transition-colors text-center border border-orange-200">
                <div class="text-2xl mb-2">👥</div>
                <p class="text-sm font-medium text-orange-900">Xem lượt ghé thăm</p>
            </a>
            <a href="profile.php" class="block p-4 rounded-xl bg-purple-50 hover:bg-purple-100 transition-colors text-center border border-purple-200">
                <div class="text-2xl mb-2">⚙️</div>
                <p class="text-sm font-medium text-purple-900">Cài đặt hồ sơ</p>
            </a>
            <a href="logout.php" class="block p-4 rounded-xl bg-red-50 hover:bg-red-100 transition-colors text-center border border-red-200">
                <div class="text-2xl mb-2">🚪</div>
                <p class="text-sm font-medium text-red-900">Đăng xuất</p>
            </a>
        </div>
    </div>

    <!-- Welcome Banner -->
    <div class="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-8 text-white shadow-lg">
        <div class="flex items-start justify-between">
            <div>
                <h2 class="text-2xl font-bold mb-2">🎉 Chào mừng trở lại!</h2>
                <p class="text-orange-100">Nhà hàng của bạn đang hoạt động tốt. Hôm nay có <?= $stats['today_visits'] ?> lượt ghé thăm mới. Tiếp tục cập nhật thực đơn để thu hút thêm khách hàng!</p>
            </div>
            <div class="text-6xl opacity-20">🍽️</div>
        </div>
    </div>
</div>

<?php include 'footer.php'; ?>