<?php
// seller/pages/products.php
require_once __DIR__ . '/../check_login.php';
require_once __DIR__ . '/../config.php';

$seller_id = $_SESSION['seller_id'];
$pageTitle = 'Sản phẩm';

// ── AJAX handlers ──────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action'])) {
    header('Content-Type: application/json');

    $action = $_POST['action'];

    if ($action === 'add') {
        $name  = trim($_POST['name'] ?? '');
        $desc  = trim($_POST['description'] ?? '');
        $price = (int)($_POST['price'] ?? 0);
        $stock = (int)($_POST['stock'] ?? 0);

        if (!$name || $price < 0 || $stock < 0) {
            echo json_encode(['ok' => false, 'msg' => 'Dữ liệu không hợp lệ']);
            exit;
        }
        $stmt = $pdo->prepare("INSERT INTO products (seller_id,name,description,price,stock) VALUES (?,?,?,?,?)");
        $stmt->execute([$seller_id, $name, $desc, $price, $stock]);
        echo json_encode(['ok' => true, 'id' => $pdo->lastInsertId()]);
        exit;
    }

    if ($action === 'edit') {
        $id    = (int)$_POST['id'];
        $name  = trim($_POST['name'] ?? '');
        $desc  = trim($_POST['description'] ?? '');
        $price = (int)($_POST['price'] ?? 0);
        $stock = (int)($_POST['stock'] ?? 0);

        $stmt = $pdo->prepare("UPDATE products SET name=?,description=?,price=?,stock=? WHERE id=? AND seller_id=?");
        $stmt->execute([$name, $desc, $price, $stock, $id, $seller_id]);
        echo json_encode(['ok' => true]);
        exit;
    }

    if ($action === 'delete') {
        $id = (int)$_POST['id'];
        $stmt = $pdo->prepare("DELETE FROM products WHERE id=? AND seller_id=?");
        $stmt->execute([$id, $seller_id]);
        echo json_encode(['ok' => true]);
        exit;
    }

    echo json_encode(['ok' => false, 'msg' => 'Action không hợp lệ']);
    exit;
}

// Lấy danh sách sản phẩm
$products = $pdo->prepare("SELECT * FROM products WHERE seller_id = ? ORDER BY created_at DESC");
$products->execute([$seller_id]);
$products = $products->fetchAll();
?>
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title><?= $pageTitle ?> — Seller</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@300;400;500;600;700&display=swap" rel="stylesheet"/>
  <style>
    * { font-family:'Be Vietnam Pro',sans-serif; }
    @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
    .fade-up{animation:fadeUp .35s ease both}
    @keyframes toastIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
    .toast{animation:toastIn .3s ease both}
  </style>
</head>
<body class="bg-slate-50 text-slate-800">

<?php include __DIR__ . '/../components/sidebar.php'; ?>

<!-- Toast -->
<div id="toast" class="fixed bottom-6 right-6 z-50 hidden">
  <div class="toast flex items-center gap-3 rounded-xl bg-slate-800 px-4 py-3 text-sm text-white shadow-lg">
    <svg class="h-4 w-4 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
    <span id="toast-msg"></span>
  </div>
</div>

<!-- Modal thêm/sửa -->
<div id="modal" class="fixed inset-0 z-40 hidden flex items-center justify-center p-4 bg-black/40">
  <div class="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
    <h3 id="modal-title" class="text-base font-600 text-slate-800 mb-5"></h3>
    <input type="hidden" id="edit-id"/>
    <div class="space-y-4">
      <div>
        <label class="block text-xs font-500 text-slate-600 mb-1">Tên sản phẩm *</label>
        <input id="f-name" type="text" class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"/>
      </div>
      <div>
        <label class="block text-xs font-500 text-slate-600 mb-1">Mô tả</label>
        <textarea id="f-desc" rows="2" class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"></textarea>
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block text-xs font-500 text-slate-600 mb-1">Giá (VNĐ) *</label>
          <input id="f-price" type="number" min="0" class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"/>
        </div>
        <div>
          <label class="block text-xs font-500 text-slate-600 mb-1">Tồn kho *</label>
          <input id="f-stock" type="number" min="0" class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"/>
        </div>
      </div>
    </div>
    <div class="mt-5 flex gap-2 justify-end">
      <button onclick="closeModal()" class="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">Hủy</button>
      <button onclick="saveProduct()" class="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-600 text-white hover:bg-emerald-700">Lưu</button>
    </div>
  </div>
</div>

