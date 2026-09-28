# Table: aoi_tbl

## Purpose
Stores Area Of Interest information for an order.

## Primary Key
- order_id

## Foreign Key
- order_id → order_tbl.id

## Columns

| Column | Type | Description |
|----------|----------|----------|
| order_id | bigint | Related order |
| name | varchar(255) | AOI name |
| file_original | varchar(255) | Original uploaded file |
| file_path | varchar(255) | Stored file path |
| percentage_completed | double | Completion percentage |
| remaining_area | double | Remaining area |
| total_area | double | Total area |

## Example Questions

- Show AOI details
- Show AOI progress
- Average completion percentage
- Remaining area by order
- Fully completed AOIs