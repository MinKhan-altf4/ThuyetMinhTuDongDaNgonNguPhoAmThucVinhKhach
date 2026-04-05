<?php
session_start();
require_once __DIR__ . '/config.php';

if (!isset($_SESSION['user_id'])) {
    header("Location: login.php");
    exit();
}

$restaurant_id = $_SESSION['restaurant_id'];
$pageTitle = "Tổng quan";

// Thống kê riêng cho gian hàng này
$stats = ['dishes' => 0, 'visits' => 0];
if ($restaurant_id) {
    $stats['dishes'] = $pdo->prepare("SELECT COUNT(*) FROM dish WHERE restaurant_id = ?");
    $stats['dishes']->execute([$restaurant_id]);
    $stats['dishes'] = $stats['dishes']->fetchColumn();

    $stats['visits'] = $pdo->prepare("SELECT COUNT(*) FROM customer_visits WHERE restaurant_id = ?");
    $stats['visits']->execute([$restaurant_id]);
    $stats['visits'] = $stats['visits']->fetchColumn();
}

include 'css/header.php';
include 'sidebar.php';
?>
<main class="flex-1 lg:ml-56">
    <?php include 'topbar.php'; ?>
    <div class="p-6 bg-slate-50/50 min-h-screen">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div class="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <p class="text-sm font-medium text-slate-500">Tổng món ăn</p>
                <h3 class="text-3xl font-bold text-slate-800 mt-1"><?= number_format($stats['dishes']) ?></h3>
            </div>
            <div class="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <p class="text-sm font-medium text-slate-500">Lượt ghé thăm</p>
                <h3 class="text-3xl font-bold text-orange-500 mt-1"><?= number_format($stats['visits']) ?></h3>
            </div>
            </div>

        <div class="bg-orange-50 border border-orange-100 rounded-2xl p-6 text-orange-800">
            <h4 class="font-bold">Chào mừng trở lại!</h4>
            <p class="text-sm opacity-80">Hôm nay gian hàng của bạn có thêm dữ liệu mới, hãy kiểm tra ngay.</p>
        </div>
    </div>
</main>
<?php include './css/footer.php'; ?>