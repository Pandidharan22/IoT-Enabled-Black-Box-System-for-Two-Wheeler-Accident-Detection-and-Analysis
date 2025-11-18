# Live Device Map Testing Guide

## Features Implemented

### 1. Real-time Device Tracking Map
- **Leaflet** map centered on India (Delhi: 28.6139°N, 77.2090°E)
- **Device markers** with color-coded status:
  - 🟢 **Green**: Online devices
  - 🟡 **Yellow**: Idle devices
  - 🔴 **Red**: Offline/error devices
- **Auto-refresh**: Map updates every 5 seconds with new device data
- **Interactive popups**: Click any marker to see device details

### 2. Device List Sidebar
- **Real-time device list** showing all registered devices
- **Status indicator**: Animated pulse for online devices
- **Click to center**: Click any device in the list to center map on that device
- **Grouped display**: Online devices listed separately from offline/idle
- **Device info**: Battery level, last seen timestamp, current speed

### 3. Dashboard Integration
- **Live stats**: Total devices, online count, events, alerts
- **Loading states**: Spinner while fetching data
- **Error handling**: Graceful fallback to mock data if backend is unavailable
- **Last updated**: Timestamp showing when data was last refreshed
- **Responsive layout**: Works on desktop and mobile devices

## Testing Instructions

### Test 1: Initial Map Load
1. Open browser to `http://localhost:5173/`
2. **Expected**: Loading spinner appears while fetching devices
3. **Expected**: Map loads with 3 mock devices (Alpha, Beta, Gamma) in Chennai area
4. **Expected**: Device sidebar shows all 3 devices grouped by status

### Test 2: Device Marker Interaction
1. Click on the **green marker** (Vehicle Alpha - online)
2. **Expected**: Popup shows:
   - Device name: "Vehicle Alpha"
   - Status: ONLINE (green)
   - Battery: 87%
   - Speed: 45.5 km/h
   - Heading: 135°
   - Last seen: "5m ago"
   - GPS coordinates

3. Click on the **yellow marker** (Vehicle Beta - idle)
4. **Expected**: Popup shows idle status, 0 km/h speed, "30m ago"

5. Click on the **red marker** (Vehicle Gamma - offline)
6. **Expected**: Popup shows offline status, low battery (45%), "2h ago"

### Test 3: Device List Sidebar Interaction
1. In the sidebar, click on **"Vehicle Beta"**
2. **Expected**: 
   - Map centers on Vehicle Beta's location
   - Marker gets highlighted with blue pulsing ring
   - Marker size increases slightly
3. Click on **"Vehicle Alpha"** in sidebar
4. **Expected**: Map smoothly pans to Vehicle Alpha

### Test 4: Live Polling (5-second updates)
1. Keep the dashboard open
2. Watch the "Last updated" timestamp in top-right
3. **Expected**: Timestamp updates every 5 seconds
4. Open browser console (F12)
5. **Expected**: Console shows "Failed to fetch devices" every 5 seconds (normal - backend not running)
6. **Expected**: Map continues to show mock data without errors

### Test 5: Responsive Design
1. Resize browser window to mobile size (< 640px)
2. **Expected**: 
   - Device sidebar stacks above map
   - Stats cards stack vertically
   - All elements remain accessible

### Test 6: Empty State (No Devices)
1. Temporarily modify `Dashboard.tsx` line 115 to return empty array: `const mockDevices: DeviceWithLocation[] = [];`
2. Refresh page
3. **Expected**: Shows "No devices registered yet" message
4. **Expected**: "Register your first device →" link appears
5. **Undo the change after testing**

### Test 7: Loading State
1. Add `setTimeout(() => setLoading(false), 3000);` before line 128 in `Dashboard.tsx`
2. Refresh page
3. **Expected**: Loading spinner shows for 3 seconds
4. **Expected**: Message: "Loading devices and locations..."
5. **Undo the change after testing**

## Backend Integration Testing

### Prerequisites
- Backend server must be running on `http://localhost:3000`
- PostgreSQL database must have devices table populated
- InfluxDB must have telemetry data

### Test 8: Real Backend Data
1. Start backend: `cd backend && npm run dev`
2. Ensure database has devices: `SELECT * FROM devices;`
3. Refresh frontend dashboard
4. **Expected**: Yellow warning disappears
5. **Expected**: Map shows actual registered devices
6. **Expected**: Device locations come from InfluxDB telemetry data

