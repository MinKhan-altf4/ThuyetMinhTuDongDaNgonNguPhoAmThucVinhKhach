<?php
session_start();
require_once __DIR__ . '/config.php';

if (!isset($_SESSION['user_id'])) {
    header("Location: login.php");
    exit();
}

$pageTitle = "Danh sách nhà hàng";

// Lấy danh sách tất cả các nhà hàng
$stmt = $pdo->prepare("SELECT * FROM restaurant ORDER BY restaurant_id DESC");
$stmt->execute();
$restaurants = $stmt->fetchAll(PDO::FETCH_ASSOC);

include 'header.php';
?>

<div class="p-6 bg-slate-50 min-h-screen">
    <!-- Header Section -->
    <div class="mb-8">
        <div class="flex items-center justify-between mb-6">
            <div>
                <h1 class="text-4xl font-bold text-slate-900">Danh sách nhà hàng</h1>
                <p class="text-slate-500 mt-1">Tổng cộng có <span id="totalCount"><?= count($restaurants) ?></span> nhà hàng trên hệ thống Food App</p>
            </div>
        </div>
    </div>

    <!-- Search & Filter Bar -->
    <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-8">
        <div class="flex gap-4 flex-wrap items-center">
            <input type="text" id="searchInput" placeholder="🔍 Tìm kiếm theo tên hoặc địa chỉ..." 
                class="flex-1 min-w-64 px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all text-sm">
            <select id="ratingFilter" class="px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all text-sm">
                <option value="">⭐ Tất cả đánh giá</option>
                <option value="5">⭐ 5.0 sao</option>
                <option value="4.5">⭐ 4.5+ sao</option>
                <option value="4">⭐ 4.0+ sao</option>
                <option value="3.5">⭐ 3.5+ sao</option>
                <option value="3">⭐ 3.0+ sao</option>
            </select>
            <button id="clearFilters" class="px-6 py-2.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium text-sm">
                ✕ Xóa lọc
            </button>
        </div>
    </div>

    <!-- Grid View -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="restaurantsGrid">
        <?php foreach ($restaurants as $r): ?>
        <div class="restaurant-card bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden" 
            data-name="<?= strtolower($r['name']) ?>"
            data-address="<?= strtolower($r['address'] ?? '') ?>"
            data-rating="<?= $r['rating'] ?? 0 ?>">
            <!-- Header Card -->
            <div class="bg-gradient-to-r from-orange-400 to-orange-600 h-24"></div>
            
            <!-- Content -->
            <div class="p-6 relative">
                <!-- Avatar -->
                <div class="flex items-start justify-between mb-4">
                    <div class="w-16 h-16 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-3xl font-bold text-white shadow-lg -mt-12 relative z-10">
                        🏪
                    </div>
                    <?php if ($r['rating'] > 0): ?>
                    <div class="text-right">
                        <div class="text-lg font-bold text-amber-500"><?= number_format($r['rating'], 1) ?></div>
                        <div class="text-xs text-amber-500">⭐</div>
                    </div>
                    <?php endif; ?>
                </div>

                <!-- Info -->
                <h3 class="text-xl font-bold text-slate-900 mb-2"><?= htmlspecialchars($r['name']) ?></h3>
                
                <p class="text-sm text-slate-600 mb-4 line-clamp-2"><?= htmlspecialchars($r['description'] ?? 'Không có mô tả') ?></p>

                <!-- Details Grid -->
                <div class="space-y-3 mb-6">
                    <div class="flex items-center gap-3 text-sm text-slate-600">
                        <span class="text-lg">📍</span>
                        <span class="line-clamp-1"><?= htmlspecialchars($r['address'] ?? 'Chưa cập nhật') ?></span>
                    </div>
                    
                    <div class="flex items-center gap-3 text-sm text-slate-600">
                        <span class="text-lg">📞</span>
                        <span><?= htmlspecialchars($r['phone'] ?? 'Chưa cập nhật') ?></span>
                    </div>

                    <div class="flex items-center gap-3 text-sm text-slate-600">
                        <span class="text-lg">🕐</span>
                        <span><?= htmlspecialchars($r['open_hour'] ?? '--:--') ?> - <?= htmlspecialchars($r['close_hour'] ?? '--:--') ?></span>
                    </div>
                </div>

                <!-- Divider -->
                <div class="border-t border-slate-100 mb-4"></div>

                <!-- Action Button -->
                <div>
                    <button onclick="viewRestaurant(<?= $r['restaurant_id'] ?>)" 
                        class="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:shadow-md hover:from-blue-600 hover:to-blue-700 transition-all font-semibold text-sm">
                        👁️ Xem chi tiết
                    </button>
                </div>
            </div>
        </div>
        <?php endforeach; ?>
    </div>

    <!-- Empty State -->
    <?php if (empty($restaurants)): ?>
    <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
        <div class="text-6xl mb-4">🏪</div>
        <h3 class="text-2xl font-bold text-slate-800 mb-2">Chưa có nhà hàng</h3>
        <p class="text-slate-500 mb-6">Không có dữ liệu nhà hàng để hiển thị</p>
    </div>
    <?php endif; ?>
