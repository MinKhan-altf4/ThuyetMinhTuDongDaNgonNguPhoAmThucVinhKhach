<?php
session_start();
require_once __DIR__ . '/config.php';

if (!isset($_SESSION['user_id'])) {
    header('Location: login.php');
    exit();
}

$restaurant_id = (int)($_SESSION['restaurant_id'] ?? 0);
$pageTitle = 'Quan ly audio offline';

$audioBaseCandidates = [
    realpath(__DIR__ . '/../../POIApp/Resources/Raw/audio'),
    realpath(__DIR__ . '/../Raw/audio'),
];

$audioBaseDir = null;
foreach ($audioBaseCandidates as $candidate) {
    if ($candidate && is_dir($candidate)) {
        $audioBaseDir = $candidate;
        break;
    }
}
if (!$audioBaseDir) {
    $audioBaseDir = __DIR__ . '/../../POIApp/Resources/Raw/audio';
}

function h($value) {
    return htmlspecialchars((string)$value, ENT_QUOTES, 'UTF-8');
}

function audio_preview_url(string $languageCode, string $fileName): string {
    return 'http://localhost:3000/offline-audio/' . rawurlencode($languageCode) . '/' . rawurlencode($fileName);
}

function delete_physical_audio_if_unused(PDO $pdo, string $audioBaseDir, string $audioUrl): void {
    $normalized = ltrim(str_replace('\\', '/', $audioUrl), '/');
    $parts = array_values(array_filter(explode('/', $normalized)));
    if (count($parts) < 3 || $parts[0] !== 'audio') {
        return;
    }

    $fileName = basename(implode('/', array_slice($parts, 2)));
    $fullPath = $audioBaseDir . DIRECTORY_SEPARATOR . $parts[1] . DIRECTORY_SEPARATOR . $fileName;
    if (!is_file($fullPath)) {
        return;
    }

    $stmt = $pdo->prepare("SELECT COUNT(*) FROM audio WHERE audio_url = ?");
    $stmt->execute([$audioUrl]);
    if ((int)$stmt->fetchColumn() === 0) {
        @unlink($fullPath);
    }
}

$stmtLanguages = $pdo->query("SELECT language_id, language_code FROM languages ORDER BY language_code ASC");
$languages = $stmtLanguages->fetchAll(PDO::FETCH_ASSOC);
$languageMap = [];
foreach ($languages as $language) {
    $languageMap[$language['language_code']] = (int)$language['language_id'];
}

