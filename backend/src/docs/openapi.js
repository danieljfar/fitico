const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Fitness Flow API',
    version: '1.0.0',
    description: 'Reservation engine API with JWT auth, classes, and bookings.',
  },
  servers: [{ url: 'http://localhost:4000', description: 'Local development server' }],
  tags: [{ name: 'Health' }, { name: 'Auth' }, { name: 'Classes' }, { name: 'Bookings' }, { name: 'Admin' }],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: {
      ErrorResponse: {
        type: 'object',
        properties: {
          error: {
            type: 'object',
            properties: {
              message: { type: 'string' },
              statusCode: { type: 'integer' },
            },
          },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          role: { type: 'string', enum: ['member', 'admin'] },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      AuthSuccess: {
        type: 'object',
        properties: {
          user: { $ref: '#/components/schemas/User' },
          token: { type: 'string' },
        },
      },
      Instructor: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          name: { type: 'string' },
          email: { type: 'string', nullable: true },
          specialty: { type: 'string', nullable: true },
          bio: { type: 'string', nullable: true },
          status: { type: 'string', enum: ['active', 'inactive'] },
          createdBy: { type: 'integer', nullable: true },
          updatedBy: { type: 'integer', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Class: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          name: { type: 'string' },
          description: { type: 'string', nullable: true },
          bikeLabel: { type: 'string', nullable: true },
          startsAt: { type: 'string', format: 'date-time', nullable: true },
          level: { type: 'string', enum: ['beginner', 'intermediate', 'advanced'] },
          durationMinutes: { type: 'integer' },
          capacity: { type: 'integer', nullable: true },
          bookedCount: { type: 'integer' },
          status: { type: 'string', enum: ['open', 'closed'] },
          instructorId: { type: 'integer' },
          createdBy: { type: 'integer', nullable: true },
          updatedBy: { type: 'integer', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
          instructor: { allOf: [{ $ref: '#/components/schemas/Instructor' }], nullable: true },
        },
      },
      Booking: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          status: { type: 'string', enum: ['active', 'cancelled'] },
          userId: { type: 'integer' },
          classId: { type: 'integer' },
          externalBookingId: { type: 'string', nullable: true },
          createdBy: { type: 'integer', nullable: true },
          updatedBy: { type: 'integer', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
          class: { allOf: [{ $ref: '#/components/schemas/Class' }], nullable: true },
        },
      },
      AdminDashboardMetrics: {
        type: 'object',
        properties: {
          users: { type: 'integer' },
          instructors: { type: 'integer' },
          classes: { type: 'integer' },
          activeBookings: { type: 'integer' },
          totalCapacity: { type: 'integer' },
          totalBooked: { type: 'integer' },
          occupancyRate: { type: 'number' },
        },
      },
    },
  },
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check',
        responses: {
          200: {
            description: 'Service health',
            content: { 'application/json': { schema: { type: 'object', properties: { status: { type: 'string' }, service: { type: 'string' } } } } },
          },
        },
      },
    },
    '/api/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register user',
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['name', 'email', 'password'], properties: { name: { type: 'string' }, email: { type: 'string', format: 'email' }, password: { type: 'string', minLength: 6 } } } } } },
        responses: { 201: { description: 'User created', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthSuccess' } } } } },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login user',
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['email', 'password'], properties: { email: { type: 'string', format: 'email' }, password: { type: 'string' } } } } } },
        responses: { 200: { description: 'Authenticated', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthSuccess' } } } } },
      },
    },
    '/api/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Get current user',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Current user', content: { 'application/json': { schema: { type: 'object', properties: { user: { $ref: '#/components/schemas/User' } } } } } } },
      },
    },
    '/api/classes': {
      get: {
        tags: ['Classes'],
        summary: 'List classes',
        responses: { 200: { description: 'Class list', content: { 'application/json': { schema: { type: 'object', properties: { classes: { type: 'array', items: { $ref: '#/components/schemas/Class' } } } } } } } },
      },
    },
    '/api/bookings/me': {
      get: {
        tags: ['Bookings'],
        summary: 'List current user bookings',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Booking list', content: { 'application/json': { schema: { type: 'object', properties: { bookings: { type: 'array', items: { $ref: '#/components/schemas/Booking' } } } } } } } },
      },
    },
    '/api/bookings': {
      post: {
        tags: ['Bookings'],
        summary: 'Create booking for class',
        security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['classId'], properties: { classId: { type: 'integer' } } } } } },
        responses: { 201: { description: 'Booking created', content: { 'application/json': { schema: { type: 'object', properties: { booking: { $ref: '#/components/schemas/Booking' } } } } } } },
      },
    },
    '/api/bookings/{id}': {
      delete: {
        tags: ['Bookings'],
        summary: 'Cancel booking',
        security: [{ bearerAuth: [] }],
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: 'Booking cancelled', content: { 'application/json': { schema: { type: 'object', properties: { booking: { $ref: '#/components/schemas/Booking' } } } } } } },
      },
    },
    '/api/admin/dashboard': {
      get: {
        tags: ['Admin'],
        summary: 'Get admin dashboard',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Dashboard metrics', content: { 'application/json': { schema: { type: 'object', properties: { metrics: { $ref: '#/components/schemas/AdminDashboardMetrics' } } } } } } },
      },
    },
    '/api/admin/instructors': {
      get: {
        tags: ['Admin'],
        summary: 'List instructors',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Instructor list', content: { 'application/json': { schema: { type: 'object', properties: { instructors: { type: 'array', items: { $ref: '#/components/schemas/Instructor' } } } } } } } },
      },
      post: {
        tags: ['Admin'],
        summary: 'Create instructor',
        security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['name'], properties: { name: { type: 'string' }, email: { type: 'string' }, specialty: { type: 'string' }, bio: { type: 'string' } } } } } },
        responses: { 201: { description: 'Instructor created', content: { 'application/json': { schema: { type: 'object', properties: { instructor: { $ref: '#/components/schemas/Instructor' } } } } } } },
      },
    },
    '/api/admin/classes': {
      get: {
        tags: ['Admin'],
        summary: 'List classes',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Class list', content: { 'application/json': { schema: { type: 'object', properties: { classes: { type: 'array', items: { $ref: '#/components/schemas/Class' } } } } } } } },
      },
      post: {
        tags: ['Admin'],
        summary: 'Create class',
        security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['name', 'instructorId'], properties: { name: { type: 'string' }, description: { type: 'string' }, level: { type: 'string' }, durationMinutes: { type: 'integer' }, instructorId: { type: 'integer' }, bikeLabel: { type: 'string' }, startsAt: { type: 'string', format: 'date-time' }, capacity: { type: 'integer' } } } } } },
        responses: { 201: { description: 'Class created', content: { 'application/json': { schema: { type: 'object', properties: { class: { $ref: '#/components/schemas/Class' } } } } } } },
      },
    },
  },
};

export default openApiSpec;
