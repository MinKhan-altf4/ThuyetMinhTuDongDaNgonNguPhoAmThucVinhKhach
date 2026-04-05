<?php
session_start();
require_once __DIR__ . '/config.php';

if (!isset($_SESSION['user_id'])) {
    header("Location: login.php");
    exit();
}

$restaurant_id = $_SESSION['restaurant_id'];
$pageTitle = "Tổng quan";

$stats = ['dishes' => 0, 'visits' => 0];
if ($restaurant_id) {
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM dish WHERE restaurant_id = ?");
    $stmt->execute([$restaurant_id]);
    $stats['dishes'] = $stmt->fetchColumn();

    $stmt = $pdo->prepare("SELECT COUNT(*) FROM customer_visits WHERE restaurant_id = ?");
    $stmt->execute([$restaurant_id]);
    $stats['visits'] = $stmt->fetchColumn();
}

include 'header.php'; // header mới (đã gộp sidebar + topbar)
?>

<!-- Nội dung chính của trang, không có thẻ <main> hay topbar ở đây -->
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

<?php include 'footer.php'; ?>