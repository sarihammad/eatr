# Eatr

A scalable, fault-tolerant food delivery platform built with modern technologies.

## Features

- Food ordering system
- Real-time order tracking
- Payment integration
- Restaurant management
- Delivery tracking
- User authentication
- Admin dashboard

## Tech Stack

- **Backend**: Node.js, Express, TypeScript
- **Frontend**: React.js (Next.js)
- **Database**: PostgreSQL, DynamoDB
- **Caching**: Redis
- **Message Queue**: Apache Kafka
- **Container Orchestration**: Docker, Kubernetes
- **Cloud Infrastructure**: AWS (Lambda, DynamoDB, S3, etc.)
- **CI/CD**: GitHub Actions

## Architecture

The application follows a microservices architecture with the following key services:

- User Service
- Restaurant Service
- Order Service
- Payment Service
- Delivery Service
- Notification Service

## Getting Started

### Prerequisites

- Node.js >= 18
- Docker
- Kubernetes
- AWS CLI
- PostgreSQL
- Redis
- Kafka

### Installation

1. Clone the repository:

```bash
git clone https://github.com/sarihammad/eatr.git
cd eatr
```

2. Install dependencies:

```bash
# Install root dependencies
npm install

# Install service dependencies
cd backend/services/user-service && npm install
cd ../order-service && npm install
# ... repeat for other services

# Install frontend dependencies
cd frontend/web-app && npm install
```

3. Set up environment variables:

```bash
cp .env.example .env
```

4. Start the development environment:

```bash
# Start with Docker Compose
docker-compose up

# Or start services individually
npm run dev
```

## API Documentation

API documentation can be found in the `/docs` directory.

## Testing

```bash
# Run all tests
npm test

# Run specific service tests
npm run test:user-service
npm run test:order-service
```

## Deployment

The application can be deployed using:

1. Docker images and Kubernetes
2. AWS infrastructure using Terraform
3. Automated CI/CD with GitHub Actions

## Monitoring

- Prometheus + Grafana for metrics
- ELK Stack for logging
- AWS CloudWatch for cloud resource monitoring
