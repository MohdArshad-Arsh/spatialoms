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

## Example Questions

- Show all vendors
- Which vendor handles order 5
- Vendor order count
- Show vendor details

