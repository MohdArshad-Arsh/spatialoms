# Table: order_events

## Purpose
Stores order history and status changes.

## Primary Key
- id

## Columns

| Column | Type | Description |
|----------|----------|----------|
| id | bigint | Event identifier |
| order_id | bigint | Related order |
| client_name | varchar(255) | Client |
| vendor | varchar(255) | Vendor |
| status_old | varchar(255) | Previous status |
| status_new | varchar(255) | New status |
| priority | varchar(255) | Order priority |
| percentage_completed | double | Completion percentage |
| selected_sensor | varchar(255) | Selected sensor |
| total_price | double | Event cost |


## Example Records

| id | created_by | created_date | client_name | order_id | percentage_completed | priority | status_new | status_old | vendor | area_covered | extra_area_covered | price_per_km | remaining_area | selected_sensor | total_price |
|----|------------|--------------|-------------|----------|----------------------|----------|------------|------------|--------|--------------|-------------------|--------------|----------------|----------------|-------------|
| 10001 | oms | 2026-06-07 09:42:26 | ISRO | 6 | 0 | HIGH | CREATED | REQUESTED | Maxar | 1200 | 0 | 8.5 | 1200 | WorldView-3 | 10200 |
| 10002 | oms | 2026-06-07 10:15:40 | NASA | 7 | 25 | HIGH | PENDING | CREATED | Planet Labs | 2500 | 150 | 6.0 | 2350 | PlanetScope | 15000 |
| 10003 | oms | 2026-06-07 11:30:15 | ESA | 8 | 65 | MEDIUM | IN_PROGRESS | PENDING | Airbus | 1800 | 200 | 7.5 | 450 | Pleiades Neo | 15000 |
| 10004 | oms | 2026-06-07 13:05:20 | DRDO | 9 | 100 | HIGH | COMPLETED | IN_PROGRESS | BlackSky | 3500 | 300 | 9.0 | 0 | BlackSky Gen-2 | 34200 |
| 10005 | oms | 2026-06-07 15:20:55 | NRSC | 10 | 85 | MEDIUM | IN_PROGRESS | PENDING | SatSure | 2200 | 100 | 5.5 | 230 | Sentinel-2 | 12650 |

## Note
- `vendor` represents the imagery provider or processing partner.
- `selected_sensor` represents the satellite sensor selected for acquisition.
- `area_covered` is the total requested area in sq. km.
- `extra_area_covered` is additional acquired area beyond the requested boundary.
- `remaining_area` is the area still pending acquisition or processing.
- `price_per_km` is the acquisition/processing cost per sq. km.
- `total_price` is the overall order value.

## Example Questions

- Show order history
- Show status changes
- Show completed events
- Event count by vendor
- Latest order events