# Table: sensor_tbl

## Purpose
Stores sensors offered by vendors.

## Primary Key
- id

## Foreign Key
- vendor_id → vendor_tbl.id

## Columns

| Column | Type | Description |
|----------|----------|----------|
| id | bigint | Sensor identifier |
| name | varchar(255) | Sensor name |
| vendor_id | bigint | Vendor owning sensor |


## Example Records

| id | created_by | created_date | name | vendor_id |
|----|------------|--------------|------|-----------|
| 2001 | oms | 2026-06-07 09:42:04 | WorldView-3 | 1001 |
| 2002 | oms | 2026-06-07 09:42:04 | WorldView-4 | 1001 |
| 2003 | oms | 2026-06-07 09:42:04 | PlanetScope | 1002 |
| 2005 | oms | 2026-06-07 09:42:04 | Pleiades | 1003 |
| 2007 | oms | 2026-06-07 09:42:04 | BlackSky Gen2 | 1004 |

## Note
- `id` is the unique sensor identifier.
- `name` is the sensor or satellite payload name.
- `vendor_id` links the sensor to a vendor record.
- A vendor can provide multiple sensors.
- Sensors are used for EO imagery acquisition and processing workflows.

## Example Questions

- Show all sensors
- Sensors for Maxar
- Sensors for Airbus
- Count sensors
- Sensor details
