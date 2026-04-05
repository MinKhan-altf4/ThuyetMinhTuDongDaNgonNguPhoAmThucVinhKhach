<?php
require_once __DIR__ . '/check_login.php';
require_once __DIR__ . '/config.php';

$restaurant_id = $_SESSION['restaurant_id'];
$pageTitle = "Quản lý thực đơn";

// Thêm món ăn
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['add_dish'])) {
    $name = trim($_POST['name']);
    $description = trim($_POST['description']);
    $price = floatval($_POST['price']);
    $image_url = trim($_POST['image_url']);
    $is_active = isset($_POST['is_active']) ? 1 : 0;

    if (!empty($name) && $price > 0) {
        $stmt = $pdo->prepare("INSERT INTO dish (restaurant_id, name, description, price, image_url, is_active) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([$restaurant_id, $name, $description, $price, $image_url, $is_active]);
        header("Location: dishes.php");
        exit;
    }
}

// Sửa món ăn
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['update_dish'])) {
    $dish_id = intval($_POST['dish_id']);
    $name = trim($_POST['name']);
    $description = trim($_POST['description']);
    $price = floatval($_POST['price']);
    $image_url = trim($_POST['image_url']);
    $is_active = isset($_POST['is_active']) ? 1 : 0;

    if (!empty($name) && $price > 0) {
        $stmt = $pdo->prepare("UPDATE dish SET name=?, description=?, price=?, image_url=?, is_active=? WHERE dish_id=? AND restaurant_id=?");
        $stmt->execute([$name, $description, $price, $image_url, $is_active, $dish_id, $restaurant_id]);
        header("Location: dishes.php");
        exit;
    }
}

// Xóa món ăn
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['delete_dish'])) {
    $dish_id = intval($_POST['dish_id']);
    $stmt = $pdo->prepare("DELETE FROM dish WHERE dish_id=? AND restaurant_id=?");
    $stmt->execute([$dish_id, $restaurant_id]);
    header("Location: dishes.php");
    exit;
}

$stmt = $pdo->prepare("SELECT * FROM dish WHERE restaurant_id = ? ORDER BY dish_id DESC");
$stmt->execute([$restaurant_id]);
$dishes = $stmt->fetchAll();

include 'header.php';
// Xác định ngôn ngữ hiện tại (có thể từ session, mặc định là tiếng Việt)
$current_lang_id = $_SESSION['language_id'] ?? 1; // 1 = vi


?>

<div class="p-6">
    <div class="mb-8 flex justify-between items-center">
        <div>
            <h2 class="text-3xl font-bold text-slate-900">Quản lý Thực đơn</h2>
            <p class="text-slate-500 text-sm mt-1">Quản lý và cập nhật các món ăn của nhà hàng</p>
        </div>
        <button id="addDishBtn" class="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-xl font-semibold text-sm hover:shadow-lg hover:from-orange-600 hover:to-orange-700 transition-all flex items-center gap-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
            Thêm món mới
        </button>
    </div>

    <div class="bg-white rounded-2xl border border-slate-100 shadow-md overflow-hidden">
        <table class="w-full">
            <thead>
                <tr class="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
                    <th class="px-6 py-5 text-left text-[12px] font-bold text-slate-600 uppercase tracking-wider">Món ăn</th>
                    <th class="px-6 py-5 text-left text-[12px] font-bold text-slate-600 uppercase tracking-wider">Giá bán</th>
                    <th class="px-6 py-5 text-left text-[12px] font-bold text-slate-600 uppercase tracking-wider">Trạng thái</th>
                    <th class="px-6 py-5 text-center text-[12px] font-bold text-slate-600 uppercase tracking-wider">Thao tác</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
                <?php foreach($dishes as $d): ?>
                <tr class="hover:bg-slate-50/80 transition-colors duration-200">
                    <td class="px-6 py-5">
                        <div class="flex items-center gap-4">
                            <div class="relative">
                                <img src="<?= $d['image_url'] ?: 'default-food.png' ?>" class="w-14 h-14 rounded-xl object-cover bg-slate-100 border border-slate-200">
                            </div>
                            <div class="flex-1">
                                <p class="font-semibold text-slate-800 text-sm"><?= htmlspecialchars($d['name']) ?></p>
                                <p class="text-xs text-slate-500 truncate max-w-xs mt-1"><?= htmlspecialchars($d['description']) ?></p>
                            </div>
                        </div>
                    </td>
                    <td class="px-6 py-5">
                        <span class="font-bold text-orange-600 text-base"><?= number_format($d['price']) ?>đ</span>
                    </td>
                    <td class="px-6 py-5">
                        <span class="inline-flex px-3 py-1.5 rounded-full text-xs font-semibold <?= $d['is_active'] ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600' ?>">
                            <?= $d['is_active'] ? '✓ Đang bán' : '⊗ Ngừng bán' ?>
                        </span>
                    </td>
                    <td class="px-6 py-5">
                        <div class="flex items-center justify-center gap-2">
                            <button type="button" class="editBtn inline-flex items-center gap-1.5 px-4 py-2 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100 transition-colors font-medium text-sm" data-dish-id="<?= $d['dish_id'] ?>">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                                Sửa
                            </button>
                            <button type="button" class="deleteBtn inline-flex items-center gap-1.5 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium text-sm" data-dish-id="<?= $d['dish_id'] ?>">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                Xóa
                            </button>
                        </div>
                    </td>
                </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    </div>
