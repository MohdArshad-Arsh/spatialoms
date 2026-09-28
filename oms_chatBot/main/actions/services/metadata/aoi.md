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


## Example Records

| order_id | created_by | created_date | file_original | file_path | name | percentage_completed | remaining_area | total_area |
|----------|------------|--------------|---------------|-----------|------|----------------------|----------------|------------|
| 6 | oms | 2026-06-07 09:42:15 | delhi_aoi.zip | /uploads/delhi_aoi.geojson | Delhi Urban Expansion AOI | 100 | 0 | 10000 |
| 7 | oms | 2026-06-07 09:42:15 | mumbai_flood.zip | /uploads/mumbai_flood.geojson | Mumbai Flood Assessment AOI | 60 | 4000 | 10000 |
| 8 | oms | 2026-06-07 09:42:15 | chennai_coastal.zip | /uploads/chennai_coastal.geojson | Chennai Coastal Monitoring AOI | 20 | 8000 | 10000 |
| 9 | oms | 2026-06-07 09:42:15 | kolkata_landuse.zip | /uploads/kolkata_landuse.geojson | Kolkata Land Use Mapping AOI | 100 | 0 | 10000 |
| 10 | oms | 2026-06-07 09:42:15 | lucknow_agriculture.zip | /uploads/lucknow_agriculture.geojson | Lucknow Crop Monitoring AOI | 10 | 9000 | 10000 |

# Note
- `order_id` links the AOI record to an order in the order management system.
- `file_original` is the uploaded AOI file provided by the client.
- `file_path` is the processed AOI file location in the system.
- `name` is a user-friendly AOI name.
- `percentage_completed` indicates acquisition/processing completion percentage.
- `remaining_area` is the area still pending acquisition or processing (sq. km).
- `total_area` is the total requested AOI area (sq. km).

## Example Questions

- Show AOI details
- Show AOI progress
- Average completion percentage
- Remaining area by order
- Fully completed AOIs