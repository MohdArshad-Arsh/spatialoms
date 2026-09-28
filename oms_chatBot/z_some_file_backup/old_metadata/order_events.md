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

## Example Questions

- Show order history
- Show status changes
- Show completed events
- Event count by vendor
- Latest order events