<?php
session_start();
require_once __DIR__ . '/config.php';

if (!isset($_SESSION['user_id'])) {
    header("Location: login.php");
    exit();
}

$restaurant_id = $_SESSION['restaurant_id'];
$pageTitle     = "Lượt xem & nghe audio (App)";

// ── Export CSV ────────────────────────────────────────────────────
if (isset($_GET['export'])) {
    $stmtExp = $pdo->prepare("
        SELECT customer_id, visit_count, audio_listen_count,
               created_at, last_visited
        FROM customer_visited
        WHERE restaurant_id = ?
        ORDER BY last_visited DESC
    ");
    $stmtExp->execute([$restaurant_id]);
    $rows = $stmtExp->fetchAll(PDO::FETCH_ASSOC);

    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="offline_visits_' . date('Ymd_His') . '.csv"');
    $out = fopen('php://output', 'w');
    fprintf($out, chr(0xEF) . chr(0xBB) . chr(0xBF));
    fputcsv($out, ['Mã khách', 'Lượt xem', 'Lượt nghe audio', 'Lần đầu', 'Lần cuối']);
    foreach ($rows as $r) {
        fputcsv($out, [
            $r['customer_id'], $r['visit_count'], $r['audio_listen_count'],
            date('H:i d/m/Y', strtotime($r['created_at'])),
            date('H:i d/m/Y', strtotime($r['last_visited'])),
        ]);
    }
    fclose($out);
    exit();
}

// ── Delete record ─────────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['delete_id'])) {
    try {
        $stmtDel = $pdo->prepare("DELETE FROM customer_visited WHERE visit_id = ? AND restaurant_id = ?");
        $stmtDel->execute([$_POST['delete_id'], $restaurant_id]);
        $successMsg = "Đã xóa bản ghi.";
    } catch (Exception $e) {
        $errorMsg = "Lỗi xóa: " . $e->getMessage();
    }
}

// ── Filters ───────────────────────────────────────────────────────
$filter_date_from  = $_GET['date_from']  ?? '';
$filter_date_to    = $_GET['date_to']    ?? '';
$filter_min_views  = $_GET['min_views']  ?? '';
$filter_min_audio  = $_GET['min_audio']  ?? '';
$sort              = in_array($_GET['sort'] ?? '', ['visit_count', 'audio_listen_count', 'last_visited', 'created_at'])
                     ? $_GET['sort'] : 'last_visited';
$order             = ($_GET['order'] ?? 'desc') === 'asc' ? 'ASC' : 'DESC';

// ── Build WHERE ───────────────────────────────────────────────────
$where  = ['restaurant_id = ?'];
$params = [$restaurant_id];

if ($filter_date_from !== '') {
    $where[]  = 'DATE(last_visited) >= ?';
    $params[] = $filter_date_from;
}
if ($filter_date_to !== '') {
    $where[]  = 'DATE(last_visited) <= ?';
    $params[] = $filter_date_to;
}
if ($filter_min_views !== '' && is_numeric($filter_min_views)) {
    $where[]  = 'visit_count >= ?';
    $params[] = (int)$filter_min_views;
}
if ($filter_min_audio !== '' && is_numeric($filter_min_audio)) {
    $where[]  = 'audio_listen_count >= ?';
    $params[] = (int)$filter_min_audio;
}

$whereSQL = implode(' AND ', $where);

