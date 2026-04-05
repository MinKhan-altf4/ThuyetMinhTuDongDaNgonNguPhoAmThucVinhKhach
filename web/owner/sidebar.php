<?php
// components/sidebar.php
$current = basename($_SERVER['PHP_SELF']);

function nav_item($href, $label, $icon, $active) {
    $cls = $active
        ? 'bg-orange-500 text-white'
        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800';
    echo "<a href=\"$href\" class=\"flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors $cls\">$icon $label</a>";
}
?>
<aside id="sidebar" class="fixed inset-y-0 left-0 z-30 flex w-56 flex-col bg-white border-r border-slate-100 transition-transform duration-300 lg:translate-x-0 -translate-x-full">

  <!-- Logo -->
  <div class="flex items-center gap-3 px-5 py-5 border-b border-slate-100">
    <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500">
      <svg class="h-5 w-5 text-white" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    </div>
    <div>
      <p class="text-sm font-semibold text-slate-800">Food App</p>
      <p class="text-xs text-slate-400">
        <?php
        // Tên nhà hàng nếu có
        $rname = $_SESSION['restaurant_name'] ?? 'Quản lý';
        echo htmlspecialchars($rname);
        ?>
      </p>
    </div>
  </div>

  <!-- Nav -->
  <nav class="flex-1 overflow-y-auto px-3 py-4 space-y-1">
    <p class="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400">Quản lý</p>

    <?php nav_item('dashboard.php', 'Tổng quan',
      '<svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>',
      $current === 'dashboard.php'); ?>

    <?php nav_item('dishes.php', 'Thực đơn (Dish)',
      '<svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>',
      $current === 'dishes.php'); ?>

    <?php nav_item('visits.php', 'Lượt ghé thăm',
      '<svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
      $current === 'visits.php'); ?>

    <p class="px-3 mt-4 mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400">Hệ thống</p>

    <?php nav_item('restaurants.php', 'Nhà hàng',
      '<svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
      $current === 'restaurants.php'); ?>

    <?php nav_item('profile.php', 'Hồ sơ',
      '<svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
      $current === 'profile.php'); ?>
  </nav>

  <!-- Footer -->
  <div class="px-3 py-4 border-t border-slate-100">
    <a href="logout.php"
       class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors">
      <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
        <polyline points="16 17 21 12 16 7"/>
        <line x1="21" y1="12" x2="9" y2="12"/>
      </svg>
      Đăng xuất
    </a>
  </div>
</aside>

<!-- Overlay mobile -->
<div id="sidebar-overlay" class="fixed inset-0 z-20 bg-black/40 hidden lg:hidden" onclick="toggleSidebar()"></div>