$message = '';
$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action'])) {
    $action = $_POST['action'];

    if ($action === 'add') {
        $languageCode = strtolower(trim($_POST['language_code'] ?? ''));
        $fileName = basename(trim($_POST['audio_file'] ?? ''));
        $duration = is_numeric($_POST['duration'] ?? null) ? (int)$_POST['duration'] : null;

        if (!$restaurant_id) {
            $error = 'Khong tim thay restaurant_id cua tai khoan hien tai.';
        } elseif (!isset($languageMap[$languageCode])) {
            $error = 'Ngon ngu khong hop le.';
        } elseif ($fileName === '') {
            $error = 'Vui long chon file audio.';
        } else {
            $fullPath = $audioBaseDir . DIRECTORY_SEPARATOR . $languageCode . DIRECTORY_SEPARATOR . $fileName;
            if (!is_file($fullPath)) {
                $error = 'File audio khong ton tai trong thu muc offline.';
            } else {
                $languageId = $languageMap[$languageCode];

                $stmtCount = $pdo->prepare("SELECT COUNT(*) FROM audio WHERE restaurant_id = ? AND language_id = ? AND is_active = 1");
                $stmtCount->execute([$restaurant_id, $languageId]);
                $activeCount = (int)$stmtCount->fetchColumn();

                if ($activeCount >= 3) {
                    $error = 'Moi ngon ngu chi duoc toi da 3 file active. Hay xoa bot truoc khi them.';
                } else {
                    $stmtVersion = $pdo->prepare("SELECT COALESCE(MAX(version), 0) + 1 FROM audio WHERE restaurant_id = ? AND language_id = ?");
                    $stmtVersion->execute([$restaurant_id, $languageId]);
                    $nextVersion = (int)$stmtVersion->fetchColumn();

                    $audioUrl = "audio/{$languageCode}/{$fileName}";
                    $stmtInsert = $pdo->prepare("
                        INSERT INTO audio (restaurant_id, language_id, audio_url, duration, version, is_active, last_updated)
                        VALUES (?, ?, ?, ?, ?, 1, NOW())
                    ");

                    if ($stmtInsert->execute([$restaurant_id, $languageId, $audioUrl, $duration, $nextVersion])) {
                        $message = "Da them audio offline thanh cong (version {$nextVersion}).";
                    } else {
                        $error = 'Khong the them audio vao database.';
                    }
                }
            }
        }
    }

    if ($action === 'upload') {
        $languageCode = strtolower(trim($_POST['language_code'] ?? ''));
        $duration = is_numeric($_POST['duration'] ?? null) ? (int)$_POST['duration'] : null;
        $upload = $_FILES['audio_upload'] ?? null;

        if (!$restaurant_id) {
            $error = 'Khong tim thay restaurant_id cua tai khoan hien tai.';
        } elseif (!isset($languageMap[$languageCode])) {
            $error = 'Ngon ngu khong hop le.';
        } elseif (!$upload || ($upload['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
            $error = 'Vui long chon file mp3 de tai len.';
        } else {
            $ext = strtolower(pathinfo($upload['name'], PATHINFO_EXTENSION));
            if ($ext !== 'mp3') {
                $error = 'Chi chap nhan file .mp3';
            } else {
                $languageId = $languageMap[$languageCode];
                $stmtCount = $pdo->prepare("SELECT COUNT(*) FROM audio WHERE restaurant_id = ? AND language_id = ? AND is_active = 1");
                $stmtCount->execute([$restaurant_id, $languageId]);
                $activeCount = (int)$stmtCount->fetchColumn();

                if ($activeCount >= 3) {
                    $error = 'Moi ngon ngu chi duoc toi da 3 file active. Hay xoa bot truoc khi them.';
                } else {
                    $languageDir = $audioBaseDir . DIRECTORY_SEPARATOR . $languageCode;
                    if (!is_dir($languageDir)) {
                        mkdir($languageDir, 0777, true);
                    }

                    $baseName = preg_replace('/[^a-z0-9]+/i', '-', pathinfo($upload['name'], PATHINFO_FILENAME));
                    $baseName = trim(strtolower((string)$baseName), '-');
                    if ($baseName === '') {
                        $baseName = 'audio';
                    }

                    $storedFileName = $restaurant_id . '-' . time() . '-' . $baseName . '.mp3';
                    $targetPath = $languageDir . DIRECTORY_SEPARATOR . $storedFileName;

                    if (!move_uploaded_file($upload['tmp_name'], $targetPath)) {
                        $error = 'Khong the luu file upload vao thu muc audio.';
                    } else {
                        $stmtVersion = $pdo->prepare("SELECT COALESCE(MAX(version), 0) + 1 FROM audio WHERE restaurant_id = ? AND language_id = ?");
                        $stmtVersion->execute([$restaurant_id, $languageId]);
                        $nextVersion = (int)$stmtVersion->fetchColumn();

                        $audioUrl = "audio/{$languageCode}/{$storedFileName}";
                        $stmtInsert = $pdo->prepare("
                            INSERT INTO audio (restaurant_id, language_id, audio_url, duration, version, is_active, last_updated)
                            VALUES (?, ?, ?, ?, ?, 1, NOW())
                        ");

                        if ($stmtInsert->execute([$restaurant_id, $languageId, $audioUrl, $duration, $nextVersion])) {
                            $message = "Da upload va them audio offline thanh cong (version {$nextVersion}).";
                        } else {
                            @unlink($targetPath);
                            $error = 'Khong the luu metadata audio vao database.';
                        }
                    }
                }
            }
        }
    }

    if ($action === 'delete') {
        $audioId = (int)($_POST['audio_id'] ?? 0);
        if ($audioId > 0) {
            $stmtCheck = $pdo->prepare("SELECT audio_id, audio_url FROM audio WHERE audio_id = ? AND restaurant_id = ?");
            $stmtCheck->execute([$audioId, $restaurant_id]);
            $audio = $stmtCheck->fetch();
            if ($audio) {
                $stmtDelete = $pdo->prepare("DELETE FROM audio WHERE audio_id = ?");
                if ($stmtDelete->execute([$audioId])) {
                    delete_physical_audio_if_unused($pdo, $audioBaseDir, $audio['audio_url']);
                    $message = 'Da xoa audio khoi database.';
                } else {
                    $error = 'Khong the xoa audio.';
                }
            } else {
                $error = 'Ban khong co quyen xoa audio nay.';
            }
        }
    }
}

$stmtAudios = $pdo->prepare("
    SELECT a.*, l.language_code
    FROM audio a
    JOIN languages l ON l.language_id = a.language_id
    WHERE a.restaurant_id = ?
    ORDER BY l.language_code ASC, a.version DESC, a.audio_id DESC
");
$stmtAudios->execute([$restaurant_id]);
$audios = $stmtAudios->fetchAll(PDO::FETCH_ASSOC);

$availableFiles = [];
foreach (array_keys($languageMap) as $languageCode) {
    $availableFiles[$languageCode] = [];
    $dir = $audioBaseDir . DIRECTORY_SEPARATOR . $languageCode;
    if (!is_dir($dir)) {
        continue;
    }

    foreach (scandir($dir) as $file) {
        if (strtolower(pathinfo($file, PATHINFO_EXTENSION)) === 'mp3') {
            $availableFiles[$languageCode][] = $file;
        }
    }
    sort($availableFiles[$languageCode]);
}

$usedFiles = [];
foreach ($audios as $audio) {
    $usedFiles[$audio['language_code']][] = basename($audio['audio_url']);
}

include 'header.php';
?>

<div class="p-6 bg-slate-50/50 min-h-screen">
    <div class="mb-6">
        <h2 class="text-2xl font-bold text-slate-800">Quan ly audio offline</h2>
        <p class="text-sm text-slate-500">Owner chi quan ly audio cua quan minh. Admin co the quan ly toan bo tren trang React admin.</p>
    </div>

    <?php if ($message): ?>
        <div class="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"><?= h($message) ?></div>
    <?php endif; ?>
    <?php if ($error): ?>
        <div class="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"><?= h($error) ?></div>
    <?php endif; ?>

    <div class="mb-6 rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
        <div class="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <div>
                <h3 class="text-sm font-bold text-slate-700">Audio hien co cua quan</h3>
                <p class="text-xs text-slate-400">Danh dau ro file ton tai hay dang thieu trong thu muc audio offline.</p>
            </div>
            <div class="text-xs text-slate-400">Thu muc: <span class="font-mono"><?= h($audioBaseDir) ?></span></div>
        </div>

        <?php if (empty($audios)): ?>
            <div class="px-6 py-12 text-center text-slate-400 italic">Chua co audio nao trong database.</div>
        <?php else: ?>
            <table class="w-full text-left">
                <thead>
                    <tr class="border-b border-slate-100 bg-slate-50/50">
                        <th class="px-6 py-4 text-[11px] font-bold uppercase text-slate-400">Ngon ngu</th>
                        <th class="px-6 py-4 text-[11px] font-bold uppercase text-slate-400">File</th>
                        <th class="px-6 py-4 text-[11px] font-bold uppercase text-slate-400">Version</th>
                        <th class="px-6 py-4 text-[11px] font-bold uppercase text-slate-400">Duration</th>
                        <th class="px-6 py-4 text-[11px] font-bold uppercase text-slate-400">Trang thai</th>
                        <th class="px-6 py-4 text-[11px] font-bold uppercase text-slate-400">Thao tac</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-50">
                    <?php foreach ($audios as $audio): ?>
                        <?php
                        $fileName = basename($audio['audio_url']);
                        $exists = is_file($audioBaseDir . DIRECTORY_SEPARATOR . $audio['language_code'] . DIRECTORY_SEPARATOR . $fileName);
                        ?>
                        <tr class="hover:bg-slate-50/50">
                            <td class="px-6 py-4 text-sm font-semibold text-slate-700"><?= h(strtoupper($audio['language_code'])) ?></td>
                            <td class="px-6 py-4">
                                <div class="font-mono text-sm text-slate-700"><?= h($fileName) ?></div>
                                <div class="text-xs text-slate-400"><?= h($audio['audio_url']) ?></div>
                                <?php if ($exists): ?>
                                    <audio controls preload="none" class="mt-2 h-8 w-56">
                                        <source src="<?= h(audio_preview_url($audio['language_code'], $fileName)) ?>" type="audio/mpeg">
                                    </audio>
                                <?php endif; ?>
                            </td>
                            <td class="px-6 py-4 text-sm text-slate-500">v<?= (int)$audio['version'] ?></td>
                            <td class="px-6 py-4 text-sm text-slate-500"><?= $audio['duration'] ? (int)$audio['duration'] . 's' : '?' ?></td>
                            <td class="px-6 py-4">
                                <div class="flex flex-col gap-2">
                                    <span class="inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-semibold <?= $exists ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700' ?>">
                                        <?= $exists ? 'Co file vat ly' : 'Thieu file vat ly' ?>
                                    </span>
                                    <span class="inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-semibold <?= (int)$audio['is_active'] === 1 ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600' ?>">
                                        <?= (int)$audio['is_active'] === 1 ? 'Active' : 'Inactive' ?>
                                    </span>
                                </div>
                            </td>
                            <td class="px-6 py-4">
                                <form method="POST" onsubmit="return confirm('Xoa audio nay khoi database?')">
                                    <input type="hidden" name="action" value="delete">
                                    <input type="hidden" name="audio_id" value="<?= (int)$audio['audio_id'] ?>">
                                    <button type="submit" class="text-sm font-semibold text-red-500 hover:text-red-700">Xoa</button>
                                </form>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        <?php endif; ?>
    </div>

    <div class="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <h3 class="mb-4 text-sm font-bold text-slate-700">Them audio moi</h3>
        <form method="POST" class="space-y-4">
            <input type="hidden" name="action" value="add">
            <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                    <label class="mb-1 block text-xs font-semibold text-slate-500">Ngon ngu</label>
                    <select name="language_code" required class="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200">
                        <option value="">-- Chon ngon ngu --</option>
                        <?php foreach ($languages as $language): ?>
                            <option value="<?= h($language['language_code']) ?>"><?= h(strtoupper($language['language_code'])) ?></option>
                        <?php endforeach; ?>
                    </select>
                </div>
                <div>
                    <label class="mb-1 block text-xs font-semibold text-slate-500">File audio</label>
                    <select name="audio_file" required class="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200">
                        <option value="">-- Chon file --</option>
                        <?php foreach ($availableFiles as $languageCode => $files): ?>
                            <?php $used = $usedFiles[$languageCode] ?? []; ?>
                            <?php foreach ($files as $file): ?>
                                <?php if (in_array($file, $used, true)) continue; ?>
                                <option value="<?= h($file) ?>"><?= h(strtoupper($languageCode) . ' - ' . $file) ?></option>
                            <?php endforeach; ?>
                        <?php endforeach; ?>
                    </select>
                </div>
                <div>
                    <label class="mb-1 block text-xs font-semibold text-slate-500">Duration (giay)</label>
                    <input type="number" min="0" name="duration" class="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" placeholder="Bo trong neu chua biet">
                </div>
            </div>
            <div>
                <button type="submit" class="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700">Them audio</button>
            </div>
        </form>
        <div class="mt-4 rounded-xl bg-slate-50 p-3 text-xs text-slate-500">
            He thong se luu metadata vao bang <code>audio</code>. File vat ly phai co san trong <code><?= h($audioBaseDir) ?></code> theo tung ngon ngu. Moi ngon ngu toi da 3 file active cho moi quan.
        </div>
    </div>

    <div class="mt-6 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <h3 class="mb-4 text-sm font-bold text-slate-700">Upload file mp3 moi</h3>
        <form method="POST" enctype="multipart/form-data" class="space-y-4">
            <input type="hidden" name="action" value="upload">
            <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                    <label class="mb-1 block text-xs font-semibold text-slate-500">Ngon ngu</label>
                    <select name="language_code" required class="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200">
                        <option value="">-- Chon ngon ngu --</option>
                        <?php foreach ($languages as $language): ?>
                            <option value="<?= h($language['language_code']) ?>"><?= h(strtoupper($language['language_code'])) ?></option>
                        <?php endforeach; ?>
                    </select>
                </div>
                <div>
                    <label class="mb-1 block text-xs font-semibold text-slate-500">File mp3</label>
                    <input type="file" name="audio_upload" accept=".mp3,audio/mpeg" required class="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200">
                </div>
                <div>
                    <label class="mb-1 block text-xs font-semibold text-slate-500">Duration (giay)</label>
                    <input type="number" min="0" name="duration" class="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" placeholder="Bo trong neu chua biet">
                </div>
            </div>
            <div>
                <button type="submit" class="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700">Upload va them audio</button>
            </div>
        </form>
    </div>
</div>

<?php include 'footer.php'; ?>
