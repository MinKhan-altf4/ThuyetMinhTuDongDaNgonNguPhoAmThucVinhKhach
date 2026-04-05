<?php
session_start();
require_once __DIR__ . '/config.php';

if (!isset($_SESSION['user_id'])) {
    header("Location: login.php");
    exit();
}

$restaurant_id = $_SESSION['restaurant_id'];
$pageTitle = "Nhật ký truy cập";

try {
    // Chỉ lấy dữ liệu của gian hàng hiện tại
    $stmt = $pdo->prepare("
        SELECT * FROM customer_visits 
        WHERE restaurant_id = ? 
        ORDER BY visited_at DESC 
        LIMIT 50
    ");
    $stmt->execute([$restaurant_id]);
    $visits = $stmt->fetchAll(PDO::FETCH_ASSOC);
} catch (Exception $e) {
    $error = "Lỗi database: " . $e->getMessage();
}

include 'css/header.php'; // Đảm bảo file này nằm cùng thư mục hoặc sửa đường dẫn
include 'sidebar.php'; 
?>

<main class="flex-1 lg:ml-56">
    <?php include 'topbar.php'; ?>
    <div class="p-6 bg-slate-50/50 min-h-screen">
        <div class="mb-6 flex justify-between items-end">
            <div>
                <h2 class="text-2xl font-bold text-slate-800">Lượt ghé thăm</h2>
                <p class="text-sm text-slate-500">Thông tin khách hàng truy cập gian hàng</p>
            </div>
            <button class="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all">Xuất báo cáo</button>
        </div>

        <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <table class="w-full text-left">
                <thead>
                    <tr class="bg-slate-50/50 border-b border-slate-100">
                        <th class="px-6 py-4 text-[11px] font-bold uppercase text-slate-400">Mã lượt</th>
                        <th class="px-6 py-4 text-[11px] font-bold uppercase text-slate-400">Thiết bị</th>
                        <th class="px-6 py-4 text-[11px] font-bold uppercase text-slate-400">Ngôn ngữ</th>
                        <th class="px-6 py-4 text-[11px] font-bold uppercase text-slate-400">Địa chỉ IP</th>
                        <th class="px-6 py-4 text-[11px] font-bold uppercase text-slate-400 text-right">Thời gian</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-50">
                    <?php if (empty($visits)): ?>
                        <tr><td colspan="5" class="px-6 py-10 text-center text-slate-400 italic">Chưa có dữ liệu.</td></tr>
                    <?php else: foreach ($visits as $v): ?>
                        <tr class="hover:bg-slate-50/50 transition-colors">
                            <td class="px-6 py-4 text-sm font-medium text-slate-400">#<?= $v['visit_id'] ?></td>
                            <td class="px-6 py-4">
                                <?php $isMob = strtolower($v['device_type']) === 'mobile'; ?>
                                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold <?= $isMob ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600' ?>">
                                    <?= $isMob ? '📱 Mobile' : '💻 Desktop' ?>
                                </span>
                            </td>
                            <td class="px-6 py-4">
                                <span class="text-sm"><?= ($v['language_code'] == 'vi') ? '🇻🇳' : '🇺🇸' ?></span>
                                <span class="text-xs font-bold text-slate-600 ml-1"><?= strtoupper($v['language_code']) ?></span>
                            </td>
                            <td class="px-6 py-4 text-sm font-mono text-slate-500"><?= $v['ip_address'] ?></td>
                            <td class="px-6 py-4 text-right text-sm text-slate-500"><?= date('H:i, d/m/Y', strtotime($v['visited_at'])) ?></td>
                        </tr>
                    <?php endforeach; endif; ?>
                </tbody>
            </table>
        </div>
    </div>
</main>
<?php include 'css/footer.php'; ?>