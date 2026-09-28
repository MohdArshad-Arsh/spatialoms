# Table: vendor_tbl

## Purpose
Stores vendors assigned to orders.

## Primary Key
- id

## Foreign Keys
- order_id → order_tbl.id

## Columns

| Column | Type | Description |
|----------|----------|----------|
| id | bigint | Vendor identifier |
| name | varchar(255) | Vendor name |
| order_id | bigint | Related order |


## Example Records

| id | name | order_id |
|----|------|----------|
| 1001 | Maxar | 6 |
| 1002 | Planet Labs | 7 |
| 1003 | Airbus | 8 |
| 1004 | BlackSky | 9 |
| 1005 | SatSure | 10 |


## Note
- `id` is the unique vendor identifier.
- `name` is the vendor or imagery provider name.
- `order_id` links the vendor to an order.
- A vendor can be associated with multiple orders.
- Vendors provide satellite imagery acquisition and processing services.

## Example Questions

- Show all vendors
- Which vendor handles order 5
- Vendor order count
- Show vendor details

