// === HƯỚNG DẪN: Ghi lại lượt truy cập POI ===
// 
// Thêm code này vào MapPage.xaml.cs hoặc POIPage.xaml.cs khi user click vào POI
//
// VÍ DỤ 1: Khi click vào marker/annotation trên map
// 
// private async void OnPOIMarkerTapped(POI poi)
// {
//     // Lấy customer_id (user hiện tại)
//     int? currentUserId = SecureStorage.GetUserId(); // hoặc từ AppSettings
//     
//     if (currentUserId.HasValue && poi.RestaurantId > 0)
//     {
//         // Ghi lại truy cập + lượt nghe lên server
//         await _analyticsService.RecordVisitAsync(
//             customerId: currentUserId.Value,
//             restaurantId: poi.RestaurantId,
//             listenCount: 1  // số lần nghe audio (nếu có)
//         );
//     }
//     
//     // Hiển thị chi tiết POI...
// }
//
// VÍ DỤ 2: Khi open POI detail page
//
// private async void OnPOIDetailOpened(POI poi)
// {
//     // Ghi lại truy cập ngay khi mở
//     int? currentUserId = SecureStorage.GetUserId();
//     if (currentUserId.HasValue && poi.RestaurantId > 0)
//     {
//         await _analyticsService.RecordVisitAsync(
//             currentUserId.Value, 
//             poi.RestaurantId, 
//             0
//         );
//     }
// }
//
// VÍ DỤ 3: Khi user nhấn "nghe audio" POI
//
// private async void OnPlayAudioClicked(POI poi)
// {
//     // Phát audio...
//     await PlayAudioAsync(poi);
//     
//     // Ghi lại lượt nghe
//     int? currentUserId = SecureStorage.GetUserId();
//     if (currentUserId.HasValue && poi.RestaurantId > 0)
//     {
//         await _analyticsService.RecordVisitAsync(
//             currentUserId.Value,
//             poi.RestaurantId,
//             1  // +1 lượt nghe
//         );
//     }
// }
//
// ========================================
// TÓHỢP: Web Admin (StallOwners.tsx)
// ========================================
// Sẽ có trang "Thống kê truy cập" hiển thị:
// - Tổng khách truy cập
// - Tổng lần truy cập
// - Tổng lần nghe audio
// - Từng khách có truy cập bao nhiêu lần
