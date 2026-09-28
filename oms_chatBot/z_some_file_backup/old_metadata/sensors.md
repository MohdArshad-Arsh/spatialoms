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

## Example Questions

- Show all sensors
- Sensors for Maxar
- Sensors for Airbus
- Count sensors
- Sensor details
