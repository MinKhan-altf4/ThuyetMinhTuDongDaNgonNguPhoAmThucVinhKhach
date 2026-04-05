<?php
// seller/pages/dashboard.php
require_once __DIR__ . '/../check_login.php';
require_once __DIR__ . '/../config.php';

$seller_id = $_SESSION['seller_id'];
$pageTitle = 'Tổng quan';

// Stats
$totalProducts = $pdo->prepare("SELECT COUNT(*) FROM products WHERE seller_id = ?");
$totalProducts->execute([$seller_id]);
$totalProducts = $totalProducts->fetchColumn();

$totalOrders = $pdo->prepare("SELECT COUNT(*) FROM orders o JOIN products p ON o.product_id = p.id WHERE p.seller_id = ?");
$totalOrders->execute([$seller_id]);
$totalOrders = $totalOrders->fetchColumn();

$revenue = $pdo->prepare("SELECT COALESCE(SUM(o.total_price),0) FROM orders o JOIN products p ON o.product_id = p.id WHERE p.seller_id = ? AND o.status = 'completed'");
$revenue->execute([$seller_id]);
$revenue = $revenue->fetchColumn();

// Recent orders
$recentOrders = $pdo->prepare("
    SELECT o.*, p.name AS product_name
    FROM orders o
    JOIN products p ON o.product_id = p.id
    WHERE p.seller_id = ?
    ORDER BY o.created_at DESC
    LIMIT 5
");
$recentOrders->execute([$seller_id]);
$recentOrders = $recentOrders->fetchAll();

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

  <main class="flex-1 p-4 lg:p-6 space-y-6">

    <!-- Stat cards -->
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <!-- Sản phẩm -->
      <div class="fade-up rounded-xl bg-white border border-slate-100 p-5 flex items-center gap-4" style="animation-delay:.05s">
        <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
          <svg class="h-6 w-6 text-blue-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
        </div>
        <div>
          <p class="text-xs text-slate-500 font-500">Sản phẩm</p>
          <p class="text-2xl font-700 text-slate-800"><?= $totalProducts ?></p>
        </div>
      </div>

      <!-- Đơn hàng -->
      <div class="fade-up rounded-xl bg-white border border-slate-100 p-5 flex items-center gap-4" style="animation-delay:.1s">
        <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50">
          <svg class="h-6 w-6 text-amber-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
        </div>
        <div>
          <p class="text-xs text-slate-500 font-500">Đơn hàng</p>
          <p class="text-2xl font-700 text-slate-800"><?= $totalOrders ?></p>
        </div>
      </div>

      <!-- Doanh thu -->
      <div class="fade-up rounded-xl bg-white border border-slate-100 p-5 flex items-center gap-4" style="animation-delay:.15s">
        <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50">
          <svg class="h-6 w-6 text-emerald-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
        </div>
        <div>
          <p class="text-xs text-slate-500 font-500">Doanh thu</p>
          <p class="text-2xl font-700 text-slate-800"><?= number_format($revenue, 0, ',', '.') ?>đ</p>
        </div>
      </div>
    </div>

    <!-- Recent orders -->
    <div class="fade-up rounded-xl bg-white border border-slate-100 overflow-hidden" style="animation-delay:.2s">
      <div class="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <h2 class="text-sm font-600 text-slate-800">Đơn hàng gần đây</h2>
        <a href="/seller/pages/orders.php" class="text-xs text-emerald-600 hover:underline font-500">Xem tất cả</a>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-slate-100 text-xs text-slate-400 font-500">
              <th class="px-5 py-3 text-left">Sản phẩm</th>
              <th class="px-5 py-3 text-left">Khách hàng</th>
              <th class="px-5 py-3 text-left">SL</th>
              <th class="px-5 py-3 text-left">Tổng tiền</th>
              <th class="px-5 py-3 text-left">Trạng thái</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50">
            <?php if (empty($recentOrders)): ?>
              <tr><td colspan="5" class="px-5 py-10 text-center text-slate-400">Chưa có đơn hàng nào</td></tr>
            <?php else: ?>
              <?php foreach ($recentOrders as $order): ?>
                <tr class="hover:bg-slate-50 transition-colors">
                  <td class="px-5 py-3 font-500"><?= htmlspecialchars($order['product_name']) ?></td>
                  <td class="px-5 py-3 text-slate-500"><?= htmlspecialchars($order['buyer_name']) ?></td>
                  <td class="px-5 py-3"><?= $order['quantity'] ?></td>
                  <td class="px-5 py-3 font-500"><?= number_format($order['total_price'], 0, ',', '.') ?>đ</td>
                  <td class="px-5 py-3">
                    <span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-500 <?= $statusColor[$order['status']] ?>">
                      <?= $statusLabel[$order['status']] ?>
                    </span>
                  </td>
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
