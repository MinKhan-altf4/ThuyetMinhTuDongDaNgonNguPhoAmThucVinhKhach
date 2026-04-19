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
    'total_dishes'    => 0,
    'active_dishes'   => 0,
    'avg_rating'      => 0,
    // Visit stats (từ Analytics.tsx)
    'total_visitors'  => 0,    // Khách độc nhất (unique session_id)
    'total_visits'    => 0,    // Tổng số lần truy cập POI

    'today_visits'    => 0,    // Lượt truy cập hôm nay
    'last_visit_time' => null, // Lần truy cập gần nhất
];

if ($restaurant_id) {
    // 1. Tổng số món ăn
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM dish WHERE restaurant_id = ?");
    $stmt->execute([$restaurant_id]);
    $stats['total_dishes'] = $stmt->fetchColumn();

    // 2. Món ăn đang hoạt động
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM dish WHERE restaurant_id = ? AND is_active = 1");
    $stmt->execute([$restaurant_id]);
    $stats['active_dishes'] = $stmt->fetchColumn();

    // 3. Khách độc nhất (unique visitors theo session_id)
    $stmt = $pdo->prepare("SELECT COUNT(DISTINCT session_id) FROM customer_visits WHERE restaurant_id = ?");
    $stmt->execute([$restaurant_id]);
    $stats['total_visitors'] = $stmt->fetchColumn();

    // 4. Tổng số lần truy cập POI
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM customer_visits WHERE restaurant_id = ?");
    $stmt->execute([$restaurant_id]);
    $stats['total_visits'] = $stmt->fetchColumn();

    // 6. Lượt truy cập hôm nay
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM customer_visits WHERE restaurant_id = ? AND DATE(visited_at) = CURDATE()");
    $stmt->execute([$restaurant_id]);
    $stats['today_visits'] = $stmt->fetchColumn();

    // 7. Lần truy cập gần nhất
    $stmt = $pdo->prepare("SELECT MAX(visited_at) FROM customer_visits WHERE restaurant_id = ?");
    $stmt->execute([$restaurant_id]);
    $stats['last_visit_time'] = $stmt->fetchColumn();

    // 8. Điểm đánh giá
    if ($restaurant) {
        $stats['avg_rating'] = $restaurant['rating'] ?? 0;
    }
}

// Tính toán chỉ số phụ
$avg_visits_per_visitor = $stats['total_visitors'] > 0
    ? round($stats['total_visits'] / $stats['total_visitors'], 2) : 0;



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

        <!-- Card 2: Khách độc nhất -->
        <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 hover:shadow-md transition-shadow">
            <div class="flex items-start justify-between">
                <div class="flex-1">
                    <p class="text-sm font-medium text-slate-500 mb-2">Khách truy cập</p>
                    <h3 class="text-4xl font-bold text-slate-900"><?= number_format($stats['total_visitors']) ?></h3>
                    <p class="text-xs text-slate-400 mt-2">Khách độc nhất (unique visitors)</p>
                </div>
                <div class="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <svg class="w-7 h-7 text-blue-600" fill="currentColor" viewBox="0 0 20 20"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v4h8v-4zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"/></svg>
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

    <!-- ── Thống kê lượt truy cập POI ── -->
    <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-8">
        <div class="flex items-center gap-2 mb-5">
            <span class="text-xl">📊</span>
            <h3 class="text-lg font-semibold text-slate-900">Thống kê lượt truy cập POI</h3>
        </div>

        <!-- 4 metric cards -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <!-- Tổng lần truy cập -->
            <div class="bg-green-50 rounded-xl border border-green-100 p-4">
                <div class="flex items-center gap-2 mb-2">
                    <svg class="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/><path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd"/></svg>
                    <p class="text-xs font-medium text-green-700">Lần truy cập</p>
                </div>
                <p class="text-3xl font-bold text-slate-900"><?= number_format($stats['total_visits']) ?></p>
                <p class="text-xs text-slate-400 mt-1">Tổng số lần</p>
            </div>

            <!-- Hôm nay -->
            <div class="bg-orange-50 rounded-xl border border-orange-100 p-4">
                <div class="flex items-center gap-2 mb-2">
                    <svg class="w-4 h-4 text-orange-600" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"/></svg>
                    <p class="text-xs font-medium text-orange-700">Hôm nay</p>
                </div>
                <p class="text-3xl font-bold text-slate-900"><?= number_format($stats['today_visits']) ?></p>
                <p class="text-xs text-slate-400 mt-1">Lượt ghé hôm nay</p>
            </div>

            <!-- Truy cập gần nhất -->
            <div class="bg-purple-50 rounded-xl border border-purple-100 p-4">
                <div class="flex items-center gap-2 mb-2">
                    <svg class="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/></svg>
                    <p class="text-xs font-medium text-purple-700">Gần nhất</p>
                </div>
                <p class="text-sm font-bold text-slate-900 leading-tight">
                    <?= $stats['last_visit_time']
                        ? date('H:i d/m/Y', strtotime($stats['last_visit_time']))
                        : 'Chưa có' ?>
                </p>
                <p class="text-xs text-slate-400 mt-1">Lần truy cập cuối</p>
            </div>
        </div>

        <!-- Chỉ số phân tích -->
        <div class="bg-slate-50 rounded-xl border border-slate-100 p-4">
            <p class="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">📌 Phân tích chi tiết</p>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div class="flex justify-between items-center py-2 border-b border-slate-200 sm:border-b-0 sm:border-r sm:pr-3">
                    <span class="text-sm text-slate-500">TB lần truy cập / khách</span>
                    <span class="text-sm font-bold text-slate-900"><?= $avg_visits_per_visitor ?></span>
                </div>
                <div class="flex justify-between items-center py-2 sm:pl-3">
                    <span class="text-sm text-slate-500">Khách hôm nay / tổng khách</span>
                    <span class="text-sm font-bold text-slate-900">
                        <?= $stats['total_visitors'] > 0 ? round(($stats['today_visits'] / $stats['total_visitors']) * 100, 1) : 0 ?>%
                    </span>
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