try {
    // ── Thống kê tổng hợp ────────────────────────────────────────
    $stmtSum = $pdo->prepare("
        SELECT
            COUNT(DISTINCT customer_id)          AS unique_customers,
            COALESCE(SUM(visit_count), 0)         AS total_views,
            COALESCE(SUM(audio_listen_count), 0)  AS total_listens,
            COALESCE(AVG(visit_count), 0)         AS avg_views,
            COALESCE(AVG(audio_listen_count), 0)  AS avg_listens,
            MAX(last_visited)                     AS last_activity
        FROM customer_visited
        WHERE restaurant_id = ?
    ");
    $stmtSum->execute([$restaurant_id]);
    $summary = $stmtSum->fetch(PDO::FETCH_ASSOC);

    // Engagement rate
    $totalViews   = (int)($summary['total_views']   ?? 0);
    $totalListens = (int)($summary['total_listens'] ?? 0);
    $engagementRate = $totalViews > 0 ? round($totalListens / $totalViews * 100, 1) : 0;

    // ── Top 5 khách nghe nhiều nhất ───────────────────────────────
    $stmtTop = $pdo->prepare("
        SELECT customer_id, visit_count, audio_listen_count, last_visited
        FROM customer_visited
        WHERE restaurant_id = ?
        ORDER BY audio_listen_count DESC
        LIMIT 5
    ");
    $stmtTop->execute([$restaurant_id]);
    $topCustomers = $stmtTop->fetchAll(PDO::FETCH_ASSOC);

    // ── Danh sách (có filter + sort) ─────────────────────────────
    $stmtList = $pdo->prepare("
        SELECT visit_id, customer_id, visit_count, audio_listen_count,
               created_at, last_visited
        FROM customer_visited
        WHERE $whereSQL
        ORDER BY $sort $order
        LIMIT 200
    ");
    $stmtList->execute($params);
    $records = $stmtList->fetchAll(PDO::FETCH_ASSOC);

} catch (Exception $e) {
    $error = "Lỗi database: " . $e->getMessage();
}

// ── Sort link helper ──────────────────────────────────────────────
function sortUrl(string $col, string $currentSort, string $currentOrder): string {
    $newOrder = ($currentSort === $col && $currentOrder === 'DESC') ? 'asc' : 'desc';
    $params   = array_merge($_GET, ['sort' => $col, 'order' => $newOrder]);
    return '?' . http_build_query($params);
}
function sortIcon(string $col, string $currentSort, string $currentOrder): string {
    if ($currentSort !== $col) return '<span class="text-slate-300 ml-1">↕</span>';
    return $currentOrder === 'DESC'
        ? '<span class="text-blue-500 ml-1">↓</span>'
        : '<span class="text-blue-500 ml-1">↑</span>';
}

include 'header.php';
?>

<div class="p-6 bg-slate-50/50 min-h-screen">

    <!-- ── Tiêu đề ──────────────────────────────────────────────── -->
    <div class="mb-6">
        <h2 class="text-2xl font-bold text-slate-800">Lượt xem & nghe audio</h2>
        <p class="text-sm text-slate-500">
            Dữ liệu từ app MAUI — mỗi dòng là 1 khách (<code class="bg-slate-100 px-1 rounded">customer_id</code> duy nhất)
        </p>
    </div>

    <?php if (!empty($error)): ?>
        <div class="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700"><?= $error ?></div>
    <?php endif; ?>
    <?php if (!empty($successMsg)): ?>
        <div class="mb-4 rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700"><?= $successMsg ?></div>
    <?php endif; ?>
    <?php if (!empty($errorMsg)): ?>
        <div class="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700"><?= $errorMsg ?></div>
    <?php endif; ?>

    <!-- ── Thẻ thống kê ─────────────────────────────────────────── -->
    <div class="grid grid-cols-2 gap-4 mb-6 sm:grid-cols-3 lg:grid-cols-5">
        <?php
        $lastActivity = !empty($summary['last_activity'])
            ? date('d/m/Y', strtotime($summary['last_activity'])) : '—';
        $cards = [
            ['label' => 'Khách độc nhất',    'value' => number_format($summary['unique_customers'] ?? 0), 'icon' => '👤', 'sub' => 'customer_id riêng biệt'],
            ['label' => 'Tổng lượt xem POI', 'value' => number_format($summary['total_views'] ?? 0),      'icon' => '👁️', 'sub' => 'Trung bình: ' . round($summary['avg_views'] ?? 0, 1) . '/khách'],
            ['label' => 'Tổng lượt nghe',    'value' => number_format($summary['total_listens'] ?? 0),    'icon' => '🎧', 'sub' => 'Trung bình: ' . round($summary['avg_listens'] ?? 0, 1) . '/khách'],
            ['label' => 'Engagement rate',   'value' => $engagementRate . '%',                             'icon' => '📊', 'sub' => 'Nghe / Xem'],
            ['label' => 'Hoạt động cuối',    'value' => $lastActivity,                                     'icon' => '🕐', 'sub' => 'Lần cuối có khách'],
        ];
        foreach ($cards as $c): ?>
        <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <div class="text-2xl mb-1"><?= $c['icon'] ?></div>
            <div class="text-2xl font-bold text-slate-800"><?= $c['value'] ?></div>
            <div class="text-xs font-semibold text-slate-600 mt-0.5"><?= $c['label'] ?></div>
            <div class="text-[10px] text-slate-400 mt-0.5"><?= $c['sub'] ?></div>
        </div>
        <?php endforeach; ?>
    </div>

    <!-- ── Top 5 khách ──────────────────────────────────────────── -->
    <?php if (!empty($topCustomers)): ?>
    <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mb-6">
        <h3 class="text-sm font-bold text-slate-700 mb-4">🏆 Top 5 khách nghe nhiều nhất</h3>
        <div class="space-y-2">
            <?php foreach ($topCustomers as $i => $tc):
                $maxListen = (int)($topCustomers[0]['audio_listen_count'] ?? 1) ?: 1;
                $pct = round((int)$tc['audio_listen_count'] / $maxListen * 100);
                $medals = ['🥇','🥈','🥉','4️⃣','5️⃣'];
            ?>
            <div class="flex items-center gap-3">
                <span class="text-lg w-6"><?= $medals[$i] ?></span>
                <div class="flex-1">
                    <div class="flex justify-between text-xs mb-1">
                        <span class="font-semibold text-slate-700">Khách #<?= $tc['customer_id'] ?></span>
                        <span class="text-slate-500">🎧 <?= $tc['audio_listen_count'] ?> · 👁️ <?= $tc['visit_count'] ?></span>
                    </div>
                    <div class="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div class="h-full bg-blue-400 rounded-full transition-all" style="width:<?= $pct ?>%"></div>
                    </div>
                </div>
            </div>
            <?php endforeach; ?>
        </div>
    </div>
    <?php endif; ?>

    <!-- ── Filter ───────────────────────────────────────────────── -->
    <form method="GET" class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mb-6">
        <h3 class="text-sm font-bold text-slate-700 mb-4">🔍 Lọc dữ liệu</h3>
        <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
                <label class="block text-xs font-semibold text-slate-500 mb-1">Lần cuối từ ngày</label>
                <input type="date" name="date_from" value="<?= htmlspecialchars($filter_date_from) ?>"
                    class="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200">
            </div>
            <div>
                <label class="block text-xs font-semibold text-slate-500 mb-1">Đến ngày</label>
                <input type="date" name="date_to" value="<?= htmlspecialchars($filter_date_to) ?>"
                    class="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200">
            </div>
            <div>
                <label class="block text-xs font-semibold text-slate-500 mb-1">Lượt xem tối thiểu</label>
                <input type="number" name="min_views" min="0" value="<?= htmlspecialchars($filter_min_views) ?>"
                    placeholder="0"
                    class="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200">
            </div>
            <div>
                <label class="block text-xs font-semibold text-slate-500 mb-1">Lượt nghe tối thiểu</label>
                <input type="number" name="min_audio" min="0" value="<?= htmlspecialchars($filter_min_audio) ?>"
                    placeholder="0"
                    class="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200">
            </div>
        </div>
        <div class="mt-4 flex gap-2">
            <button type="submit"
                class="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors">
                Lọc
            </button>
            <a href="visits_offline.php"
                class="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors">
                Xóa filter
            </a>
        </div>
        <!-- Giữ sort/order khi submit filter -->
        <input type="hidden" name="sort"  value="<?= htmlspecialchars($sort) ?>">
        <input type="hidden" name="order" value="<?= strtolower($order) ?>">
    </form>

    <!-- ── Bảng danh sách ───────────────────────────────────────── -->
    <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 class="text-sm font-bold text-slate-700">
                Danh sách bản ghi
                <span class="ml-2 text-xs font-normal text-slate-400">(<?= count($records) ?> bản ghi)</span>
            </h3>
            <a href="?export=1&date_from=<?= urlencode($filter_date_from) ?>&date_to=<?= urlencode($filter_date_to) ?>&min_views=<?= urlencode($filter_min_views) ?>&min_audio=<?= urlencode($filter_min_audio) ?>"
                class="text-xs text-blue-600 hover:underline font-semibold">⬇ Xuất CSV</a>
        </div>

        <table class="w-full text-left">
            <thead>
                <tr class="bg-slate-50/50 border-b border-slate-100">
                    <th class="px-6 py-4 text-[11px] font-bold uppercase text-slate-400">ID</th>
                    <th class="px-6 py-4 text-[11px] font-bold uppercase text-slate-400">Mã khách</th>
                    <th class="px-6 py-4 text-[11px] font-bold uppercase text-slate-400">
                        <a href="<?= sortUrl('visit_count', $sort, $order) ?>" class="hover:text-slate-700 transition-colors">
                            Lượt xem POI <?= sortIcon('visit_count', $sort, $order) ?>
                        </a>
                    </th>
                    <th class="px-6 py-4 text-[11px] font-bold uppercase text-slate-400">
                        <a href="<?= sortUrl('audio_listen_count', $sort, $order) ?>" class="hover:text-slate-700 transition-colors">
                            Lượt nghe audio <?= sortIcon('audio_listen_count', $sort, $order) ?>
                        </a>
                    </th>
                    <th class="px-6 py-4 text-[11px] font-bold uppercase text-slate-400">Engagement</th>
                    <th class="px-6 py-4 text-[11px] font-bold uppercase text-slate-400">
                        <a href="<?= sortUrl('created_at', $sort, $order) ?>" class="hover:text-slate-700 transition-colors">
                            Lần đầu <?= sortIcon('created_at', $sort, $order) ?>
                        </a>
                    </th>
                    <th class="px-6 py-4 text-[11px] font-bold uppercase text-slate-400 text-right">
                        <a href="<?= sortUrl('last_visited', $sort, $order) ?>" class="hover:text-slate-700 transition-colors">
                            Lần cuối <?= sortIcon('last_visited', $sort, $order) ?>
                        </a>
                    </th>
                    <th class="px-6 py-4 text-[11px] font-bold uppercase text-slate-400"></th>
                </tr>
            </thead>
            <tbody class="divide-y divide-slate-50">
                <?php if (empty($records)): ?>
                    <tr>
                        <td colspan="8" class="px-6 py-12 text-center text-slate-400 italic">
                            Không có dữ liệu phù hợp với bộ lọc.
                        </td>
                    </tr>
                <?php else: foreach ($records as $r):
                    $views    = (int)$r['visit_count'];
                    $listens  = (int)$r['audio_listen_count'];
                    $eng      = $views > 0 ? round($listens / $views * 100) : 0;
                    $engColor = $eng >= 70 ? 'text-green-600 bg-green-50'
                              : ($eng >= 30 ? 'text-amber-600 bg-amber-50'
                              : 'text-slate-500 bg-slate-50');
                ?>
                    <tr class="hover:bg-slate-50/50 transition-colors group">
                        <td class="px-6 py-4 text-sm text-slate-400">#<?= $r['visit_id'] ?></td>
                        <td class="px-6 py-4">
                            <span class="inline-block bg-indigo-50 text-indigo-700 text-xs font-bold px-2.5 py-1 rounded-full">
                                ID <?= htmlspecialchars($r['customer_id']) ?>
                            </span>
                        </td>
                        <td class="px-6 py-4">
                            <span class="font-bold text-slate-800 text-sm">👁️ <?= $views ?></span>
                            <span class="text-xs text-slate-400 ml-1">lần</span>
                        </td>
                        <td class="px-6 py-4">
                            <span class="font-bold text-slate-800 text-sm">🎧 <?= $listens ?></span>
                            <span class="text-xs text-slate-400 ml-1">lần</span>
                        </td>
                        <td class="px-6 py-4">
                            <span class="inline-block text-xs font-bold px-2 py-0.5 rounded-full <?= $engColor ?>">
                                <?= $eng ?>%
                            </span>
                        </td>
                        <td class="px-6 py-4 text-sm text-slate-500">
                            <?= date('d/m/Y', strtotime($r['created_at'])) ?>
                        </td>
                        <td class="px-6 py-4 text-right text-sm text-slate-500">
                            <?= date('H:i, d/m/Y', strtotime($r['last_visited'])) ?>
                        </td>
                        <td class="px-6 py-4 text-right">
                            <form method="POST" onsubmit="return confirm('Xóa bản ghi khách #<?= $r['customer_id'] ?>?')">
                                <input type="hidden" name="delete_id" value="<?= $r['visit_id'] ?>">
                                <button type="submit"
                                    class="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded-lg hover:bg-red-50">
                                    Xóa
                                </button>
                            </form>
                        </td>
                    </tr>
                <?php endforeach; endif; ?>
            </tbody>
        </table>
    </div>
</div>

<?php include 'footer.php'; ?>