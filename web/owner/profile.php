<?php
// seller/pages/profile.php
require_once __DIR__ . '/../check_login.php';
require_once __DIR__ . '/../config.php';

$seller_id = $_SESSION['seller_id'];
$pageTitle = 'Hồ sơ';

$user = $pdo->prepare("SELECT id, name, email, role, created_at FROM users WHERE id = ?");
$user->execute([$seller_id]);
$user = $user->fetch();

$msg = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $name     = trim($_POST['name'] ?? '');
    $password = trim($_POST['password'] ?? '');

    if ($name) {
        if ($password) {
            $hash = password_hash($password, PASSWORD_BCRYPT);
            $pdo->prepare("UPDATE users SET name=?, password=? WHERE id=?")->execute([$name, $hash, $seller_id]);
        } else {
            $pdo->prepare("UPDATE users SET name=? WHERE id=?")->execute([$name, $seller_id]);
        }
        $_SESSION['seller_name'] = $name;
        $msg = 'Cập nhật thành công!';
        $user['name'] = $name;
    }
}
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
    <div class="max-w-lg fade-up">

      <!-- Avatar card -->
      <div class="rounded-xl bg-white border border-slate-100 p-6 mb-4 flex items-center gap-4">
        <div class="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-600 text-2xl font-700 text-white">
          <?= mb_strtoupper(mb_substr($user['name'], 0, 1)) ?>
        </div>
        <div>
          <p class="font-600 text-slate-800 text-base"><?= htmlspecialchars($user['name']) ?></p>
          <p class="text-sm text-slate-500"><?= htmlspecialchars($user['email']) ?></p>
          <span class="mt-1 inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-500 text-emerald-700">Seller</span>
        </div>
      </div>

      <!-- Edit form -->
      <div class="rounded-xl bg-white border border-slate-100 p-6">
        <h2 class="text-sm font-600 text-slate-800 mb-5">Cập nhật thông tin</h2>

        <?php if ($msg): ?>
          <div class="mb-4 rounded-lg bg-emerald-50 border border-emerald-100 px-4 py-3 text-sm text-emerald-700">
            <?= htmlspecialchars($msg) ?>
          </div>
        <?php endif; ?>

        <form method="POST" class="space-y-4">
          <div>
            <label class="block text-xs font-500 text-slate-600 mb-1">Họ tên</label>
            <input type="text" name="name" value="<?= htmlspecialchars($user['name']) ?>"
              class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"/>
          </div>
          <div>
            <label class="block text-xs font-500 text-slate-600 mb-1">Email (không thể đổi)</label>
            <input type="email" value="<?= htmlspecialchars($user['email']) ?>" disabled
              class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-slate-50 text-slate-400 cursor-not-allowed"/>
          </div>
          <div>
            <label class="block text-xs font-500 text-slate-600 mb-1">Mật khẩu mới <span class="text-slate-400">(để trống nếu không đổi)</span></label>
            <input type="password" name="password" placeholder="••••••••"
              class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"/>
          </div>
          <button type="submit"
            class="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-600 text-white hover:bg-emerald-700 transition">
            Lưu thay đổi
          </button>
        </form>
      </div>

      <!-- Info -->
      <div class="mt-4 rounded-xl bg-white border border-slate-100 p-5">
        <p class="text-xs text-slate-400">Tài khoản tạo lúc: <?= date('d/m/Y H:i', strtotime($user['created_at'])) ?></p>
      </div>
    </div>
  </main>
</div>
</body>
</html>
