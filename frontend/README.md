# IoT Black Box - Frontend Dashboard

React + TypeScript frontend for the IoT Black Box System, providing real-time monitoring, device management, and event tracking for two-wheeler safety.

## 🚀 Tech Stack

- **Framework**: React 19.2 with TypeScript
- **Build Tool**: Vite 7.2
- **Routing**: React Router DOM
- **HTTP Client**: Axios
- **Styling**: TailwindCSS 3
- **Maps**: Leaflet + React Leaflet
- **Charts**: Chart.js + React Chart.js 2

## 📁 Project Structure

```
frontend/
├── public/                 # Static assets
├── src/
│   ├── assets/            # Images, icons
│   ├── components/        # Reusable UI components
│   ├── context/           # React Context for global state
│   ├── pages/             # Main page components
│   │   ├── Dashboard.tsx  # Dashboard overview
│   │   ├── Devices.tsx    # Device management
│   │   └── Events.tsx     # Event monitoring
│   ├── services/          # API service layer
│   │   └── api.ts         # Axios configuration & API calls
│   ├── utils/             # Helper functions
│   ├── App.tsx            # Main app component with routing
│   ├── main.tsx           # React app entry point
│   └── index.css          # Global styles with Tailwind
├── .env                   # Environment variables (local)
├── .env.example           # Environment variables template
├── package.json           # Dependencies
├── tailwind.config.js     # TailwindCSS configuration
├── tsconfig.json          # TypeScript configuration
└── vite.config.ts         # Vite configuration
```

## 🛠️ Setup Instructions

### Prerequisites
- Node.js 18+ and npm
- Backend API running on `http://localhost:3000`

### Installation

1. **Navigate to frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and update the API URL if needed:
   ```env
   VITE_API_BASE_URL=http://localhost:3000
   VITE_WS_URL=ws://localhost:3000
   VITE_MAP_DEFAULT_LAT=28.6139
   VITE_MAP_DEFAULT_LNG=77.2090
   VITE_MAP_DEFAULT_ZOOM=12
   ```

4. **Start development server**:
   ```bash
   npm run dev
   ```
   Open http://localhost:5173 in your browser.

## 📦 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build production bundle |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint for code quality |

## 🎨 Features

### Current Implementation
- ✅ **Sidebar Navigation**: Dashboard, Devices, Events pages
- ✅ **Dashboard Overview**: Stats cards, quick actions, activity feed
- ✅ **Device Management**: Grid view with status indicators
- ✅ **Event Monitoring**: Table view with filters and pagination
- ✅ **Responsive Design**: TailwindCSS for mobile-friendly UI
- ✅ **API Service Layer**: Axios client with interceptors

### Upcoming Features
- 🔄 **Live Tracking Map**: Leaflet integration for real-time device locations
- 🔄 **Real-Time Updates**: WebSocket for live telemetry streaming
- 🔄 **Charts & Graphs**: Sensor data visualization with Chart.js
- 🔄 **Authentication**: Login/logout with JWT token management
- 🔄 **Crash Forensics Viewer**: Detailed crash data with pre/post event playback
- 🔄 **Emergency Contacts**: CRUD interface for contact management
- 🔄 **DPDP Compliance Dashboard**: Consent management UI

## 🔌 API Integration

The app connects to the backend API running on `http://localhost:3000`. API service is configured in `src/services/api.ts`.

### Example API Usage:

```typescript
import { deviceApi, eventApi } from './services/api';

// Fetch all devices
const devices = await deviceApi.getAll();

// Fetch crash events with filters
const crashes = await eventApi.getCrashes({ 
  severity: 'CRITICAL', 
  startDate: '2024-11-01' 
});
```

## 🗺️ Map Integration (Coming Soon)

Leaflet map will display:
- Real-time device locations
- Crash/panic event markers
- Geofencing zones
- Route history playback

## 📊 Chart Integration (Coming Soon)

Chart.js visualizations for:
- Accelerometer data (X, Y, Z axes)
- Gyroscope readings
- Speed over time
- Event frequency trends

## 🔐 Authentication Flow (Coming Soon)

1. User logs in → JWT token stored in localStorage
2. Axios interceptor adds token to all API requests
3. 401 responses → Redirect to login page
4. Logout → Clear token from localStorage

## 🎯 Development Roadmap

### Phase 3.1: Live Tracking Map
- Integrate Leaflet map on Dashboard
- Display device locations with custom markers
- Click marker to view device details

### Phase 3.2: Real-Time Updates
- WebSocket connection to backend
- Live telemetry streaming
- Auto-refresh device status

### Phase 3.3: Charts & Visualization
- Chart.js integration
- Sensor data graphs
- Event frequency charts

### Phase 3.4: Authentication
- Login/register pages
- JWT token management
- Protected routes

### Phase 3.5: Advanced Features
- Crash forensics viewer
- Emergency contact management
- DPDP consent dashboard

## 🐛 Troubleshooting

### Issue: "Cannot connect to backend API"
**Solution**: Ensure backend is running on `http://localhost:3000` and `.env` has correct `VITE_API_BASE_URL`.

### Issue: "Leaflet map not displaying"
**Solution**: Import Leaflet CSS in `index.css`:
```css
@import 'leaflet/dist/leaflet.css';
```

### Issue: "Chart.js not rendering"
**Solution**: Install Chart.js adapter for React:
```bash
npm install react-chartjs-2 chart.js
```

## 📚 Resources

- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [TailwindCSS Documentation](https://tailwindcss.com/)
- [Leaflet Documentation](https://leafletjs.com/)
- [Chart.js Documentation](https://www.chartjs.org/)
- [React Router Documentation](https://reactrouter.com/)

## 🤝 Contributing

1. Follow TypeScript best practices
2. Use TailwindCSS for styling (no custom CSS unless necessary)
3. Create reusable components in `src/components/`
4. Add API calls to `src/services/api.ts`
5. Test on multiple screen sizes (mobile, tablet, desktop)

## 📝 License

MIT License - See LICENSE file for details

---

**Developer**: Pandidharan  
**Repository**: https://github.com/Pandidharan22/IoT-Black-Box-For-Two-Wheelers  
**Backend API**: Refer to root README.md for backend setup

