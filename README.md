# Nest Orders Service

A backend service built with [NestJS](https://nestjs.com/) for managing orders in an e-commerce or order processing system.  
It uses PostgreSQL as the database and TypeORM as the ORM, with validation, Swagger API docs, and TypeScript.

---

## Tech Stack

- **Framework:** NestJS 10 (`@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express`)
- **Language:** TypeScript
- **Database:** PostgreSQL (`pg`)
- **ORM:** TypeORM (`@nestjs/typeorm`, `typeorm`)
- **Validation & Transformation:** `class-validator`, `class-transformer`
- **Docs:** `@nestjs/swagger`, `swagger-ui-express`
- **Scheduling (optional jobs):** `@nestjs/schedule`
- **Config:** `dotenv`

---

## Getting Started

### 1. Prerequisites

- Node.js (v18+ recommended)
- npm or yarn
- PostgreSQL running locally or accessible via network

### 2. Clone and Install

```bash
git clone <your-repo-url> nest-orders
cd nest-orders
npm install
# or: yarn
