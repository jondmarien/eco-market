import React, { useState, useEffect } from 'react';
import { VendorAnalytics, VendorOrder, VendorProduct } from '../types';
import { dashboardAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const Dashboard: React.FC = () => {
  const { vendor } = useAuth();
  const [analytics, setAnalytics] = useState<VendorAnalytics | null>(null);
  const [recentOrders, setRecentOrders] = useState<VendorOrder[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<VendorProduct[]>([]);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const data = await dashboardAPI.getDashboardData();
        setAnalytics(data.analytics);
        setRecentOrders(data.recentOrders);
        setLowStockProducts(data.lowStockProducts);
        setUnreadMessages(data.unreadMessages);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        // Use mock data for demo
        setAnalytics({
          totalRevenue: 15420.50,
          monthlyRevenue: 3240.75,
          totalOrders: 89,
          monthlyOrders: 23,
          averageOrderValue: 173.26,
          topProducts: [
            { productId: '1', productName: 'Eco Water Bottle', sales: 45, revenue: 1125.50 },
            { productId: '2', productName: 'Bamboo Lunch Box', sales: 32, revenue: 592.00 },
          ],
          revenueChart: [],
          ordersChart: [],
          recentOrders: [],
          productPerformance: [],
        });
        setRecentOrders([
          {
            id: '1',
            vendorId: vendor?.id || '',
            customerId: 'customer-1',
            customerName: 'John Doe',
            customerEmail: 'john@example.com',
            items: [],
            status: 'pending',
            totalAmount: 125.50,
            vendorAmount: 119.22,
            commissionAmount: 6.28,
            shippingAddress: {
              street: '123 Main St',
              city: 'Boston',
              state: 'MA',
              postalCode: '02101',
              country: 'USA',
            },
            orderDate: '2024-01-20T10:00:00Z',
            paymentStatus: 'paid',
          },
        ]);
        setLowStockProducts([
          {
            id: '1',
            vendorId: vendor?.id || '',
            name: 'Eco Water Bottle',
            description: 'Sustainable water bottle',
            price: 24.99,
            category: 'Bottles',
            sku: 'ECO-BOTTLE-001',
            images: [],
            status: 'active',
            stock: 5,
            lowStockThreshold: 10,
            tags: [],
            createdAt: '2024-01-15T10:00:00Z',
            updatedAt: '2024-01-15T10:00:00Z',
            views: 250,
            sales: 45,
            rating: 4.5,
            reviewCount: 12,
          },
        ]);
        setUnreadMessages(3);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [vendor]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-vendor-600 to-vendor-700 text-white rounded-lg p-6">
        <h1 className="text-2xl font-bold">Welcome back, {vendor?.companyName}!</h1>
        <p className="mt-2 opacity-90">
          Here's how your business is performing on EcoMarket.
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="metric-card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center h-8 w-8 rounded-md bg-vendor-600 text-white">
                💰
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-600 truncate">Total Revenue</dt>
                <dd className="text-lg font-semibold text-gray-900">
                  ${analytics?.totalRevenue.toLocaleString()}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center h-8 w-8 rounded-md bg-success-600 text-white">
                📈
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-600 truncate">Monthly Revenue</dt>
                <dd className="text-lg font-semibold text-gray-900">
                  ${analytics?.monthlyRevenue.toLocaleString()}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center h-8 w-8 rounded-md bg-primary-600 text-white">
                🛒
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-600 truncate">Total Orders</dt>
                <dd className="text-lg font-semibold text-gray-900">
                  {analytics?.totalOrders.toLocaleString()}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center h-8 w-8 rounded-md bg-warning-600 text-white">
                📊
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-600 truncate">Avg Order Value</dt>
                <dd className="text-lg font-semibold text-gray-900">
                  ${analytics?.averageOrderValue.toFixed(2)}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <button className="btn-primary w-full">
            📦 Add New Product
          </button>
          <button className="btn-secondary w-full">
            🛒 View All Orders
          </button>
          <button className="btn-secondary w-full">
            📊 View Analytics
          </button>
          <button className="btn-secondary w-full">
            💬 Messages ({unreadMessages})
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="card">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Recent Orders</h3>
          {recentOrders.length > 0 ? (
            <div className="space-y-3">
              {recentOrders.slice(0, 5).map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <span className={`status-badge ${
                        order.status === 'pending' ? 'status-pending' :
                        order.status === 'confirmed' ? 'status-active' :
                        'status-inactive'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-900">
                        Order #{order.id.slice(-6)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {order.customerName} • ${order.totalAmount}
                      </p>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(order.orderDate).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No recent orders</p>
          )}
          <div className="mt-4">
            <button className="btn-secondary w-full">View All Orders</button>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="card">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Low Stock Alerts
          </h3>
          {lowStockProducts.length > 0 ? (
            <div className="space-y-3">
              {lowStockProducts.map((product) => (
                <div key={product.id} className="flex items-center justify-between p-3 bg-warning-50 border border-warning-200 rounded-lg">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-lg bg-warning-100 flex items-center justify-center">
                        ⚠️
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-900">
                        {product.name}
                      </p>
                      <p className="text-sm text-warning-700">
                        Only {product.stock} left • SKU: {product.sku}
                      </p>
                    </div>
                  </div>
                  <button className="btn-warning text-xs">
                    Restock
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">All products are well stocked</p>
          )}
          <div className="mt-4">
            <button className="btn-secondary w-full">Manage Inventory</button>
          </div>
        </div>
      </div>

      {/* Top Products */}
      {analytics?.topProducts && analytics.topProducts.length > 0 && (
        <div className="card">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Top Performing Products</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {analytics.topProducts.slice(0, 3).map((product) => (
              <div key={product.productId} className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900">{product.productName}</h4>
                <div className="mt-2 text-sm text-gray-600">
                  <p>{product.sales} sales</p>
                  <p className="font-semibold text-vendor-600">${product.revenue}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
