# MERN Multi-Level Category API
This repository contains a suggested MERN-stack **(TypeScript)** implementation for the assessment.

## Features
- JWT Auth (register + login)
- Categories with nested structure (parent references)
- Get categories as tree
- Create / Update / Delete category
- Delete reassigns immediate children to deleted category's parent
- Marking inactive cascades to subcategories (uses MongoDB $graphLookup)
- Jest tests with MongoMemoryServer

## Setup
1. copy `.env.example` to `.env` and set values
2. Install:
   npm install
3. Run in dev:
   npm run dev
4. Build & run:
   npm run build
   npm start

## Tests
`npm test`

## Notes & performance
- Indexes on `parent`, `status`, `name` to optimize lookups.
- Cascading status update uses `$graphLookup` + `updateMany` for bulk efficiency.
- `GET /api/category` fetches all categories into memory then builds tree. For very large data sets, consider server-side pagination + incremental loads or recursive aggregation with `$graphLookup` followed by tree-building, or a materialized path pattern.

## API
- `POST /api/auth/register` { email, password } -> token
- `POST /api/auth/login` { email, password } -> token
- All category routes require `Authorization: Bearer <token>`
- `POST /api/category` { name, parent? } -> create
- `GET /api/category` -> tree structure
- `PUT /api/category/:id` { name?, parent?, status? } -> update (status inactive cascades)
- `DELETE /api/category/:id` -> reassign children to parent, delete
