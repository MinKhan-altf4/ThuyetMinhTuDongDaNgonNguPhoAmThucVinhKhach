import { NextResponse } from 'next/server';
import { pool } from './db'; // Vì file db.ts nằm ngay cạnh file này

export async function GET() {
  try {
    // 1. Truy vấn lấy số lượng từ các bảng trong XAMPP
    const [users]: any = await pool.query("SELECT COUNT(*) as total FROM users WHERE role = 'admin'");
    const [restaurants]: any = await pool.query("SELECT COUNT(*) as total FROM restaurant");
    const [dishes]: any = await pool.query("SELECT COUNT(*) as total FROM dish WHERE is_active = 1");

    // 2. Trả về kết quả JSON
    return NextResponse.json({
      stats: {
        owners: users[0]?.total || 0,
        stores: restaurants[0]?.total || 0,
        dishes: dishes[0]?.total || 0,
        ordersToday: 0
      },
      chartData: [
        { name: "T1", revenue: 4200 },
        { name: "T2", revenue: 3800 }
      ],
      activities: [
        { action: "Kết nối thành công", name: "MySQL XAMPP", time: "Vừa xong" }
      ]
    });

  } catch (error: any) {
    console.error("Lỗi kết nối:", error.message);
    return NextResponse.json(
      { error: "Lỗi kết nối MySQL qua XAMPP" }, 
      { status: 500 }
    );
  }
}