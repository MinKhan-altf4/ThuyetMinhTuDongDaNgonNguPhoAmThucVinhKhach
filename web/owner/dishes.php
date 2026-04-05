<?php
require_once __DIR__ . '/check_login.php';
require_once __DIR__ . '/config.php';

$restaurant_id = $_SESSION['restaurant_id'];
$pageTitle = "Quản lý thực đơn";

$stmt = $pdo->prepare("SELECT * FROM dish WHERE restaurant_id = ? ORDER BY dish_id DESC");
$stmt->execute([$restaurant_id]);
$dishes = $stmt->fetchAll();

include 'css/header.php';
include 'sidebar.php';
?>
<main class="flex-1 lg:ml-56">
    <?php include 'topbar.php'; ?>
    <div class="p-6">
        <div class="mb-6 flex justify-between items-center">
            <h2 class="text-2xl font-bold text-slate-800">Thực đơn của bạn</h2>
            <button class="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-orange-500 transition-all">+ Thêm món mới</button>
        </div>

        <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <table class="w-full text-left">
                <thead>
                    <tr class="bg-slate-50/50 border-b border-slate-100">
                        <th class="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase">Món ăn</th>
                        <th class="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase">Giá bán</th>
                        <th class="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase">Trạng thái</th>
                        <th class="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase text-right">Thao tác</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-50">
                    <?php foreach($dishes as $d): ?>
                    <tr class="hover:bg-slate-50/50 transition-all">
                        <td class="px-6 py-4">
                            <div class="flex items-center gap-3">
                                <img src="<?= $d['image_url'] ?: 'default-food.png' ?>" class="w-10 h-10 rounded-lg object-cover bg-slate-100">
                                <div>
                                    <p class="font-semibold text-slate-700"><?= htmlspecialchars($d['name']) ?></p>
                                    <p class="text-xs text-slate-400 truncate max-w-[200px]"><?= htmlspecialchars($d['description']) ?></p>
                                </div>
                            </div>
                        </td>
                        <td class="px-6 py-4 font-bold text-orange-600"><?= number_format($d['price']) ?>đ</td>
                        <td class="px-6 py-4">
                            <span class="px-2.5 py-1 rounded-full text-[10px] font-bold <?= $d['is_active'] ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500' ?>">
                                <?= $d['is_active'] ? 'Đang bán' : 'Ngừng bán' ?>
                            </span>
                        </td>
                        <td class="px-6 py-4 text-right">
                            <button class="text-slate-400 hover:text-orange-500 px-2 font-bold">Sửa</button>
                            <button class="text-slate-400 hover:text-red-500 px-2 font-bold">Xóa</button>
                        </td>
                    </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </div>
    </div>
</main>
<?php include './css/footer.php'; ?>