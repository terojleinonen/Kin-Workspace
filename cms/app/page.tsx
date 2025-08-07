export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Welcome to Kin Workspace CMS
        </h2>
        <p className="text-gray-600 mb-6">
          Manage your e-commerce content, products, and orders from this central dashboard.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Products</h3>
            <p className="text-blue-700 text-sm mb-3">
              Manage your product catalog, inventory, and pricing.
            </p>
            <a 
              href="/products" 
              className="inline-block bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
            >
              Manage Products
            </a>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4">
            <h3 className="font-semibold text-green-900 mb-2">Orders</h3>
            <p className="text-green-700 text-sm mb-3">
              View and process customer orders and payments.
            </p>
            <a 
              href="/orders" 
              className="inline-block bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700"
            >
              View Orders
            </a>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-4">
            <h3 className="font-semibold text-purple-900 mb-2">Analytics</h3>
            <p className="text-purple-700 text-sm mb-3">
              Track sales performance and customer insights.
            </p>
            <a 
              href="/analytics" 
              className="inline-block bg-purple-600 text-white px-4 py-2 rounded text-sm hover:bg-purple-700"
            >
              View Analytics
            </a>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">0</div>
            <div className="text-sm text-gray-600">Total Products</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">0</div>
            <div className="text-sm text-gray-600">Pending Orders</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">$0</div>
            <div className="text-sm text-gray-600">Monthly Revenue</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">0</div>
            <div className="text-sm text-gray-600">Active Users</div>
          </div>
        </div>
      </div>
    </div>
  )
}