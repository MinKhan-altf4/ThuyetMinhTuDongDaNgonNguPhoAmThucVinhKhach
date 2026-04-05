<?php
// seller/pages/orders.php
require_once __DIR__ . '/../check_login.php';
require_once __DIR__ . '/../config.php';

$seller_id = $_SESSION['seller_id'];
$pageTitle = 'Đơn hàng';

$orders = $pdo->prepare("
    SELECT o.*, p.name AS product_name
    FROM orders o
    JOIN products p ON o.product_id = p.id
    WHERE p.seller_id = ?
    ORDER BY o.created_at DESC
");
$orders->execute([$seller_id]);
$orders = $orders->fetchAll();

$statusLabel = ['pending'=>'Chờ xử lý','processing'=>'Đang xử lý','completed'=>'Hoàn thành','cancelled'=>'Đã huỷ'];
$statusColor = ['pending'=>'bg-amber-100 text-amber-700','processing'=>'bg-blue-100 text-blue-700','completed'=>'bg-emerald-100 text-emerald-700','cancelled'=>'bg-red-100 text-red-700'];
?>
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title><?= $pageTitle ?> — Seller</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@300;400;500;600;700&display=swap" rel="stylesheet"/>
  <style>* { font-family:'Be Vietnam Pro',sans-serif; } @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}} .fade-up{animation:fadeUp .35s ease both}</style>
</head>
<body class="bg-slate-50 text-slate-800">

<?php include __DIR__ . '/../components/sidebar.php'; ?>

<div class="lg:pl-56 flex flex-col min-h-screen">
  <?php include __DIR__ . '/../components/topbar.php'; ?>

  <main class="flex-1 p-4 lg:p-6">
    <div class="fade-up rounded-xl bg-white border border-slate-100 overflow-hidden">
      <div class="px-5 py-4 border-b border-slate-100">
        <h2 class="text-sm font-600 text-slate-800">Danh sách đơn hàng</h2>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-slate-100 text-xs text-slate-400 font-500">
              <th class="px-5 py-3 text-left">#</th>
              <th class="px-5 py-3 text-left">Sản phẩm</th>
              <th class="px-5 py-3 text-left">Khách hàng</th>
              <th class="px-5 py-3 text-left">SL</th>
              <th class="px-5 py-3 text-left">Tổng tiền</th>
              <th class="px-5 py-3 text-left">Trạng thái</th>
              <th class="px-5 py-3 text-left">Ngày đặt</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50">
            <?php if (empty($orders)): ?>
              <tr><td colspan="7" class="px-5 py-10 text-center text-slate-400">Chưa có đơn hàng nào</td></tr>
            <?php else: ?>
              <?php foreach ($orders as $o): ?>
                <tr class="hover:bg-slate-50 transition-colors">
                  <td class="px-5 py-3 text-slate-400">#<?= $o['id'] ?></td>
                  <td class="px-5 py-3 font-500"><?= htmlspecialchars($o['product_name']) ?></td>
                  <td class="px-5 py-3 text-slate-500"><?= htmlspecialchars($o['buyer_name']) ?></td>
                  <td class="px-5 py-3"><?= $o['quantity'] ?></td>
                  <td class="px-5 py-3 font-500"><?= number_format($o['total_price'], 0, ',', '.') ?>đ</td>
                  <td class="px-5 py-3">
                    <span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-500 <?= $statusColor[$o['status']] ?>">
                      <?= $statusLabel[$o['status']] ?>
                    </span>
                  </td>
                  <td class="px-5 py-3 text-slate-400"><?= date('d/m/Y', strtotime($o['created_at'])) ?></td>
                </tr>
              <?php endforeach; ?>
            <?php endif; ?>
          </tbody>
        </table>
      </div>
    </div>
  </main>
</div>
</body>
</html>