</div>
            </tbody>
        </table>
    </div>
</div>

<!-- Modal thêm món ăn -->
<div id="addDishModal" class="fixed inset-0 bg-black bg-opacity-50 hidden z-50 flex items-center justify-center">
    <div class="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl">
        <div class="flex justify-between items-center mb-8">
            <h3 class="text-2xl font-bold text-slate-900">Thêm món ăn mới</h3>
            <button id="closeModal" class="text-slate-400 hover:text-slate-600 hover:bg-slate-100 w-8 h-8 rounded-lg flex items-center justify-center transition-all">&times;</button>
        </div>
        <form method="POST" action="">
            <div class="space-y-5">
                <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-2">Tên món ăn <span class="text-red-500">*</span></label>
                    <input type="text" name="name" required class="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all" placeholder="Nhập tên món ăn">
                </div>
                <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-2">Mô tả</label>
                    <textarea name="description" rows="3" class="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all resize-none" placeholder="Nhập mô tả món ăn"></textarea>
                </div>
                <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-2">Giá bán <span class="text-red-500">*</span></label>
                    <input type="number" name="price" min="0" step="1000" required class="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all" placeholder="Nhập giá">
                </div>
                <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-2">URL hình ảnh</label>
                    <input type="url" name="image_url" class="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all" placeholder="Nhập đường dẫn ảnh">
                </div>
                <div class="flex items-center p-3 bg-slate-50 rounded-lg">
                    <input type="checkbox" name="is_active" id="is_active" checked class="rounded">
                    <label for="is_active" class="ml-3 text-sm font-medium text-slate-700 cursor-pointer">Đang bán</label>
                </div>
            </div>
            <div class="flex gap-3 mt-8">
                <button type="button" id="cancelBtn" class="flex-1 px-4 py-2.5 border-2 border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-semibold transition-all">Hủy</button>
                <button type="submit" name="add_dish" class="flex-1 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:shadow-lg font-semibold transition-all">Thêm món</button>
            </div>
        </form>
    </div>
</div>

<!-- Modal sửa món ăn -->
<div id="editDishModal" class="fixed inset-0 bg-black bg-opacity-50 hidden z-50 flex items-center justify-center">
    <div class="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl">
        <div class="flex justify-between items-center mb-8">
            <h3 class="text-2xl font-bold text-slate-900">Chỉnh sửa món ăn</h3>
            <button id="closeEditModal" class="text-slate-400 hover:text-slate-600 hover:bg-slate-100 w-8 h-8 rounded-lg flex items-center justify-center transition-all">&times;</button>
        </div>
        <form method="POST" action="">
            <input type="hidden" name="dish_id" id="editDishId">
            <div class="space-y-5">
                <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-2">Tên món ăn <span class="text-red-500">*</span></label>
                    <input type="text" name="name" id="editName" required class="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all">
                </div>
                <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-2">Mô tả</label>
                    <textarea name="description" id="editDescription" rows="3" class="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all resize-none"></textarea>
                </div>
                <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-2">Giá bán <span class="text-red-500">*</span></label>
                    <input type="number" name="price" id="editPrice" min="0" step="1000" required class="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all">
                </div>
                <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-2">URL hình ảnh</label>
                    <input type="url" name="image_url" id="editImageUrl" class="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all">
                </div>
                <div class="flex items-center p-3 bg-slate-50 rounded-lg">
                    <input type="checkbox" name="is_active" id="editIsActive" class="rounded">
                    <label for="editIsActive" class="ml-3 text-sm font-medium text-slate-700 cursor-pointer">Đang bán</label>
                </div>
            </div>
            <div class="flex gap-3 mt-8">
                <button type="button" id="cancelEditBtn" class="flex-1 px-4 py-2.5 border-2 border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-semibold transition-all">Hủy</button>
                <button type="submit" name="update_dish" class="flex-1 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:shadow-lg font-semibold transition-all">Lưu thay đổi</button>
            </div>
        </form>
    </div>
