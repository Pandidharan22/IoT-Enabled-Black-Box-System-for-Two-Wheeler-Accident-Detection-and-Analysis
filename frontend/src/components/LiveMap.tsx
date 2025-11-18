import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { DeviceWithLocation, DeviceStatus } from '../types/device';

// Fix for default marker icons in React-Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom marker icons based on device status
const createDeviceIcon = (status: DeviceStatus, isSelected: boolean = false) => {
  const colors = {
    online: '#10b981',  // green
    idle: '#f59e0b',    // yellow
    offline: '#ef4444', // red
    error: '#dc2626',   // dark red
  };

  const color = colors[status];
  const scale = isSelected ? 1.3 : 1;

  return L.divIcon({
    html: `
      <div style="
        position: relative;
        width: ${30 * scale}px;
        height: ${30 * scale}px;
      ">
        <div style="
          width: 100%;
          height: 100%;
          background-color: ${color};
          border: ${isSelected ? '4px' : '3px'} solid white;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          box-shadow: 0 3px 8px rgba(0,0,0,0.3);
        "></div>
        ${isSelected ? `<div style="
          position: absolute;
          top: -5px;
          left: -5px;
          width: ${30 * scale + 10}px;
          height: ${30 * scale + 10}px;
          border: 2px solid ${color};
          border-radius: 50%;
          animation: pulse 2s infinite;
        "></div>` : ''}
      </div>
    `,
    className: 'custom-marker',
    iconSize: [30 * scale, 30 * scale],
    iconAnchor: [15 * scale, 30 * scale],
    popupAnchor: [0, -30 * scale],
  });
};

interface DeviceMarkerProps {
  device: DeviceWithLocation;
  isSelected: boolean;
  onClick: () => void;
}

const DeviceMarker: React.FC<DeviceMarkerProps> = ({ device, isSelected, onClick }) => {
  if (!device.location) return null;

  const { latitude, longitude } = device.location;

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <Marker
      position={[latitude, longitude]}
      icon={createDeviceIcon(device.status, isSelected)}
      eventHandlers={{
        click: onClick,
      }}
    >
      <Popup>
        <div className="p-2 min-w-[200px]">
          <h3 className="font-semibold text-lg mb-2">{device.device_name}</h3>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <span className={`font-medium ${
                device.status === 'online' ? 'text-green-600' :
                device.status === 'idle' ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {device.status.toUpperCase()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Battery:</span>
              <span className="font-medium">{device.battery_level}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Last Seen:</span>
              <span className="font-medium">{formatTime(device.last_seen)}</span>
            </div>
            {device.location.speed !== undefined && (
              <div className="flex justify-between">
                <span className="text-gray-600">Speed:</span>
                <span className="font-medium">{device.location.speed.toFixed(1)} km/h</span>
              </div>
            )}
            {device.location.heading !== undefined && (
              <div className="flex justify-between">
                <span className="text-gray-600">Heading:</span>
                <span className="font-medium">{device.location.heading.toFixed(0)}°</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600">Coordinates:</span>
              <span className="font-medium text-xs">
                {latitude.toFixed(5)}, {longitude.toFixed(5)}
              </span>
            </div>
          </div>
        </div>
      </Popup>
    </Marker>
  );
};

interface MapControllerProps {
  center: [number, number] | null;
  zoom?: number;
}

const MapController: React.FC<MapControllerProps> = ({ center, zoom = 13 }) => {
  const map = useMap();

  useEffect(() => {
    if (center) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);

  return null;
};

interface LiveMapProps {
  devices: DeviceWithLocation[];
  selectedDeviceId: string | null;
  onDeviceSelect: (deviceId: string) => void;
  center?: [number, number];
}

const LiveMap: React.FC<LiveMapProps> = ({ 
  devices, 
  selectedDeviceId, 
  onDeviceSelect,
  center: initialCenter
}) => {
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);

  useEffect(() => {
    if (selectedDeviceId) {
      const device = devices.find(d => d.id === selectedDeviceId);
      if (device?.location) {
        setMapCenter([device.location.latitude, device.location.longitude]);
      }
    }
  }, [selectedDeviceId, devices]);

  // Default center: India (Chennai, Tamil Nadu)
  const defaultCenter: [number, number] = initialCenter || [
    parseFloat(import.meta.env.VITE_MAP_DEFAULT_LAT || '13.0827'),
    parseFloat(import.meta.env.VITE_MAP_DEFAULT_LNG || '80.2707')
  ];

  return (
    <MapContainer
      center={defaultCenter}
      zoom={12}
      style={{ height: '100%', width: '100%' }}
      className="rounded-lg"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {devices.map((device) => (
        <DeviceMarker
          key={device.id}
          device={device}
          isSelected={device.id === selectedDeviceId}
          onClick={() => onDeviceSelect(device.id)}
        />
      ))}

      <MapController center={mapCenter} />
    </MapContainer>
  );
};

export default LiveMap;
