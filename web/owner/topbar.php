<?php
// components/topbar.php
// Requires: $pageTitle (string)
?>
<header class="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-slate-100 bg-white px-4 lg:px-6">
  <!-- Left: hamburger + title -->
  <div class="flex items-center gap-3">
    <button onclick="toggleSidebar()" class="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 lg:hidden">
      <svg class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <line x1="3" y1="6" x2="21" y2="6"/>
        <line x1="3" y1="12" x2="21" y2="12"/>
        <line x1="3" y1="18" x2="21" y2="18"/>
      </svg>
    </button>
    <h1 class="text-base font-semibold text-slate-800"><?= htmlspecialchars($pageTitle ?? 'Dashboard') ?></h1>
  </div>

  <!-- Right: restaurant badge + avatar -->
  <div class="flex items-center gap-3">
    <?php if (!empty($_SESSION['restaurant_name'])): ?>
      <span class="hidden sm:inline-flex items-center rounded-full bg-orange-100 text-orange-600 text-xs font-medium px-2.5 py-1">
        🏪 <?= htmlspecialchars($_SESSION['restaurant_name']) ?>
      </span>
    <?php endif; ?>
    <span class="hidden sm:block text-sm text-slate-500"><?= htmlspecialchars($_SESSION['user_name'] ?? '') ?></span>
    <div class="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500 text-xs font-semibold text-white">
      <?= mb_strtoupper(mb_substr($_SESSION['user_name'] ?? 'U', 0, 1)) ?>
    </div>
  </div>
</header>

<script>
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  sidebar.classList.toggle('-translate-x-full');
  overlay.classList.toggle('hidden');
}
</script>