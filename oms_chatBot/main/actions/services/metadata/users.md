# Table: users

## Purpose
Stores application users.

## Primary Key
- id

## Columns

| Column | Type | Description |
|----------|----------|----------|
| id | bigint | User identifier |
| username | varchar(255) | Login username |
| password | varchar(255) | Encrypted password |
| role | enum | MANAGER or OPERATOR |


## Example Records

| id | username | role |
|----|----------|----------|
| 1 | oms | MANAGER |
| 2 | admin | MANAGER |
| 3 | asisa | OPERATOR |
| 4 | analyst1 | ANALYST |
| 5 | vendor_user | VENDOR |

## Note
- `id` is the unique user identifier.
- `username` is the login username.
- `password` stores the encrypted password hash.
- `role` defines the user's system permissions.

## Example Questions

- Show all users
- Count users
- Show managers
- Show operators
- Find user by username