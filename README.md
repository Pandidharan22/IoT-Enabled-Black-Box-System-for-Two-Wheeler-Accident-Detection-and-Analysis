# IoT Black Box System for Two-Wheelers

A cloud-based IoT system for motorcycle accident detection, analysis, and emergency response, following AIS-140 guidelines and DPDP compliance.

## Project Overview

This system provides a comprehensive solution for:
- Real-time GPS tracking and telemetry collection
- Automatic crash detection and emergency alerts
- Trip history and forensics analysis
- Over-the-air (OTA) firmware updates
- DPDP-compliant data governance

### Architecture

The system consists of three main components:

1. **Edge Device (ESP32-based)**
   - GPS/GNSS tracking
   - IMU-based crash detection
   - MQTT telemetry publishing
   - OTA firmware updates

2. **Backend Server (Node.js)**
   - MQTT broker integration
   - Real-time data processing
   - REST API for dashboard
   - Device management
   - Data storage (PostgreSQL + InfluxDB)

3. **Web Dashboard (React)**
   - Live tracking interface
   - Trip history playback
   - Crash event analysis
   - Device management
   - User management

## Backend Server

This repository contains the backend server implementation.

### Technologies Used

- Node.js & TypeScript
- Express.js
- MQTT (HiveMQ Cloud)
- PostgreSQL (User/Device management)
- InfluxDB (Time-series telemetry)
- JWT Authentication
- Winston Logger

### Prerequisites

- Node.js >= 18.0.0
- PostgreSQL
- InfluxDB
- MQTT Broker (HiveMQ Cloud account)

### Setup Instructions

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/iot-black-box-backend.git
   cd iot-black-box-backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your configuration settings.

4. Start development server:
   ```bash
   npm run dev
   ```

5. Build for production:
   ```bash
   npm run build
   npm start
   ```

### API Documentation

#### Authentication
- POST `/api/v1/auth/register` - Register new user
- POST `/api/v1/auth/login` - User login
- POST `/api/v1/auth/refresh` - Refresh access token

#### Devices
- GET `/api/v1/devices` - List all devices
- POST `/api/v1/devices` - Register new device
- GET `/api/v1/devices/:id` - Get device details
- PUT `/api/v1/devices/:id` - Update device
- DELETE `/api/v1/devices/:id` - Delete device

#### Telemetry
- GET `/api/v1/telemetry/:deviceId` - Get device telemetry
- GET `/api/v1/telemetry/:deviceId/latest` - Get latest location
- GET `/api/v1/telemetry/:deviceId/trips` - Get trip history

#### Events
- GET `/api/v1/events` - List all events
- GET `/api/v1/events/:id` - Get event details
- POST `/api/v1/events/:id/acknowledge` - Acknowledge event

### Project Structure

```
src/
├── api/            # API routes and controllers
├── config/         # Configuration management
├── models/         # Database models
├── mqtt/           # MQTT client and handlers
├── services/       # Business logic
├── middleware/     # Express middleware
├── utils/          # Helper functions
└── types/          # TypeScript type definitions
```

### Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### License

This project is licensed under the MIT License - see the LICENSE file for details.

### Acknowledgments

- AIS-140 Standard Documentation
- DPDP Act 2023
- HiveMQ MQTT Documentation
- ESP-IDF Documentation