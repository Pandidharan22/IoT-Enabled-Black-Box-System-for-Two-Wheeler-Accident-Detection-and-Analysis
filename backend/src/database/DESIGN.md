# Database Design Decisions

## Implementation Notes

### Connection Management
- Implemented connection pooling with configurable limits
- Used dedicated database user (`iot_user`) for application access
- Disabled SSL for local development (can be enabled for production)
- Connection timeout set to 2000ms for quick failure detection
- Pool size limited to 20 connections to prevent resource exhaustion

## Key Technical Decisions

1. UUID as Primary Keys
   - Reason: Better for distributed systems and future scalability
   - Benefit: Prevents sequential ID guessing in APIs
   - Impact: Slightly larger storage but better security and scalability

2. JSONB for Complex Data
   - Use Case: Storing sensor data arrays (accelerometer, gyroscope)
   - Advantage: Flexible schema for varying data points
   - Performance: Indexed JSON querying capabilities

3. TIMESTAMPTZ Over TIMESTAMP
   - Rationale: Proper timezone handling for global deployment
   - Impact: Consistent time representation across regions
   - Critical for: Emergency response timing, event correlation

4. Enum Types
   - Purpose: Enforce data consistency
   - Types: device_status, event_severity, consent_type, panic_trigger
   - Benefit: Database-level validation, better query performance

5. Automated Timestamps
   - Implementation: Trigger-based updated_at
   - Scope: All relevant tables
   - Purpose: Audit trail and data freshness tracking

## Performance Considerations

1. Indexing Strategy
   - Primary Keys: UUID for scalability
   - Foreign Keys: Standard btree indexes
   - Lookup Fields: device_id, user_id for fast joins

2. Data Types
   - DECIMAL(10,8) for latitude
   - DECIMAL(11,8) for longitude
   - Precise enough for ~1mm accuracy

3. Partitioning Options (Future)
   - crash_events: Range partitioning by date
   - panic_events: Range partitioning by date
   - Improves query performance for date-based searches

## Security Features

1. Referential Integrity
   - ON DELETE CASCADE where appropriate
   - Prevents orphaned records
   - Maintains data consistency

2. DPDP Compliance
   - Consent tracking
   - Data retention policies
   - Audit capabilities

## Optimization Notes

1. Complex Queries
   - Index emergency_contacts for notification lookup
   - Index crash_events for timeline analysis
   - Consider materialized views for analytics

2. Maintenance
   - Regular VACUUM for UUID tables
   - Monitor index usage
   - Archive old data based on retention policy