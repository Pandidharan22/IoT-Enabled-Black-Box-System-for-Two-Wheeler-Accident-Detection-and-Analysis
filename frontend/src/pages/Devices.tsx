function Devices() {
  return (
    <div>
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Devices</h1>
        <p className="text-gray-600 mt-2">Manage and monitor your registered IoT devices</p>
      </header>

      {/* Actions */}
      <div className="mb-6 flex justify-between items-center">
        <div className="flex space-x-4">
          <input
            type="text"
            placeholder="Search devices..."
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option>All Status</option>
            <option>Active</option>
            <option>Inactive</option>
            <option>Maintenance</option>
          </select>
        </div>
        <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          + Register Device
        </button>
      </div>

      {/* Devices Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Device Card 1 */}
        <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Device XYZ123</h3>
            <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
              Active
            </span>
          </div>
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">IMEI:</span>
              <span className="text-gray-900 font-medium">123456789012345</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Vehicle:</span>
              <span className="text-gray-900 font-medium">DL-01-AB-1234</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Last Seen:</span>
              <span className="text-gray-900 font-medium">2 min ago</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Firmware:</span>
              <span className="text-gray-900 font-medium">v1.2.3</span>
            </div>
          </div>
          <button className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors">
            View Details
          </button>
        </div>

        {/* Device Card 2 */}
        <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Device ABC789</h3>
            <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
              Active
            </span>
          </div>
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">IMEI:</span>
              <span className="text-gray-900 font-medium">987654321098765</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Vehicle:</span>
              <span className="text-gray-900 font-medium">MH-02-CD-5678</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Last Seen:</span>
              <span className="text-gray-900 font-medium">15 min ago</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Firmware:</span>
              <span className="text-gray-900 font-medium">v1.2.3</span>
            </div>
          </div>
          <button className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors">
            View Details
          </button>
        </div>

        {/* Device Card 3 */}
        <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Device DEF456</h3>
            <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
              Inactive
            </span>
          </div>
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">IMEI:</span>
              <span className="text-gray-900 font-medium">456789123456789</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Vehicle:</span>
              <span className="text-gray-900 font-medium">KA-03-EF-9012</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Last Seen:</span>
              <span className="text-gray-900 font-medium">3 hours ago</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Firmware:</span>
              <span className="text-gray-900 font-medium">v1.1.5</span>
            </div>
          </div>
          <button className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors">
            View Details
          </button>
        </div>
      </div>

      {/* Empty State Alternative (commented for reference) */}
      {/* 
      <div className="bg-white rounded-lg shadow p-12 text-center">
        <p className="text-gray-600 text-lg mb-4">📱</p>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Devices Yet</h3>
        <p className="text-gray-600 mb-6">Get started by registering your first IoT device</p>
        <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          Register Your First Device
        </button>
      </div>
      */}
    </div>
  );
}

export default Devices;
