export interface District {
  id: number;
  name: string;
  city: string;
  description: string;
}

export interface Category {
  id: number;
  slug: string;
  name: string;
  icon: string;
  color_hex: string;
}

export interface Tour {
  id: number;
  district_id: number;
  name: string;
  description: string;
  duration_hrs: number;
  distance_km: number;
  price_vnd: number | null;
  is_active: boolean;
}

export interface Restaurant {
  id: number;
  district_id: number;
  category_id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  phone: string | null;
  founded_year: number | null;
  open_time: string;
  close_time: string;
  price_min_vnd: number;
  price_max_vnd: number;
  rating: number;
  review_count: number;
  description: string;
  is_active: boolean;
}

export interface Tag {
  id: number;
  name: string;
}

export const initialDistricts: District[] = [
  { id: 1, name: 'Quận 4', city: 'Hồ Chí Minh', description: 'Quận ẩm thực bình dân nổi tiếng ven sông Sài Gòn' },
  { id: 2, name: 'Quận 1', city: 'Hồ Chí Minh', description: 'Trung tâm thành phố, ẩm thực đa dạng cao cấp' },
  { id: 3, name: 'Quận 3', city: 'Hồ Chí Minh', description: 'Khu phố Tây, cà phê và ẩm thực sáng tạo' },
  { id: 4, name: 'Quận 5', city: 'Hồ Chí Minh', description: 'Phố người Hoa, ẩm thực Trung Hoa phong phú' },
];

export const initialCategories: Category[] = [
  { id: 1, slug: 'pho', name: 'Phở', icon: '🍜', color_hex: '#e05a1a' },
  { id: 2, slug: 'bun', name: 'Bún', icon: '🥣', color_hex: '#0c5460' },
  { id: 3, slug: 'com', name: 'Cơm', icon: '🍚', color_hex: '#155724' },
  { id: 4, slug: 'snack', name: 'Ăn vặt', icon: '🥖', color_hex: '#721c24' },
  { id: 5, slug: 'cafe', name: 'Cà phê', icon: '☕', color_hex: '#432874' },
  { id: 6, slug: 'lau', name: 'Lẩu', icon: '🫕', color_hex: '#7b3f00' },
];

export const initialTours: Tour[] = [
  { id: 1, district_id: 1, name: 'Tour Ẩm Thực Quận 4 – Hương Vị Sài Gòn Xưa', description: 'Khám phá 8 quán ăn nổi tiếng nhất Quận 4', duration_hrs: 4.0, distance_km: 3.8, price_vnd: null, is_active: true },
  { id: 2, district_id: 1, name: 'Tour Buổi Sáng Quận 4', description: 'Hành trình ẩm thực sáng từ 6h–10h', duration_hrs: 2.5, distance_km: 2.0, price_vnd: null, is_active: true },
];

export const initialRestaurants: Restaurant[] = [
  { id: 1, district_id: 1, category_id: 1, name: 'Phở Tàu Bay Quận 4', address: '104 Nguyễn Tất Thành, Quận 4', latitude: 10.76, longitude: 106.704, phone: null, founded_year: 1954, open_time: '05:30', close_time: '14:00', price_min_vnd: 45000, price_max_vnd: 75000, rating: 4.8, review_count: 1243, description: 'Một trong những quán phở lâu đời nhất Sài Gòn.', is_active: true },
  { id: 2, district_id: 1, category_id: 2, name: 'Bún Mắm Cô Út', address: '23 Khánh Hội, Quận 4', latitude: 10.7575, longitude: 106.7025, phone: null, founded_year: 1987, open_time: '10:00', close_time: '21:00', price_min_vnd: 50000, price_max_vnd: 90000, rating: 4.7, review_count: 876, description: 'Hương vị bún mắm miền Tây đích thực.', is_active: true },
  { id: 3, district_id: 1, category_id: 3, name: 'Cơm Tấm Bà Năm', address: '15 Bến Vân Đồn, Quận 4', latitude: 10.7555, longitude: 106.701, phone: null, founded_year: 1975, open_time: '06:00', close_time: '22:00', price_min_vnd: 35000, price_max_vnd: 65000, rating: 4.9, review_count: 2150, description: 'Biểu tượng cơm tấm Sài Gòn hơn 50 năm.', is_active: true },
  { id: 4, district_id: 1, category_id: 4, name: 'Bánh Mì Huỳnh Hoa', address: '26 Lê Thị Riêng, Quận 4', latitude: 10.762, longitude: 106.7055, phone: null, founded_year: 1985, open_time: '06:00', close_time: '23:30', price_min_vnd: 25000, price_max_vnd: 50000, rating: 4.6, review_count: 3400, description: 'Ổ bánh mì nhân đầy ắp.', is_active: true },
  { id: 5, district_id: 1, category_id: 6, name: 'Lẩu Mắm Đầu Phố', address: '89 Đoàn Văn Bơ, Quận 4', latitude: 10.764, longitude: 106.707, phone: null, founded_year: 2008, open_time: '10:30', close_time: '22:30', price_min_vnd: 120000, price_max_vnd: 280000, rating: 4.5, review_count: 652, description: 'Lẩu mắm cá đồng ủ 6 tháng.', is_active: true },
  { id: 6, district_id: 1, category_id: 5, name: 'Cà Phê Sài Gòn Xưa', address: '5 Hoàng Diệu, Quận 4', latitude: 10.759, longitude: 106.7035, phone: null, founded_year: 1968, open_time: '06:30', close_time: '22:00', price_min_vnd: 20000, price_max_vnd: 45000, rating: 4.4, review_count: 487, description: 'Quán cà phê vợt hơn 55 năm tuổi.', is_active: true },
  { id: 7, district_id: 1, category_id: 2, name: 'Bún Bò Bà Phượng', address: '34 Tôn Thất Thuyết, Quận 4', latitude: 10.756, longitude: 106.7045, phone: null, founded_year: 1993, open_time: '06:00', close_time: '14:00', price_min_vnd: 45000, price_max_vnd: 80000, rating: 4.7, review_count: 918, description: 'Tô bún bò Huế nồng ấm vị sả và ruốc cay thơm.', is_active: true },
  { id: 8, district_id: 1, category_id: 4, name: 'Chè Cô Loan', address: '67 Nguyễn Khoái, Quận 4', latitude: 10.7545, longitude: 106.702, phone: null, founded_year: 2001, open_time: '14:00', close_time: '23:00', price_min_vnd: 15000, price_max_vnd: 35000, rating: 4.6, review_count: 1067, description: 'Thiên đường chè Sài Gòn.', is_active: false },
];

export const initialTags: Tag[] = [
  { id: 1, name: 'Vỉa hè' },
  { id: 2, name: 'Máy lạnh' },
  { id: 3, name: 'Không gian cổ' },
  { id: 4, name: 'Gia đình' },
  { id: 5, name: 'Bình dân' },
  { id: 6, name: 'Đặc sản miền Tây' },
  { id: 7, name: 'Lâu đời' },
  { id: 8, name: 'Ăn sáng' },
  { id: 9, name: 'Ăn đêm' },
];
