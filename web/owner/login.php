<?php
// login.php
session_start();

if (!empty($_SESSION['user_id'])) {
    header('Location: dashboard.php');
    exit;
}

require_once __DIR__ . '/config.php';
// config.php phải tạo biến $pdo (PDO) kết nối tới DB food_app
// Ví dụ:
// $pdo = new PDO('mysql:host=127.0.0.1;dbname=food_app;charset=utf8mb4', 'root', '');

$error = '';

// Kiểm tra nếu bị kick ra vì account deleted
if (!empty($_GET['expired'])) {
    $error = '❌ Tài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên.';
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email    = trim($_POST['email'] ?? '');
    $password = trim($_POST['password'] ?? '');

    if (!$email || !$password) {
        $error = 'Vui lòng nhập đầy đủ email và mật khẩu.';
    } else {
        // Bảng users có cột: user_id, name, email, phone, restaurant_id, password_hash
        $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ? LIMIT 1");
        $stmt->execute([$email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($user && password_verify($password, $user['password_hash'])) {
            // Kiểm tra xem user có nằm trong users_deleted không
            $stmt_check = $pdo->prepare("SELECT deleted_id FROM users_deleted WHERE user_id = ? LIMIT 1");
            $stmt_check->execute([$user['user_id']]);
            $isDeleted = $stmt_check->fetch(PDO::FETCH_ASSOC);
            
            if ($isDeleted) {
                $error = '❌ Tài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên.';
            } else {
                $_SESSION['user_id']       = $user['user_id'];
                $_SESSION['user_name']     = $user['name'];
                $_SESSION['user_email']    = $user['email'];
                $_SESSION['restaurant_id'] = $user['restaurant_id'];
                header('Location: dashboard.php');
                exit;
            }
        } else {
            $error = 'Email hoặc mật khẩu không đúng.';
        }
    }
}
?>
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Đăng nhập — Food App</title>
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
    <div class="text-center mb-8">
      <div class="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500 mb-4">
        <!-- Icon nhà hàng -->
        <svg class="h-7 w-7 text-white" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      </div>
      <h1 class="text-2xl font-semibold text-slate-800">Food App — Quản lý nhà hàng</h1>
      <p class="text-sm text-slate-500 mt-1">Đăng nhập để quản lý gian hàng của bạn</p>
    </div>

    <div class="bg-white rounded-2xl p-8 card-shadow">
      <?php if ($error): ?>
        <div class="mb-5 rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600 flex items-center gap-2">
          <svg class="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <?= htmlspecialchars($error) ?>
        </div>
      <?php endif; ?>

      <form method="POST" action="" novalidate>
        <div class="space-y-5">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
            <input
              type="email" name="email"
              value="<?= htmlspecialchars($_POST['email'] ?? '') ?>"
              placeholder="owner1@food.vn"
              class="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">Mật khẩu</label>
            <input
              type="password" name="password"
              placeholder="••••••••"
              class="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition"
            />
          </div>
          <button
            type="submit"
            class="w-full rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 active:scale-[0.98] transition-all"
          >
            Đăng nhập
          </button>
        </div>
      </form>
    </div>

    <p class="text-center text-xs text-slate-400 mt-6">
      Demo: owner1@food.vn / password
    </p>
  </div>

</body>
</html>