<div class="lg:pl-56 flex flex-col min-h-screen">
  <?php include __DIR__ . '/../components/topbar.php'; ?>

  <main class="flex-1 p-4 lg:p-6">
    <div class="fade-up rounded-xl bg-white border border-slate-100 overflow-hidden">

      <!-- Header -->
      <div class="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <h2 class="text-sm font-600 text-slate-800">Danh sách sản phẩm</h2>
        <button onclick="openModal('add')" class="flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-600 text-white hover:bg-emerald-700 transition">
          <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Thêm mới
        </button>
      </div>

      <!-- Table -->
      <div class="overflow-x-auto" id="product-table-wrap">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-slate-100 text-xs text-slate-400 font-500">
              <th class="px-5 py-3 text-left">Tên sản phẩm</th>
              <th class="px-5 py-3 text-left">Mô tả</th>
              <th class="px-5 py-3 text-left">Giá</th>
              <th class="px-5 py-3 text-left">Tồn kho</th>
              <th class="px-5 py-3 text-left w-24">Thao tác</th>
            </tr>
          </thead>
          <tbody id="product-tbody" class="divide-y divide-slate-50">
            <?php if (empty($products)): ?>
              <tr><td colspan="5" class="px-5 py-10 text-center text-slate-400">Chưa có sản phẩm nào. Nhấn "Thêm mới" để bắt đầu.</td></tr>
            <?php else: ?>
              <?php foreach ($products as $p): ?>
                <tr id="row-<?= $p['id'] ?>" class="hover:bg-slate-50 transition-colors">
                  <td class="px-5 py-3 font-500"><?= htmlspecialchars($p['name']) ?></td>
                  <td class="px-5 py-3 text-slate-500 max-w-xs truncate"><?= htmlspecialchars($p['description']) ?></td>
                  <td class="px-5 py-3"><?= number_format($p['price'], 0, ',', '.') ?>đ</td>
                  <td class="px-5 py-3"><?= $p['stock'] ?></td>
                  <td class="px-5 py-3">
                    <div class="flex items-center gap-1">
                      <button onclick='openModal("edit", <?= json_encode($p) ?>)'
                        class="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition">
                        <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      <button onclick="deleteProduct(<?= $p['id'] ?>, '<?= htmlspecialchars($p['name'], ENT_QUOTES) ?>')"
                        class="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition">
                        <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                      </button>
                    </div>
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

<script>
let modalMode = 'add';

function openModal(mode, data = null) {
  modalMode = mode;
  document.getElementById('modal-title').textContent = mode === 'add' ? 'Thêm sản phẩm mới' : 'Chỉnh sửa sản phẩm';
  document.getElementById('edit-id').value = data?.id ?? '';
  document.getElementById('f-name').value = data?.name ?? '';
  document.getElementById('f-desc').value = data?.description ?? '';
  document.getElementById('f-price').value = data?.price ?? '';
  document.getElementById('f-stock').value = data?.stock ?? '';
  document.getElementById('modal').classList.remove('hidden');
  setTimeout(() => document.getElementById('f-name').focus(), 100);
}

function closeModal() {
  document.getElementById('modal').classList.add('hidden');
}

function showToast(msg) {
  const t = document.getElementById('toast');
  document.getElementById('toast-msg').textContent = msg;
  t.classList.remove('hidden');
  setTimeout(() => t.classList.add('hidden'), 3000);
}

async function saveProduct() {
  const body = new FormData();
  body.append('action', modalMode);
  if (modalMode === 'edit') body.append('id', document.getElementById('edit-id').value);
  body.append('name', document.getElementById('f-name').value);
  body.append('description', document.getElementById('f-desc').value);
  body.append('price', document.getElementById('f-price').value);
  body.append('stock', document.getElementById('f-stock').value);

  const res = await fetch('', { method: 'POST', body });
  const data = await res.json();

  if (data.ok) {
    closeModal();
    showToast(modalMode === 'add' ? 'Đã thêm sản phẩm!' : 'Đã cập nhật!');
    setTimeout(() => location.reload(), 800);
  } else {
    alert(data.msg || 'Có lỗi xảy ra');
  }
}

async function deleteProduct(id, name) {
  if (!confirm(`Xóa sản phẩm "${name}"?`)) return;
  const body = new FormData();
  body.append('action', 'delete');
  body.append('id', id);

  const res = await fetch('', { method: 'POST', body });
  const data = await res.json();
  if (data.ok) {
    document.getElementById('row-' + id)?.remove();
    showToast('Đã xóa sản phẩm!');
  }
}

// Đóng modal khi click ngoài
document.getElementById('modal').addEventListener('click', function(e) {
  if (e.target === this) closeModal();
});
</script>
</body>
</html>
