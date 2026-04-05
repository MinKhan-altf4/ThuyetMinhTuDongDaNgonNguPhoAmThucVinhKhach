// route.ts (hoặc route.js)
import { NextResponse } from 'next/server';
import { pool } from './db';

export async function GET() {
    try {
        // 1. Truy vấn lấy số lượng từ các bảng
        const [users] = await pool.query("SELECT COUNT(*) as total FROM users WHERE role = 'admin'");
        const [restaurants] = await pool.query("SELECT COUNT(*) as total FROM restaurant");
        const [dishes] = await pool.query("SELECT COUNT(*) as total FROM dish WHERE is_active = 1"); // Dùng 1 thay vì true
        
        // Kiểm tra và lấy giá trị an toàn
        const usersTotal = Array.isArray(users) && users[0] ? users[0].total : 0;
        const restaurantsTotal = Array.isArray(restaurants) && restaurants[0] ? restaurants[0].total : 0;
        const dishesTotal = Array.isArray(dishes) && dishes[0] ? dishes[0].total : 0;

        // 2. Trả về kết quả JSON
        return NextResponse.json({
            stats: {
                owners: usersTotal,
                stores: restaurantsTotal,
                dishes: dishesTotal,
                ordersToday: 0
            },
            chartData: [
                { name: "T1", revenue: 4200 },
                { name: "T2", revenue: 3800 },
                { name: "T3", revenue: 4500 },
                { name: "T4", revenue: 5200 },
                { name: "T5", revenue: 4800 },
                { name: "T6", revenue: 6000 },
                { name: "T7", revenue: 5500 }
            ]
        });
        
    } catch (error) {
        console.error('Database error:', error);
        
        // Trả về lỗi chi tiết hơn
        return NextResponse.json(
            { 
                error: 'Internal Server Error',
                message: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}