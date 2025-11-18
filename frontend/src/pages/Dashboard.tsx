import { Link } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import LiveMap from '../components/LiveMap';
import DeviceListSidebar from '../components/DeviceListSidebar';
import LoadingSpinner from '../components/LoadingSpinner';
import { deviceApi, telemetryApi } from '../services/api';
import type { Device, DeviceWithLocation } from '../types/device';

function Dashboard() {
  const [devices, setDevices] = useState<DeviceWithLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Fetch devices and their locations
  const fetchDevicesWithLocations = useCallback(async () => {
    try {
      // Fetch all devices
      const devicesData = await deviceApi.getAll();
      
      // Fetch locations for each device
      const devicesWithLocations = await Promise.all(
        devicesData.map(async (device: Device) => {
          try {
            const location = await telemetryApi.getLastLocation(device.id);
            return { ...device, location } as DeviceWithLocation;
          } catch (err) {
            console.error(`Failed to fetch location for device ${device.id}:`, err);
            return { ...device, location: undefined } as DeviceWithLocation;
          }
        })
      );

      setDevices(devicesWithLocations);
      setLastUpdate(new Date());
      setError(null);
    } catch (err) {
      console.error('Failed to fetch devices:', err);
      setError('Failed to load devices. Using mock data for demo.');
      
      // Use mock data for development/demo
      const mockDevices: DeviceWithLocation[] = [
        {
          id: '1',
          device_id: 'XYZ123',
          device_name: 'Vehicle Alpha',
          firmware_version: '1.2.3',
          last_seen: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
          battery_level: 87,
          status: 'online',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          location: {
            deviceId: '1',
            timestamp: new Date().toISOString(),
            latitude: 13.0827,  // Chennai - T Nagar
            longitude: 80.2707,
            speed: 45.5,
            heading: 135,
            accuracy: 5,
            satellites: 12,
          },
        },
        {
          id: '2',
          device_id: 'ABC789',
          device_name: 'Vehicle Beta',
          firmware_version: '1.2.3',
          last_seen: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          battery_level: 92,
          status: 'idle',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          location: {
            deviceId: '2',
            timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            latitude: 13.0475,  // Chennai - Adyar
            longitude: 80.2570,
            speed: 0,
            heading: 0,
            accuracy: 8,
            satellites: 10,
          },
        },
        {
          id: '3',
          device_id: 'DEF456',
          device_name: 'Vehicle Gamma',
          firmware_version: '1.2.2',
          last_seen: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          battery_level: 45,
          status: 'offline',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          location: {
            deviceId: '3',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            latitude: 13.1189,  // Chennai - Anna Nagar
            longitude: 80.2072,
            speed: 0,
            heading: 270,
            accuracy: 15,
            satellites: 6,
          },
        },
      ];
      setDevices(mockDevices);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchDevicesWithLocations();
  }, [fetchDevicesWithLocations]);

  // Polling for live updates every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchDevicesWithLocations();
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchDevicesWithLocations]);

  const onlineDevices = devices.filter(d => d.status === 'online');
  const totalEvents = 47; // This should come from events API
  const criticalAlerts = 3; // This should come from events API

  return (
    <div>
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-2">Real-time monitoring of your IoT Black Box system</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Last updated</p>
            <p className="text-sm font-medium text-gray-700">
              {lastUpdate.toLocaleTimeString()}
            </p>
          </div>
        </div>
      </header>

      {error && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">⚠️ {error}</p>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Active Devices</p>
              <p className="text-3xl font-bold text-gray-900">{devices.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">📱</span>
            </div>
          </div>
          <p className="text-xs text-green-600 mt-2">↑ {onlineDevices.length} online now</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Events</p>
              <p className="text-3xl font-bold text-gray-900">{totalEvents}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🚨</span>
            </div>
          </div>
          <p className="text-xs text-gray-600 mt-2">3 crash, 44 panic</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Critical Alerts</p>
              <p className="text-3xl font-bold text-red-600">{criticalAlerts}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">⚠️</span>
            </div>
          </div>
          <p className="text-xs text-red-600 mt-2">Requires attention</p>
        </div>
      </div>

      {/* Live Map with Device Sidebar */}
      <div className="bg-white rounded-lg shadow mb-8">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Live Device Tracking</h2>
          <p className="text-sm text-gray-600 mt-1">
            Real-time locations of all registered devices (updates every 5 seconds)
          </p>
        </div>
        
        {loading ? (
          <div className="p-12">
            <LoadingSpinner size="lg" message="Loading devices and locations..." />
          </div>
        ) : devices.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-600 text-lg mb-2">📍</p>
            <p className="text-gray-600">No devices registered yet</p>
            <Link
              to="/devices"
              className="inline-block mt-4 text-blue-600 hover:text-blue-700"
            >
              Register your first device →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 h-[600px]">
            {/* Device List Sidebar */}
            <div className="lg:col-span-1 border-r overflow-hidden">
              <DeviceListSidebar
                devices={devices}
                selectedDeviceId={selectedDeviceId}
                onDeviceSelect={setSelectedDeviceId}
              />
            </div>

            {/* Map */}
            <div className="lg:col-span-3">
              <LiveMap
                devices={devices}
                selectedDeviceId={selectedDeviceId}
                onDeviceSelect={setSelectedDeviceId}
              />
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link
              to="/devices"
              className="block w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors text-center"
            >
              View All Devices
            </Link>
            <Link
              to="/events"
              className="block w-full bg-gray-600 text-white px-4 py-3 rounded-lg hover:bg-gray-700 transition-colors text-center"
            >
              View All Events
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <span className="text-xl">🚨</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Crash Event Detected</p>
                <p className="text-xs text-gray-500">Device XYZ123 - 5 min ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <span className="text-xl">📱</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">New Device Registered</p>
                <p className="text-xs text-gray-500">Device ABC789 - 1 hour ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <span className="text-xl">✅</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Panic Event Resolved</p>
                <p className="text-xs text-gray-500">Device DEF456 - 2 hours ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
