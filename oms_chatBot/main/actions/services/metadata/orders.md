# Table: order_tbl

## Purpose
Stores order information for EO imagery requests and processing workflows.

## Primary Key
- id

## Columns

| Column | Type | Description |
|----------|----------|----------|
| id | bigint | Unique order identifier |
| client_name | varchar(255) | Client requesting the order |
| comment | varchar(255) | Additional notes |
| order_type | varchar(255) | Type of order |
| po_id | varchar(255) | Purchase order reference |
| price | double | Order price |
| priority | varchar(255) | HIGH, MEDIUM, LOW |
| status | enum | CREATED, COMPLETED, PENDING, IN_PROGRESS, CANCELLED |
| organization | varchar(255) | Client organization |
| organization_type | varchar(255) | Government, University, Private |
| created_date | datetime | Creation timestamp |

## Example Records

| id | client_name | comment | order_type | po_id | price | priority | status | organization | organization_type | created_date |
|----|------------|----------|------------|--------|--------|----------|----------|--------------|------------------|--------------|
| 1001 | ISRO | Forest Monitoring | Satellite | PO1001 | 12000.00 | HIGH | COMPLETED | ISRO | Government | 2026-06-07 09:40:20 |
| 1002 | NASA | Flood Analysis | Satellite | PO1002 | 18000.00 | HIGH | IN_PROGRESS | NASA | Government | 2026-06-07 09:45:10 |
| 1003 | ESA | Urban Mapping | Satellite | PO1003 | 9000.00 | LOW | CREATED | ESA | Government | 2026-06-07 10:15:45 |
| 1004 | DRDO | Border Surveillance | Satellite | PO1004 | 25000.00 | HIGH | COMPLETED | DRDO | Government | 2026-06-07 11:05:30 |
| 1005 | IIT Delhi | AI Mapping | Satellite | PO1005 | 11000.00 | MEDIUM | IN_PROGRESS | IIT Delhi | University | 2026-06-07 12:20:15 |
| 1006 | Delhi Metro | Metro Expansion Planning | Satellite | PO1006 | 17000.00 | MEDIUM | PENDING | DMRC | PSU | 2026-06-07 14:10:50 |

### Notes

- `priority` values are typically: HIGH, MEDIUM, LOW.
- `status` values include: CREATED, COMPLETED, PENDING, IN_PROGRESS, CANCELLED.
- `organization_type` values include: Government, University, PSU, Private.
- `price` stores the monetary value of the order.
- `created_date` stores the order creation timestamp.
- If the user says "client 9090", filter using:
  client_name = '9090'
- Do not include the word "client" inside the SQL value.
- Do not add a client filter unless the current user question explicitly mentions a client.


## Business Terminology

Users may refer to:

- completed orders → status = COMPLETED
- pending orders → status = PENDING
- cancelled orders → status = CANCELLED
- in progress orders → status = IN_PROGRESS
- high priority orders → priority = HIGH
- medium priority orders → priority = MEDIUM
- low priority orders → priority = LOW
- government orders → organization_type = Government
- university orders → organization_type = University
- client 9090 → client - 9090


## Note

- TABLE NAME IS :- `order_tbl`

## Example Questions

- Show all orders
- Show completed orders
- Show high priority orders
- Count orders
- Average order price
- Orders for ISRO
- Orders for NASA
