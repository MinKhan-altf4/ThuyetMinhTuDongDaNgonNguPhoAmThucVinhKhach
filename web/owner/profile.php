<?php
// profile.php — Hồ sơ cá nhân (bảng users của food_app)
require_once __DIR__ . '/check_login.php';
require_once __DIR__ . '/config.php';

$user_id    = $_SESSION['user_id'];
$pageTitle  = 'Hồ sơ';

// Lấy thông tin user
$stmt = $pdo->prepare(
    "SELECT u.user_id, u.name, u.email, u.phone, u.created_at, u.restaurant_id,
            r.name AS restaurant_name, r.address, r.phone AS restaurant_phone,
            r.open_hour, r.close_hour, r.rating, r.description AS restaurant_desc
     FROM users u
     LEFT JOIN restaurant r ON u.restaurant_id = r.restaurant_id
     WHERE u.user_id = ?"
);
$stmt->execute([$user_id]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

$msg      = '';
$msg_type = 'ok'; // ok | error

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? 'profile';

    // Cập nhật hồ sơ cá nhân
    if ($action === 'profile') {
        $name     = trim($_POST['name'] ?? '');
        $phone    = trim($_POST['phone'] ?? '');
        $password = trim($_POST['password'] ?? '');
        $confirm  = trim($_POST['password_confirm'] ?? '');

        if (!$name) {
            $msg = 'Họ tên không được để trống.';
            $msg_type = 'error';
        } elseif ($password && $password !== $confirm) {
            $msg = 'Mật khẩu xác nhận không khớp.';
            $msg_type = 'error';
        } else {
            if ($password) {
                $hash = password_hash($password, PASSWORD_BCRYPT);
                $pdo->prepare("UPDATE users SET name=?, phone=?, password_hash=? WHERE user_id=?")
                    ->execute([$name, $phone, $hash, $user_id]);
            } else {
                $pdo->prepare("UPDATE users SET name=?, phone=? WHERE user_id=?")
                    ->execute([$name, $phone, $user_id]);
            }
            $_SESSION['user_name'] = $name;
            $user['name']  = $name;
            $user['phone'] = $phone;
            $msg = 'Cập nhật hồ sơ thành công!';
        }
    }

    // Cập nhật thông tin nhà hàng
    if ($action === 'restaurant' && $user['restaurant_id']) {
        $r_name  = trim($_POST['r_name'] ?? '');
        $r_desc  = trim($_POST['r_desc'] ?? '');
        $r_phone = trim($_POST['r_phone'] ?? '');
        $r_addr  = trim($_POST['r_address'] ?? '');
        $r_open  = trim($_POST['r_open'] ?? '');
        $r_close = trim($_POST['r_close'] ?? '');

        if (!$r_name) {
            $msg = 'Tên nhà hàng không được để trống.';
            $msg_type = 'error';
        } else {
            $pdo->prepare(
                "UPDATE restaurant SET name=?, description=?, phone=?, address=?, open_hour=?, close_hour=?
                 WHERE restaurant_id=?"
            )->execute([$r_name, $r_desc, $r_phone, $r_addr, $r_open, $r_close, $user['restaurant_id']]);

            $_SESSION['restaurant_name'] = $r_name;
            $user['restaurant_name']     = $r_name;
            $user['restaurant_desc']     = $r_desc;
            $user['restaurant_phone']    = $r_phone;
            $user['address']             = $r_addr;
            $user['open_hour']           = $r_open;
            $user['close_hour']          = $r_close;
            $msg = 'Đã cập nhật thông tin nhà hàng!';
        }
    }
}

include 'header.php'; // header gộp (sidebar + topbar)
?>

