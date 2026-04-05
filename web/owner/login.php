<?php
// seller/login.php
session_start();

if (!empty($_SESSION['seller_id'])) {
    header('Location: /seller/pages/dashboard.php');
    exit;
}

require_once __DIR__ . '/config.php';

$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email    = trim($_POST['email'] ?? '');
    $password = trim($_POST['password'] ?? '');

    if (!$email || !$password) {
        $error = 'Vui lòng nhập đầy đủ email và mật khẩu.';
    } else {
        $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ? AND role = 'seller' LIMIT 1");
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        if ($user && password_verify($password, $user['password'])) {
            $_SESSION['seller_id']   = $user['id'];
            $_SESSION['seller_name'] = $user['name'];
            $_SESSION['seller_role'] = $user['role'];
            header('Location: /seller/pages/dashboard.php');
            exit;
        } else {
            $error = 'Email hoặc mật khẩu không đúng, hoặc tài khoản không có quyền seller.';
        }
    }
}
?>
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Đăng nhập — Seller Dashboard</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@300;400;500;600;700&display=swap" rel="stylesheet"/>
  <style>
    * { font-family: 'Be Vietnam Pro', sans-serif; }
    .card-shadow { box-shadow: 0 8px 40px rgba(0,0,0,0.08); }
    @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
    .fade-up { animation: fadeUp 0.4s ease both; }
  </style>
</head>
<body class="min-h-screen bg-slate-50 flex items-center justify-center p-4">

  <div class="w-full max-w-md fade-up">
    <!-- Logo -->
    <div class="text-center mb-8">
      <div class="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 mb-4">
        <svg class="h-7 w-7 text-white" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      </div>
      <h1 class="text-2xl font-700 text-slate-800">Seller Dashboard</h1>
      <p class="text-sm text-slate-500 mt-1">Đăng nhập vào trang quản lý gian hàng</p>
    </div>

    <!-- Form card -->
    <div class="bg-white rounded-2xl p-8 card-shadow">
      <?php if ($error): ?>
        <div class="mb-5 rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600 flex items-center gap-2">
          <svg class="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <?= htmlspecialchars($error) ?>
        </div>
      <?php endif; ?>

      <form method="POST" action="" novalidate>
        <div class="space-y-5">
          <div>
            <label class="block text-sm font-500 text-slate-700 mb-1.5">Email</label>
            <input
              type="email" name="email"
              value="<?= htmlspecialchars($_POST['email'] ?? '') ?>"
              placeholder="seller@demo.com"
              class="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
            />
          </div>
          <div>
            <label class="block text-sm font-500 text-slate-700 mb-1.5">Mật khẩu</label>
            <input
              type="password" name="password"
              placeholder="••••••••"
              class="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
            />
          </div>
          <button
            type="submit"
            class="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-600 text-white hover:bg-emerald-700 active:scale-[0.98] transition-all"
          >
            Đăng nhập
          </button>
        </div>
      </form>
    </div>

    <p class="text-center text-xs text-slate-400 mt-6">
      Demo: seller@demo.com / password
    </p>
  </div>

</body>
</html>
