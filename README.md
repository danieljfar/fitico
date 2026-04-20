# Fitico

Prueba técnica de reservas con arquitectura moderna, Node.js v24.x, MySQL y una interfaz React para demostrar autenticación, transacciones y actualización en tiempo real.

## Arquitectura
El repo usa un monolito modular en backend y una SPA ligera en frontend.

* `backend/`: API en Node.js ESM con Express, Sequelize, JWT, Socket.IO, Redis y MySQL.
* `frontend/`: UI en React con Vite para reservar cupos y ver cambios en vivo.
* `docker-compose.yml`: orquesta MySQL, Redis, backend y frontend para levantar la demo local.

## Librerías destacadas
Estas son las librerías de la lista que tienen código propio en el proyecto:

* `express`: API HTTP y rutas.
* `sequelize`: modelo relacional, transacciones y locks de fila.
* `jsonwebtoken`: autenticación JWT.
* `socket.io`: eventos `slot_updated` en tiempo real.
* `moment`: formateo de horarios y semillas de demo.
* `ioredis`: cache de instructores en backend con invalidación por mutaciones.
* `react`: UI principal.
* `react-dom`: render del frontend.
* `socket.io-client`: suscripción a eventos realtime.
* `react-hot-toast`: feedback UX.
* `react-icons`: iconografía de la interfaz.
* `react-bootstrap` y `bootstrap`: layout y componentes.

## Funcionalidad
* Registro e inicio de sesión con JWT.
* Listado de cupos con capacidad y disponibilidad.
* Cache Redis para `GET /api/admin/instructors`.
* Invalidación de cache de instructores al crear, actualizar o eliminar instructor.
* Reserva y cancelación atómica con transacción de base de datos.
* Bloqueo pesimista para evitar sobreventa.
* Actualización en tiempo real cuando cambia la ocupación.

## Requisitos
* Node.js v24.x LTS o v25 current.
* Docker y Docker Compose.
* MySQL disponible vía Docker o local.
* Redis disponible vía Docker o local.

## Variables de entorno
Copia los archivos de ejemplo y ajusta valores si es necesario.

* [`.env.example`](.env.example)
* [`backend/.env.example`](backend/.env.example)
* [`frontend/.env.example`](frontend/.env.example)

## Ejecutar localmente
Backend:

```bash
cd backend
npm install
npm start
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Docker:

```bash
docker compose up -d --build
```

La UI queda en `http://localhost:5173` y la API en `http://localhost:4000`.

## API
* `GET /health`
* `POST /api/auth/register`
* `POST /api/auth/login`
* `GET /api/classes`
* `POST /api/reservations`
* `DELETE /api/reservations/:id`

## Presentación
La demo local muestra un dashboard con cupos semilla, login/register, reserva/cancelación y refresco realtime sin recargar la página.