</div>

<!-- Modal View Restaurant -->
<div id="viewModal" class="hidden fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
    <div class="bg-white rounded-2xl max-w-2xl w-full p-8 max-h-96 overflow-y-auto">
        <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-bold text-slate-900">Chi tiết nhà hàng</h2>
            <button onclick="closeViewModal()" class="text-slate-400 hover:text-slate-600 text-2xl">&times;</button>
        </div>
        <div id="viewContent"></div>
        <div class="mt-6 flex gap-3">
            <button onclick="closeViewModal()" class="w-full px-4 py-3 border-2 border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-semibold transition-all">
                Đóng
            </button>
        </div>
    </div>
</div>

<script>
let currentRestaurantId = null;
const restaurants = <?= json_encode($restaurants) ?>;

function viewRestaurant(id) {
    currentRestaurantId = id;
    const r = restaurants.find(x => x.restaurant_id == id);
    if (!r) return;
    
    const html = `
        <div class="space-y-4">
            <div>
                <label class="text-sm font-semibold text-slate-500">Tên nhà hàng</label>
                <p class="text-lg text-slate-900 font-semibold">${r.name}</p>
            </div>
            <div>
                <label class="text-sm font-semibold text-slate-500">Mô tả</label>
                <p class="text-slate-700">${r.description || 'Không có mô tả'}</p>
            </div>
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="text-sm font-semibold text-slate-500">Địa chỉ</label>
                    <p class="text-slate-700">${r.address || 'Chưa cập nhật'}</p>
                </div>
                <div>
                    <label class="text-sm font-semibold text-slate-500">Điện thoại</label>
                    <p class="text-slate-700">${r.phone || 'Chưa cập nhật'}</p>
                </div>
            </div>
            <div class="grid grid-cols-3 gap-4">
                <div>
                    <label class="text-sm font-semibold text-slate-500">Giờ mở cửa</label>
                    <p class="text-slate-700">${r.open_hour || '--:--'}</p>
                </div>
                <div>
                    <label class="text-sm font-semibold text-slate-500">Giờ đóng cửa</label>
                    <p class="text-slate-700">${r.close_hour || '--:--'}</p>
                </div>
                <div>
                    <label class="text-sm font-semibold text-slate-500">Đánh giá</label>
                    <p class="text-slate-700 font-semibold">⭐ ${Number(r.rating).toFixed(1)}</p>
                </div>
            </div>
            <div>
                <label class="text-sm font-semibold text-slate-500">Vị trí GPS</label>
                <p class="text-slate-700">Lat: ${r.lat || 'N/A'}, Lng: ${r.lng || 'N/A'}</p>
            </div>
        </div>
    `;
    
    document.getElementById('viewContent').innerHTML = html;
    document.getElementById('viewModal').classList.remove('hidden');
}

function closeViewModal() {
    document.getElementById('viewModal').classList.add('hidden');
    currentRestaurantId = null;
}

// Search & Filter functionality
document.getElementById('searchInput').addEventListener('input', applyFilters);
document.getElementById('ratingFilter').addEventListener('change', applyFilters);

// Clear filters button
document.getElementById('clearFilters').addEventListener('click', function() {
    document.getElementById('searchInput').value = '';
    document.getElementById('ratingFilter').value = '';
    applyFilters();
});

function applyFilters() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const minRating = parseFloat(document.getElementById('ratingFilter').value) || 0;
    const cards = document.querySelectorAll('.restaurant-card');
    let visibleCount = 0;
    
    cards.forEach(card => {
        const name = card.getAttribute('data-name');
        const address = card.getAttribute('data-address');
        const rating = parseFloat(card.getAttribute('data-rating')) || 0;
        
        // Check search match
        const searchMatch = searchTerm === '' || name.includes(searchTerm) || address.includes(searchTerm);
        
        // Check rating match
        const ratingMatch = rating >= minRating;
        
        // Show card if both conditions are met
        const isVisible = searchMatch && ratingMatch;
        card.style.display = isVisible ? '' : 'none';
        
        if (isVisible) visibleCount++;
    });
    
    // Update total count
    document.getElementById('totalCount').textContent = visibleCount;
}

// Close modal on outside click
document.getElementById('viewModal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeViewModal();
    }
});
</script>

<?php include 'footer.php'; ?>
