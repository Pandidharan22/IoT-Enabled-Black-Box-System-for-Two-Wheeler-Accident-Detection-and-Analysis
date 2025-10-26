import { connect, AsyncMqttClient } from 'async-mqtt';
import fs from 'fs';
import { EventEmitter } from 'events';
import config from '../config';
import { createLogger } from '../utils/logger';

const logger = createLogger('MQTTClient');

export enum MessageType {
  TELEMETRY = 'telemetry',
  CRASH = 'crash',
  PANIC = 'panic'
}

interface MQTTOptions {
  clientId: string;
  username: string;
  password: string;
  clean: boolean;
  rejectUnauthorized: boolean;
  port: number;
  protocol?: 'mqtt' | 'mqtts' | 'ws' | 'wss';
  connectTimeout: number;
  reconnectPeriod: number;
  secureProtocol?: string;
}

class MQTTClient extends EventEmitter {
  private client: AsyncMqttClient | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private readonly topics = {
    telemetry: 'v1/+/telemetry',
    crash: 'v1/+/events/crash',
    panic: 'v1/+/events/panic'
  };

  async connect(): Promise<void> {
    try {
      const options: MQTTOptions & { rejectUnauthorized: boolean } = {
        clientId: config.MQTT_CLIENT_ID,
        username: config.MQTT_USERNAME,
        password: config.MQTT_PASSWORD,
        clean: true,
        rejectUnauthorized: true,
        port: config.MQTT_PORT,
        connectTimeout: 5000,
        reconnectPeriod: 5000,
        // Required for TLS
        protocol: 'mqtts',
        secureProtocol: 'TLSv1_2_method'
      };

      this.client = await connect(config.MQTT_BROKER_URL, options);

      logger.info('Connected to MQTT broker');

      // Set up event handlers
      this.client.on('connect', this.handleConnect.bind(this));
      this.client.on('error', this.handleError.bind(this));
      this.client.on('close', this.handleClose.bind(this));
      this.client.on('message', this.handleMessage.bind(this));

      // Subscribe to topics with appropriate QoS levels
      await this.subscribeToTopics();
    } catch (error) {
      logger.error('Failed to connect to MQTT broker:', error);
      this.scheduleReconnect();
    }
  }

  private async subscribeToTopics(): Promise<void> {
    if (!this.client) return;

    try {
      // QoS 0 for regular telemetry
      await this.client.subscribe(this.topics.telemetry, { qos: 0 });
      
      // QoS 2 for critical events (crash and panic)
      await this.client.subscribe(this.topics.crash, { qos: 2 });
      await this.client.subscribe(this.topics.panic, { qos: 2 });
      
      logger.info('Subscribed to all topics');
    } catch (error) {
      logger.error('Failed to subscribe to topics:', error);
      throw error;
    }
  }

  private handleConnect(): void {
    logger.info('MQTT client connected');
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private handleError(error: Error): void {
    logger.error('MQTT client error:', error);
  }

  private handleClose(): void {
    logger.warn('MQTT client disconnected');
    this.scheduleReconnect();
  }

  private async handleMessage(topic: string, payload: Buffer): Promise<void> {
    try {
      // Parse device ID from topic
      const topicParts = topic.split('/');
      const deviceId = topicParts[1];
      const messageType = this.getMessageType(topic);

      // Parse message payload
      const message = JSON.parse(payload.toString());

      // Add metadata
      const enrichedMessage = {
        ...message,
        deviceId,
        timestamp: new Date(),
        topic
      };

      // Emit event based on message type
      this.emit(messageType, enrichedMessage);

      logger.debug(`Received ${messageType} message from device ${deviceId}`);
    } catch (error) {
      logger.error('Error processing message:', error);
    }
  }

  private getMessageType(topic: string): MessageType {
    if (topic.endsWith('/telemetry')) return MessageType.TELEMETRY;
    if (topic.includes('/events/crash')) return MessageType.CRASH;
    if (topic.includes('/events/panic')) return MessageType.PANIC;
    throw new Error(`Unknown topic pattern: ${topic}`);
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;

    this.reconnectTimer = setTimeout(() => {
      logger.info('Attempting to reconnect...');
      this.connect();
    }, 5000); // Reconnect after 5 seconds
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.end();
      this.client = null;
    }
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
}

// Export singleton instance
export const mqttClient = new MQTTClient();
export default mqttClient;