### Test 9: Adding New Device (Real-time Update)
1. Register a new device via backend API:
   ```bash
   curl -X POST http://localhost:3000/api/devices \
     -H "Content-Type: application/json" \
     -d '{
       "device_id": "TEST001",
       "device_name": "Test Vehicle",
       "firmware_version": "1.0.0",
       "user_id": "USER_UUID_HERE"
     }'
   ```
2. Send telemetry data:
   ```bash
   curl -X POST http://localhost:3000/api/telemetry \
     -H "Content-Type: application/json" \
     -d '{
       "deviceId": "DEVICE_UUID_HERE",
       "latitude": 28.5355,
       "longitude": 77.3910,
       "speed": 60,
       "batteryLevel": 95
     }'
   ```
3. Wait up to 5 seconds
4. **Expected**: New device appears on map
5. **Expected**: New device appears in sidebar

### Test 10: Device Status Changes
1. Stop sending telemetry for a device (simulate offline)
2. In database, update device status: `UPDATE devices SET status='offline' WHERE device_id='XYZ123';`
3. Wait 5 seconds for next poll
4. **Expected**: Marker changes from green to red
5. **Expected**: Sidebar moves device to "Offline / Idle" section

### Test 11: Location Updates (Simulated Movement)
1. Update device location in InfluxDB by sending new telemetry:
   ```bash
   curl -X POST http://localhost:3000/api/telemetry \
     -H "Content-Type: application/json" \
     -d '{
       "deviceId": "DEVICE_UUID",
       "latitude": 28.6200,
       "longitude": 77.2250,
       "speed": 75
     }'
   ```
2. Wait 5 seconds
3. **Expected**: Marker moves to new position on map
4. **Expected**: Speed updates in popup
5. **Expected**: "Last seen" timestamp updates

## Performance Testing

### Test 12: Many Devices
1. Add 20+ mock devices to test performance
2. **Expected**: Map renders all markers smoothly
3. **Expected**: Sidebar scrolls properly
4. **Expected**: No lag when clicking devices
5. **Expected**: 5-second polling continues without issues

### Test 13: Network Error Handling
1. Stop backend server
2. Refresh dashboard
3. **Expected**: Yellow warning: "Failed to load devices. Using mock data for demo."
4. **Expected**: Mock data still displays
5. **Expected**: No console errors or crashes
6. **Expected**: Polling continues (console shows errors but app works)

## Known Limitations

1. **Backend devices API**: Not implemented yet - frontend uses mock data fallback
2. **WebSocket**: Not implemented - using 5-second polling instead
3. **Authentication**: Auth middleware not bypassed - API calls may fail with 401
4. **Device registration**: No UI for adding devices - must use backend API directly

## Mock Data Details

The frontend includes 3 mock devices for testing in Chennai, Tamil Nadu:

| Device | Status | Location | Battery | Speed | Last Seen |
|--------|--------|----------|---------|-------|-----------|
| Vehicle Alpha (XYZ123) | Online | 13.0827, 80.2707 (T Nagar) | 87% | 45.5 km/h | 5 min ago |
| Vehicle Beta (ABC789) | Idle | 13.0475, 80.2570 (Adyar) | 92% | 0 km/h | 30 min ago |
| Vehicle Gamma (DEF456) | Offline | 13.1189, 80.2072 (Anna Nagar) | 45% | 0 km/h | 2 hours ago |

## Next Steps (After Testing)

1. **Implement backend `/api/devices` endpoint** to return real device data
2. **Add WebSocket support** for instant updates (replace polling)
3. **Implement device registration UI** on Devices page
4. **Add authentication** and bypass middleware for development
5. **Add map controls**: Zoom to fit all devices, filter by status, search
6. **Add device trails**: Show historical path on map
7. **Add geofencing**: Define safe zones and alert when device leaves

## Troubleshooting

### Map Not Showing
- Check browser console for Leaflet errors
- Verify `leaflet` CSS is loaded: inspect network tab
- Try clearing browser cache: Ctrl+Shift+Delete

### Markers Not Appearing
- Check if devices array has location data
- Verify latitude/longitude are valid numbers
- Check browser console for component errors

### Polling Not Working
- Check browser console for API errors
- Verify `setInterval` is not cleared
- Check if component unmounted during fetch

### Device Selection Not Working
- Check if `selectedDeviceId` state updates
- Verify `MapController` component receives new center
- Check for React key warnings in console
