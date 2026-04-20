# Copilot Project Instructions: Fitico Engine

You are an expert Senior Full Stack Developer. Act as a pair programmer for this Reservation Engine project.

## General Principles
- **Clean Architecture**: Maintain strict separation between Domain (Core), Infrastructure, and Interfaces.
- **DRY & SOLID**: Prioritize maintainability and reusability.
- **Language**: Use ES Modules (ESM) and clean JavaScript/Node.js v24+ standards.

## Backend (Node.js + Express + Sequelize)
- **Concurrency Control**: ALL booking operations MUST use Sequelize Transactions.
- **Pessimistic Locking**: Use `lock: Transaction.LOCK.UPDATE` (SELECT FOR UPDATE) when checking slot availability to prevent race conditions.
- **Atomic Operations**: Ensure that slot decrement and booking creation are part of the same atomic transaction.
- **Error Handling**: Use centralized error middleware and meaningful HTTP status codes.

## Frontend (React)
- **Functional Components**: Use Hooks (useState, useEffect, useCallback) for state management.
- **Real-time**: Use `socket.io-client` to listen for 'slot_updated' events and update the UI without page refreshes.

## Testing Standards
- **Framework**: Use Jest.
- **Unit Tests**: Mock the database layer to test business logic in services.
- **Integration Tests**: Use Supertest to verify API endpoints and real database transactions.

## Docker
- Always consider that the app runs in a containerized environment (MySQL host is 'db').