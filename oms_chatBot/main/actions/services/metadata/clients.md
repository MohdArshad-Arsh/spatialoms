# Table: client_tbl

## Purpose
Stores client information.

## Primary Key
- id

## Columns

| Column | Type | Description |
|----------|----------|----------|
| id | bigint | Client identifier |
| client_name | varchar(255) | Client name |


## Example Client Records

| id | client_name |
|----|------------|
| 1 | gyufytfyt |
| 2 | slfjd |
| 3 | ISRO |
| 4 | NASA |
| 5 | ESA |

### Notes

- Users may search using client names directly.
- Client names are case-insensitive.
- Example queries:
  - Show orders for ISRO
  - Show completed orders for NASA
  - Count orders for DRDO
  - Show high priority orders for IIT Delhi
  - Show pending orders for Delhi Metro

## Example Questions
- List all clients
- Count clients
- Show client details
- Find client ISRO
- Find client NASA