import { NextResponse } from 'next/server';
import { pool } from '@/lib/db'; // Import từ file bạn vừa tạo

export async function GET() {
  try {
    // 1. Lấy tổng số chủ gian hàng (role admin)
    const [users]: any = await pool.query("SELECT COUNT(*) as total FROM users WHERE role = 'admin'");
    
    // 2. Lấy tổng số nhà hàng
    const [restaurants]: any = await pool.query("SELECT COUNT(*) as total FROM restaurant");
    
    // 3. Lấy tổng số món ăn đang hoạt động
    const [dishes]: any = await pool.query("SELECT COUNT(*) as total FROM dish WHERE is_active = 1");

    // Trả về dữ liệu JSON cho Frontend
    return NextResponse.json({
      owners: users[0].total,
      stores: restaurants[0].total,
      foods: dishes[0].total,
      ordersToday: 0 // Giả lập vì DB chưa có bảng đơn hàng
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}