</div>

<!-- Modal xác nhận xóa -->
<div id="deleteConfirmModal" class="fixed inset-0 bg-black bg-opacity-50 hidden z-50 flex items-center justify-center">
    <div class="bg-white rounded-2xl max-w-sm w-full p-8 shadow-2xl">
        <div class="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mx-auto mb-4">
            <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4v2m0 0v2M7 7h10a2 2 0 012 2v10a2 2 0 01-2 2H7a2 2 0 01-2-2V9a2 2 0 012-2z"></path></svg>
        </div>
        <h3 class="text-xl font-bold text-slate-900 text-center mb-3">Xác nhận xóa</h3>
        <p class="text-slate-600 text-center text-sm mb-8">Bạn có chắc chắn muốn xóa món ăn này? Hành động này không thể hoàn tác.</p>
        <form method="POST" action="">
            <input type="hidden" name="dish_id" id="deleteDishId">
            <div class="flex gap-3">
                <button type="button" id="cancelDeleteBtn" class="flex-1 px-4 py-2.5 border-2 border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-semibold transition-all">Hủy</button>
                <button type="submit" name="delete_dish" class="flex-1 px-4 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:shadow-lg font-semibold transition-all">Xóa</button>
            </div>
        </form>
    </div>
</div>

<script>
// Xử lý modal thêm món
document.getElementById('addDishBtn').addEventListener('click', function() {
    document.getElementById('addDishModal').classList.remove('hidden');
});

document.getElementById('closeModal').addEventListener('click', function() {
    document.getElementById('addDishModal').classList.add('hidden');
});

document.getElementById('cancelBtn').addEventListener('click', function() {
    document.getElementById('addDishModal').classList.add('hidden');
});

// Close modal when clicking outside
document.getElementById('addDishModal').addEventListener('click', function(e) {
    if (e.target === e.currentTarget) {
        this.classList.add('hidden');
    }
});

// Xử lý nút sửa - lấy dữ liệu từ server
document.querySelectorAll('.editBtn').forEach(btn => {
    btn.addEventListener('click', function() {
        const dishId = this.getAttribute('data-dish-id');
        
        // Tìm dòng dữ liệu trong bảng
        const row = this.closest('tr');
        const name = row.querySelector('p.font-semibold').textContent;
        const description = row.querySelector('p.text-slate-500').textContent;
        const priceText = row.querySelector('.text-orange-600').textContent;
        const price = priceText.replace(/[\.\đ]/g, '').trim();
        const imageUrl = row.querySelector('img').src;
        const isActive = row.querySelector('.bg-emerald-100') !== null;

        // Điền dữ liệu vào form sửa
        document.getElementById('editDishId').value = dishId;
        document.getElementById('editName').value = name;
        document.getElementById('editDescription').value = description;
        document.getElementById('editPrice').value = price;
        document.getElementById('editImageUrl').value = imageUrl === 'default-food.png' ? '' : imageUrl;
        document.getElementById('editIsActive').checked = isActive;

        // Hiển thị modal sửa
        document.getElementById('editDishModal').classList.remove('hidden');
    });
});

// Xử lý đóng modal sửa
document.getElementById('closeEditModal').addEventListener('click', function() {
    document.getElementById('editDishModal').classList.add('hidden');
});

document.getElementById('cancelEditBtn').addEventListener('click', function() {
    document.getElementById('editDishModal').classList.add('hidden');
});

document.getElementById('editDishModal').addEventListener('click', function(e) {
    if (e.target === e.currentTarget) {
        this.classList.add('hidden');
    }
});

// Xử lý nút xóa - hiển thị modal xác nhận
document.querySelectorAll('.deleteBtn').forEach(btn => {
    btn.addEventListener('click', function() {
        const dishId = this.getAttribute('data-dish-id');
        document.getElementById('deleteDishId').value = dishId;
        document.getElementById('deleteConfirmModal').classList.remove('hidden');
    });
});

// Xử lý đóng modal xác nhận xóa
document.getElementById('cancelDeleteBtn').addEventListener('click', function() {
    document.getElementById('deleteConfirmModal').classList.add('hidden');
});

document.getElementById('deleteConfirmModal').addEventListener('click', function(e) {
    if (e.target === e.currentTarget) {
        this.classList.add('hidden');
    }
});
</script>

<?php include 'footer.php'; ?>