<?php
session_start();
require_once __DIR__ . '/config.php';

if (!isset($_SESSION['user_id'])) {
    header("Location: login.php");
    exit();
}

$restaurant_id = $_SESSION['restaurant_id'];
$pageTitle     = "Quản lý file offline";

// ──────────────────────────────────────────────────────────────
// ĐƯỜNG DẪN THƯ MỤC AUDIO (điều chỉnh theo cấu trúc thực tế)
// Dựa trên ảnh: D:\xampp\htdocs\ThuyetMinhTuDongDaNgon\Raw\audio\
$projectRoot = realpath(__DIR__ . '/../'); // giả sử record.php nằm trong thư mục con
$audioBaseDir = $projectRoot . DIRECTORY_SEPARATOR . 'Raw' . DIRECTORY_SEPARATOR . 'audio';
// Nếu không tìm thấy, thử đường dẫn mặc định (có thể sửa theo server)
if (!is_dir($audioBaseDir)) {
    $audioBaseDir = __DIR__ . '/../Raw/audio';
}
// ──────────────────────────────────────────────────────────────

// Xử lý thêm file
$message = '';
$error   = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action'])) {
    $action = $_POST['action'];

    if ($action === 'add') {
        $lang_code = $_POST['language_code'] ?? '';
        $filename  = $_POST['audio_file'] ?? '';
        if (!in_array($lang_code, ['vi', 'en'])) {
            $error = "Ngôn ngữ không hợp lệ.";
        } elseif (empty($filename)) {
            $error = "Vui lòng chọn file audio.";
        } else {
            // Đường dẫn đầy đủ đến file
            $fullPath = $audioBaseDir . DIRECTORY_SEPARATOR . $lang_code . DIRECTORY_SEPARATOR . $filename;
            if (!file_exists($fullPath)) {
                $error = "File không tồn tại trên server.";
            } else {
                // Lấy language_id
                $stmtLang = $pdo->prepare("SELECT language_id FROM languages WHERE language_code = ?");
                $stmtLang->execute([$lang_code]);
                $lang = $stmtLang->fetch(PDO::FETCH_ASSOC);
                if (!$lang) {
                    $error = "Ngôn ngữ không tồn tại trong hệ thống.";
                } else {
                    $language_id = $lang['language_id'];

                    // Kiểm tra số lượng file hiện có của quán theo ngôn ngữ
                    $stmtCount = $pdo->prepare("
                        SELECT COUNT(*) as total FROM audio 
                        WHERE restaurant_id = ? AND language_id = ? AND is_active = 1
                    ");
                    $stmtCount->execute([$restaurant_id, $language_id]);
                    $count = $stmtCount->fetch(PDO::FETCH_ASSOC)['total'];
                    if ($count >= 3) {
                        $error = "Mỗi ngôn ngữ chỉ được tối đa 3 file offline. Hãy xóa bớt trước khi thêm.";
                    } else {
                        // Lấy version mới nhất + 1
                        $stmtVer = $pdo->prepare("
                            SELECT COALESCE(MAX(version), 0) + 1 as new_ver FROM audio 
                            WHERE restaurant_id = ? AND language_id = ?
                        ");
                        $stmtVer->execute([$restaurant_id, $language_id]);
                        $new_version = $stmtVer->fetch(PDO::FETCH_ASSOC)['new_ver'];
                        if ($new_version > 3) $new_version = 3; // an toàn

                        // Lấy duration (có thể dùng getID3 hoặc để null, ở đây tạm tính 0)
                        $duration = 0;
                        // Nếu muốn lấy duration thực, cài đặt thư viện getID3, nhưng đơn giản thì bỏ qua
                        
                        // Đường dẫn lưu trong DB (tương đối)
                        $audio_url = "audio/{$lang_code}/{$filename}";

                        $stmtInsert = $pdo->prepare("
                            INSERT INTO audio (restaurant_id, language_id, audio_url, duration, version, is_active, last_updated)
                            VALUES (?, ?, ?, ?, ?, 1, NOW())
                        ");
                        if ($stmtInsert->execute([$restaurant_id, $language_id, $audio_url, $duration, $new_version])) {
                            $message = "Đã thêm file offline thành công (version {$new_version}).";
                        } else {
                            $error = "Lỗi khi thêm vào database.";
                        }
                    }
                }
            }
        }
    }
    elseif ($action === 'delete') {
        $audio_id = intval($_POST['audio_id'] ?? 0);
        if ($audio_id) {
            // Kiểm tra audio_id có thuộc quán này không
            $stmtCheck = $pdo->prepare("SELECT audio_id FROM audio WHERE audio_id = ? AND restaurant_id = ?");
            $stmtCheck->execute([$audio_id, $restaurant_id]);
            if ($stmtCheck->fetch()) {
                $stmtDel = $pdo->prepare("DELETE FROM audio WHERE audio_id = ?");
                if ($stmtDel->execute([$audio_id])) {
                    $message = "Đã xóa file offline.";
                } else {
                    $error = "Lỗi khi xóa.";
                }
            } else {
                $error = "Bạn không có quyền xóa file này.";
            }
        }
    }
}

// ──────────────────────────────────────────────────────────────
// Lấy danh sách file audio hiện có của quán (chỉ vi, en)
$stmtAudios = $pdo->prepare("
    SELECT a.*, l.language_code 
    FROM audio a
    JOIN languages l ON a.language_id = l.language_id
    WHERE a.restaurant_id = ? AND l.language_code IN ('vi','en') AND a.is_active = 1
    ORDER BY l.language_code, a.version
");
$stmtAudios->execute([$restaurant_id]);
$audios = $stmtAudios->fetchAll(PDO::FETCH_ASSOC);

// ──────────────────────────────────────────────────────────────
// Liệt kê các file có sẵn trong thư mục (vi, en)
$availableFiles = ['vi' => [], 'en' => []];
foreach (['vi', 'en'] as $lang) {
    $dir = $audioBaseDir . DIRECTORY_SEPARATOR . $lang;
    if (is_dir($dir)) {
        $files = scandir($dir);
        foreach ($files as $file) {
            if (pathinfo($file, PATHINFO_EXTENSION) === 'mp3') {
                // Lấy các file chưa được gán cho quán này (kiểm tra sau)
                $availableFiles[$lang][] = $file;
            }
        }
    }
}

// Hàm lấy danh sách filename đã tồn tại của quán (theo ngôn ngữ) để loại khỏi dropdown
$usedFilenames = [];
foreach ($audios as $a) {
    $usedFilenames[$a['language_code']][] = basename($a['audio_url']);
}

include 'header.php';
?>

<div class="p-6 bg-slate-50/50 min-h-screen">
    <div class="mb-6">
        <h2 class="text-2xl font-bold text-slate-800">Quản lý file offline</h2>
        <p class="text-sm text-slate-500">Thêm / xóa file audio cho quán của bạn (tối đa 3 file/ngôn ngữ)</p>
    </div>

    <?php if ($message): ?>
        <div class="mb-4 rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700"><?= htmlspecialchars($message) ?></div>
    <?php endif; ?>
    <?php if ($error): ?>
        <div class="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700"><?= htmlspecialchars($error) ?></div>
    <?php endif; ?>

    <!-- DANH SÁCH FILE HIỆN CÓ -->
    <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-6">
        <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 class="text-sm font-bold text-slate-700">📁 File offline của quán</h3>
        </div>
        <?php if (empty($audios)): ?>
            <div class="px-6 py-12 text-center text-slate-400 italic">Chưa có file offline nào. Hãy thêm mới bên dưới.</div>
        <?php else: ?>
            <table class="w-full text-left">
                <thead>
                    <tr class="bg-slate-50/50 border-b border-slate-100">
                        <th class="px-6 py-4 text-[11px] font-bold uppercase text-slate-400">Ngôn ngữ</th>
                        <th class="px-6 py-4 text-[11px] font-bold uppercase text-slate-400">File</th>
                        <th class="px-6 py-4 text-[11px] font-bold uppercase text-slate-400">Version</th>
                        <th class="px-6 py-4 text-[11px] font-bold uppercase text-slate-400">Thời lượng (giây)</th>
                        <th class="px-6 py-4 text-[11px] font-bold uppercase text-slate-400">Thao tác</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-50">
                    <?php foreach ($audios as $audio): 
                        $flag = $audio['language_code'] === 'vi' ? '🇻🇳' : '🇺🇸';
                        $langName = $audio['language_code'] === 'vi' ? 'Tiếng Việt' : 'English';
                        $fileName = basename($audio['audio_url']);
                    ?>
                    <tr class="hover:bg-slate-50/50">
                        <td class="px-6 py-4">
                            <span class="text-xl"><?= $flag ?></span>
                            <span class="text-sm font-semibold ml-1"><?= $langName ?></span>
                        </td>
                        <td class="px-6 py-4 text-sm font-mono text-slate-600"><?= htmlspecialchars($fileName) ?></td>
                        <td class="px-6 py-4 text-sm text-slate-500"><?= $audio['version'] ?></td>
                        <td class="px-6 py-4 text-sm text-slate-500"><?= $audio['duration'] ?: '?' ?></td>
                        <td class="px-6 py-4">
                            <form method="POST" onsubmit="return confirm('Xóa file này?')">
                                <input type="hidden" name="action" value="delete">
                                <input type="hidden" name="audio_id" value="<?= $audio['audio_id'] ?>">
                                <button type="submit" class="text-red-500 hover:text-red-700 text-sm font-semibold">🗑 Xóa</button>
                            </form>
                        </td>
                    </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        <?php endif; ?>
    </div>

    <!-- FORM THÊM MỚI -->
    <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <h3 class="text-sm font-bold text-slate-700 mb-4">➕ Thêm file offline mới</h3>
        <form method="POST">
            <input type="hidden" name="action" value="add">
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                    <label class="block text-xs font-semibold text-slate-500 mb-1">Ngôn ngữ</label>
                    <select name="language_code" required class="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200">
                        <option value="vi">🇻🇳 Tiếng Việt</option>
                        <option value="en">🇺🇸 English</option>
                    </select>
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-500 mb-1">Chọn file từ thư mục</label>
                    <select name="audio_file" required class="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200">
                        <option value="">-- Chọn file --</option>
                        <?php foreach (['vi', 'en'] as $lang):
                            $files = $availableFiles[$lang];
                            $used = $usedFilenames[$lang] ?? [];
                            foreach ($files as $file):
                                if (in_array($file, $used)) continue; // ẩn file đã dùng
                                ?>
                                <option value="<?= htmlspecialchars($file) ?>" data-lang="<?= $lang ?>">
                                    <?= $lang === 'vi' ? '🇻🇳' : '🇺🇸' ?> <?= htmlspecialchars($file) ?>
                                </option>
                            <?php endforeach;
                        endforeach; ?>
                    </select>
                    <p class="text-xs text-slate-400 mt-1">📂 Chỉ hiển thị file .mp3 chưa được thêm vào quán.</p>
                </div>
            </div>
            <div class="mt-4">
                <button type="submit" class="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors">Thêm file</button>
            </div>
        </form>
        <div class="mt-4 text-xs text-slate-500 bg-slate-50 p-3 rounded-xl">
            💡 <strong>Lưu ý:</strong> File phải có sẵn trong thư mục <code><?= htmlspecialchars($audioBaseDir) ?>/vi/</code> hoặc <code>/en/</code>. 
            Mỗi ngôn ngữ tối đa <strong>3 file</strong>. Hệ thống tự động tăng version (1,2,3). Khi xóa, chỉ xóa khỏi database, không xóa file vật lý.
        </div>
    </div>
</div>

<?php include 'footer.php'; ?>