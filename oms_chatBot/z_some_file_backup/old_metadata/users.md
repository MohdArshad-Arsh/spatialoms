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

## Example Questions

- Show all users
- Count users
- Show managers
- Show operators
- Find user by username