<div class="p-6 bg-slate-50/50 min-h-screen">
    <div class="max-w-2xl mx-auto space-y-5 fade-up">
        <!-- Avatar card -->
        <div class="rounded-2xl bg-white border border-slate-100 shadow-sm p-6 flex items-center gap-5">
            <div class="flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-500 text-2xl font-bold text-white flex-shrink-0">
                <?= mb_strtoupper(mb_substr($user['name'], 0, 1)) ?>
            </div>
            <div>
                <p class="font-semibold text-slate-800 text-lg"><?= htmlspecialchars($user['name']) ?></p>
                <p class="text-sm text-slate-500"><?= htmlspecialchars($user['email']) ?></p>
                <div class="flex items-center gap-2 mt-1.5">
                    <span class="inline-flex items-center rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-600">
                        🏪 <?= htmlspecialchars($user['restaurant_name'] ?? 'Chưa có nhà hàng') ?>
                    </span>
                    <?php if ($user['rating']): ?>
                        <span class="text-xs text-amber-500 font-semibold">⭐ <?= number_format($user['rating'], 1) ?></span>
                    <?php endif; ?>
                </div>
            </div>
        </div>

        <!-- Thông báo Pop-up -->
        <?php if ($msg): ?>
            <div id="notification" class="fixed top-6 right-6 z-50 animate-slide-in">
                <div class="rounded-xl px-5 py-4 text-sm font-medium shadow-lg border backdrop-blur-sm flex items-center gap-3 max-w-sm
                    <?= $msg_type === 'ok'
                        ? 'bg-emerald-50/95 border-emerald-200 text-emerald-700'
                        : 'bg-red-50/95 border-red-200 text-red-700' ?>">
                    <div class="flex-shrink-0">
                        <?= $msg_type === 'ok'
                            ? '<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>'
                            : '<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/></svg>'
                        ?>
                    </div>
                    <span><?= htmlspecialchars($msg) ?></span>
                    <button onclick="document.getElementById('notification').remove()" class="ml-2 opacity-70 hover:opacity-100 transition">
                        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/></svg>
                    </button>
                </div>
            </div>
            <style>
                @keyframes slideIn {
                    from {
                        transform: translateX(400px);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                @keyframes slideOut {
                    from {
                        transform: translateX(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(400px);
                        opacity: 0;
                    }
                }
                .animate-slide-in {
                    animation: slideIn 0.3s ease-out;
                }
                .animate-slide-out {
                    animation: slideOut 0.3s ease-in forwards;
                }
            </style>
            <script>
                document.addEventListener('DOMContentLoaded', function() {
                    const notification = document.getElementById('notification');
                    if (notification) {
                        setTimeout(function() {
                            notification.classList.remove('animate-slide-in');
                            notification.classList.add('animate-slide-out');
                            setTimeout(function() {
                                notification.remove();
                            }, 300);
                        }, 3500);
                    }
                });
            </script>
        <?php endif; ?>

        <!-- Form hồ sơ cá nhân -->
        <div class="rounded-2xl bg-white border border-slate-100 shadow-sm p-6">
            <h2 class="text-sm font-semibold text-slate-800 mb-5">👤 Thông tin cá nhân</h2>
            <form method="POST" class="space-y-4">
                <input type="hidden" name="action" value="profile"/>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-xs font-medium text-slate-600 mb-1">Họ tên *</label>
                        <input type="text" name="name" value="<?= htmlspecialchars($user['name']) ?>"
                            class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"/>
                    </div>
                    <div>
                        <label class="block text-xs font-medium text-slate-600 mb-1">Số điện thoại</label>
                        <input type="tel" name="phone" value="<?= htmlspecialchars($user['phone'] ?? '') ?>"
                            class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"/>
                    </div>
                </div>
                <div>
                    <label class="block text-xs font-medium text-slate-600 mb-1">Email (không thể thay đổi)</label>
                    <input type="email" value="<?= htmlspecialchars($user['email']) ?>" disabled
                        class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-slate-50 text-slate-400 cursor-not-allowed"/>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-xs font-medium text-slate-600 mb-1">Mật khẩu mới
                            <span class="text-slate-400">(để trống nếu không đổi)</span>
                        </label>
                        <input type="password" name="password" placeholder="••••••••"
                            class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"/>
                    </div>
                    <div>
                        <label class="block text-xs font-medium text-slate-600 mb-1">Xác nhận mật khẩu mới</label>
                        <input type="password" name="password_confirm" placeholder="••••••••"
                            class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"/>
                    </div>
                </div>
                <button type="submit"
                    class="w-full rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 transition">
                    Lưu thông tin cá nhân
                </button>
            </form>
        </div>

        <!-- Form thông tin nhà hàng -->
        <?php if ($user['restaurant_id']): ?>
        <div class="rounded-2xl bg-white border border-slate-100 shadow-sm p-6">
            <h2 class="text-sm font-semibold text-slate-800 mb-5">🏪 Thông tin nhà hàng</h2>
            <form method="POST" class="space-y-4">
                <input type="hidden" name="action" value="restaurant"/>
                <div>
                    <label class="block text-xs font-medium text-slate-600 mb-1">Tên nhà hàng *</label>
                    <input type="text" name="r_name" value="<?= htmlspecialchars($user['restaurant_name'] ?? '') ?>"
                        class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"/>
                </div>
                <div>
                    <label class="block text-xs font-medium text-slate-600 mb-1">Mô tả</label>
                    <textarea name="r_desc" rows="2"
                        class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
                        ><?= htmlspecialchars($user['restaurant_desc'] ?? '') ?></textarea>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-xs font-medium text-slate-600 mb-1">Số điện thoại nhà hàng</label>
                        <input type="tel" name="r_phone" value="<?= htmlspecialchars($user['restaurant_phone'] ?? '') ?>"
                            class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"/>
                    </div>
                    <div>
                        <label class="block text-xs font-medium text-slate-600 mb-1">Địa chỉ</label>
                        <input type="text" name="r_address" value="<?= htmlspecialchars($user['address'] ?? '') ?>"
                            class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"/>
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-xs font-medium text-slate-600 mb-1">Giờ mở cửa</label>
                        <input type="time" name="r_open" value="<?= htmlspecialchars($user['open_hour'] ?? '') ?>"
                            class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"/>
                    </div>
                    <div>
                        <label class="block text-xs font-medium text-slate-600 mb-1">Giờ đóng cửa</label>
                        <input type="time" name="r_close" value="<?= htmlspecialchars($user['close_hour'] ?? '') ?>"
                            class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"/>
                    </div>
                </div>
                <button type="submit"
                    class="w-full rounded-lg bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-900 transition">
                    Lưu thông tin nhà hàng
                </button>
            </form>
        </div>
        <?php endif; ?>

        <!-- Metadata -->
        <div class="rounded-2xl bg-white border border-slate-100 shadow-sm p-4">
            <p class="text-xs text-slate-400">
                Tài khoản tạo lúc: <strong><?= date('d/m/Y H:i', strtotime($user['created_at'])) ?></strong>
                &nbsp;·&nbsp; User ID: <strong>#<?= $user['user_id'] ?></strong>
            </p>
        </div>
    </div>
</div>

<?php include 'footer.php'; ?>