# IoT Black Box for Two Wheelers 🏍️

An advanced IoT-based black box system designed for two-wheelers, providing real-time telemetry, location tracking, and accident detection.

## 🚀 Features

- **Real-time Telemetry Monitoring**
  - GPS Location Tracking
  - Speed Monitoring
  - Acceleration & Gyroscopic Data
  - Battery Level Monitoring
  - Heading Information

- **Data Management**
  - Secure Data Storage using InfluxDB
  - Historical Data Analysis
  - Real-time Data Streaming
  - Location History Tracking

- **Security**
  - JWT-based Authentication
  - Rate Limiting Protection
  - TLS Encryption Support
  - CORS Protection

## 🛠️ Tech Stack

- **Backend**
  - Node.js + TypeScript
  - Express.js
  - MQTT Protocol (HiveMQ Cloud)
  - InfluxDB (Time-series Database for Telemetry)
  - PostgreSQL (Structured Data & User Management)
  - Winston Logger

### System Architecture

The system uses a multi-database approach for optimal performance:

1. **PostgreSQL**: Manages structured business data
   - User management and authentication
   - Device registration and event tracking
   - DPDP compliance data (consents, retention policies)
   - Uses UUID for primary keys enabling distributed scalability
   - Implements automated timestamps via triggers
   - Optimized indexing for emergency response queries

2. **InfluxDB**: Handles high-frequency time-series data
   - Real-time telemetry data (GPS, speed, acceleration)
   - Optimized for time-based queries and aggregations
   - Built-in data retention policies

2. **PostgreSQL**: Manages structured business data
   - User management and authentication
   - Device registration and status
   - Critical events (crashes, panic alerts)
   - DPDP compliance data

3. **MQTT**: Real-time communication
   - QoS 2 for critical events (crashes, panic)
   - QoS 1 for telemetry data
   - TLS encryption for security

- **Authentication & Security**
  - JWT Tokens
  - Zod Validation
  - TLS/SSL Encryption

## 🔧 Installation & Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/Pandidharan22/IoT-Black-Box-For-Two-Wheelers.git
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up PostgreSQL:
   - Create database: `iot_black_box_dev`
   - Create application user: `iot_user`
   - Run schema migrations from `backend/src/database/schema.sql`
   - Verify setup using provided test script

4. Configure environment variables:
   - Copy `.env.example` to `.env`
   - Update database credentials and other configurations

5. Verify setup:
   ```bash
   npm run test:db
   ```

6. Start the development server:
   ```bash
   npm run dev
   ```

## 📝 Environment Variables

Required environment variables:

```env
# Server Configuration
NODE_ENV=development
PORT=3000
API_VERSION=v1

# JWT Configuration
JWT_SECRET=<your-secret-key>
JWT_EXPIRES_IN=24h

# MQTT Configuration
MQTT_BROKER_URL=<mqtt-broker-url>
MQTT_USERNAME=<mqtt-username>
MQTT_PASSWORD=<mqtt-password>
MQTT_CLIENT_ID=<mqtt-client-id>
MQTT_TLS_ENABLED=true/false

# Database Configuration
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=<database-name>
POSTGRES_USER=<database-user>
POSTGRES_PASSWORD=<database-password>

# InfluxDB Configuration
INFLUXDB_URL=<influxdb-url>
INFLUXDB_TOKEN=<your-token>
INFLUXDB_ORG=<your-org>
INFLUXDB_BUCKET=<your-bucket>
```

## 🌐 API Documentation

### Telemetry Endpoints

- **POST** `/api/v1/telemetry`
  - Store telemetry data
  - Requires authentication
  - Rate limited

- **GET** `/api/v1/telemetry/:deviceId`
  - Get device telemetry data
  - Query parameters: startTime, endTime
  - Requires authentication

- **GET** `/api/v1/telemetry/:deviceId/location`
  - Get device's last known location
  - Requires authentication

## 🧪 Testing

Run tests using:
```bash
npm test
```

## 📦 Project Structure

```
.
├── src/
│   ├── config/         # Configuration files
│   ├── controllers/    # Request handlers
│   ├── middleware/     # Express middleware
│   ├── models/         # Database models
│   ├── routes/         # API routes
│   ├── services/       # Business logic
│   ├── types/          # TypeScript types
│   └── utils/          # Utility functions
├── test/              # Test files
└── docs/             # Documentation
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/AmazingFeature`
3. Commit your changes: `git commit -m 'Add some AmazingFeature'`
4. Push to the branch: `git push origin feature/AmazingFeature`
5. Open a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ✨ Authors

- **Pandidharan** - [GitHub Profile](https://github.com/Pandidharan22)

---
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