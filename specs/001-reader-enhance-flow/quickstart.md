# Quick Start Guide: Reader Enhance Flow

**Feature**: Reader Enhance Flow
**Version**: 1.0.0
**Last Updated**: 2025-09-13

## Prerequisites

- Node.js 18+ and npm 9+
- PostgreSQL 14+ (or Docker for containerized setup)
- S3-compatible storage (LocalStack for dev, or Supabase/R2 account)
- Git

## Initial Setup

### 1. Clone and Install

```bash
# Clone the repository
git clone https://github.com/your-org/novel-enchant.git
cd novel-enchant

# Install dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### 2. Environment Configuration

Create `.env` files in both backend and frontend directories:

**backend/.env**
```env
# Server
NODE_ENV=development
PORT=3000

# Database (SQLite for dev)
DATABASE_URL="file:./dev.db"

# Auth (simplified for dev)
JWT_SECRET=dev-secret-change-in-production
AUTH_ENABLED=true

# Storage (LocalStack or real S3)
S3_ENDPOINT=http://localhost:4566
S3_REGION=us-east-1
S3_ACCESS_KEY=test
S3_SECRET_KEY=test
S3_BUCKET=novel-enchant-dev
CDN_URL=http://localhost:4566/novel-enchant-dev

# Image Generation (mock or real)
IMAGE_GEN_PROVIDER=mock  # or 'openai', 'replicate', 'stability'
IMAGE_GEN_API_KEY=your-api-key-here

# Queue (in-process for dev)
QUEUE_TYPE=in-process  # or 'redis', 'sqs' for production

# Rate Limiting
RATE_LIMIT_ENHANCE=5  # per hour
RATE_LIMIT_RETRY=10    # per hour

# Limits
MAX_FILE_SIZE_MB=2
MAX_WORD_COUNT=50000
MAX_SCENES_PER_COPY=30
```

**frontend/.env**
```env
VITE_API_URL=http://localhost:3000/api
VITE_AUTH_ENABLED=true
```

### 3. Database Setup

```bash
# Navigate to backend
cd backend

# Run Prisma migrations
npx prisma migrate dev --name init

# Seed sample data (optional)
npm run seed

# View database
npx prisma studio
```

### 4. Storage Setup

#### Option A: LocalStack (Recommended for Dev)

```bash
# Install LocalStack
pip install localstack

# Start LocalStack
localstack start

# Create bucket
aws --endpoint-url=http://localhost:4566 \
    s3 mb s3://novel-enchant-dev

# Set bucket policy for public read (CDN simulation)
aws --endpoint-url=http://localhost:4566 \
    s3api put-bucket-policy \
    --bucket novel-enchant-dev \
    --policy file://bucket-policy.json
```

**bucket-policy.json**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicRead",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::novel-enchant-dev/public/*"
    }
  ]
}
```

#### Option B: Real S3-Compatible Storage

Update `.env` with your actual credentials:
```env
S3_ENDPOINT=https://your-endpoint.supabase.co
S3_ACCESS_KEY=your-real-key
S3_SECRET_KEY=your-real-secret
S3_BUCKET=your-bucket-name
CDN_URL=https://your-cdn-url.com
```

## Running the Application

### Development Mode

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev

# Terminal 3: Worker (if using separate process)
cd backend
npm run worker
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000/api
- Prisma Studio: http://localhost:5555

### Production Build

```bash
# Build frontend
cd frontend
npm run build

# Build backend
cd backend
npm run build

# Start production server
NODE_ENV=production npm start
```

## Testing the Enhancement Flow

### 1. Manual Testing Flow

```bash
# 1. Start all services
npm run dev:all

# 2. Open browser
open http://localhost:5173

# 3. Navigate to My Shelf
# Click "My Shelf" in navigation

# 4. Start Enhancement
# Click "Enhance a Story" button

# 5. Test with sample text
# Paste this sample:
```

**Sample Text for Testing**:
```
Chapter 1: The Beginning

The old wizard stood at the edge of the cliff, watching the sunset paint
the valley in shades of gold and crimson. His weathered hands gripped
his staff as memories of countless battles flickered through his mind.

Deep in the forest below, creatures stirred as darkness approached.
The ancient trees whispered secrets in a language long forgotten by men.

Chapter 2: The Journey

By morning, the wizard had made his decision. He would venture into
the dark forest one last time, seeking the crystal that could save
his dying world.

The path ahead was treacherous, winding through thorny brambles and
across rushing streams. But the wizard pressed on, his determination
unwavering despite his aged bones.
```

### 2. API Testing

```bash
# Get auth token (if auth enabled)
TOKEN=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}' \
  | jq -r '.token')

# Start enhancement job
JOB_ID=$(curl -X POST http://localhost:3000/api/enhance/start \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "source": "paste",
    "title": "Test Story",
    "text": "Once upon a time..."
  }' | jq -r '.jobId')

# Check status
curl -X GET "http://localhost:3000/api/enhance/status?jobId=$JOB_ID" \
  -H "Authorization: Bearer $TOKEN" | jq

# Accept an image
curl -X POST http://localhost:3000/api/enhance/accept \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"jobId\": \"$JOB_ID\",
    \"sceneId\": \"scene_001\",
    \"takeId\": \"take_001\"
  }"

# Save to shelf
COPY_ID=$(curl -X POST http://localhost:3000/api/shelf/save \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"jobId\": \"$JOB_ID\",
    \"title\": \"My Enhanced Story\"
  }" | jq -r '.copyId')

# View the saved copy
open "http://localhost:5173/shelf/$COPY_ID"
```

### 3. Automated Test Suite

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit
npm run test:integration
npm run test:e2e

# Run with coverage
npm run test:coverage

# Watch mode for development
npm run test:watch
```

## Validation Checklist

### Functional Requirements
- [ ] Can paste text and start enhancement
- [ ] Can upload .txt file and start enhancement
- [ ] Scenes are automatically detected (3-5 per 1k words)
- [ ] Images generate for each scene
- [ ] Can accept/retry individual images
- [ ] Can save to My Shelf
- [ ] Enhanced copy appears in My Shelf list
- [ ] Can open and read enhanced copy with images
- [ ] Images have alt text for accessibility

### Non-Functional Requirements
- [ ] Max 50k words enforced with friendly error
- [ ] Max 2MB file size enforced
- [ ] Max 30 scenes per copy enforced
- [ ] Rate limiting works (5 enhancements/hour)
- [ ] Private copies not accessible by other users
- [ ] All endpoints require authentication
- [ ] Logs generated with job IDs for debugging

### Edge Cases
- [ ] Empty text shows appropriate message
- [ ] Very short text (< 100 chars) handled gracefully
- [ ] Network failure during generation can be resumed
- [ ] Unsupported file types show clear error
- [ ] Rate limit message is user-friendly

## Troubleshooting

### Common Issues

**Database connection failed**
```bash
# Check PostgreSQL is running
pg_isready

# For SQLite, ensure file permissions
chmod 664 backend/dev.db
```

**Storage upload fails**
```bash
# Check LocalStack is running
curl http://localhost:4566/_localstack/health

# Verify bucket exists
aws --endpoint-url=http://localhost:4566 s3 ls
```

**Image generation timeout**
```bash
# Check provider configuration
grep IMAGE_GEN_PROVIDER backend/.env

# For mock provider, should return instantly
# For real providers, check API key and quota
```

**Frontend can't reach backend**
```bash
# Verify backend is running
curl http://localhost:3000/api/health

# Check CORS configuration
grep CORS backend/src/app.ts
```

## Performance Benchmarks

Run performance tests:
```bash
npm run perf:test
```

Expected metrics:
- Page load: < 2 seconds
- Scene detection: < 500ms per 1k words
- Image generation: < 10s per image (mock: instant)
- Save to shelf: < 1 second
- Reading view render: < 500ms

## Monitoring

### Development
- Console logs in browser DevTools
- Network tab for API calls
- React DevTools for component state
- Prisma Studio for database inspection

### Production
- Application logs: `/var/log/novel-enchant/`
- Metrics endpoint: `/api/metrics`
- Health check: `/api/health`
- Error tracking: Configure Sentry in `.env`

## Next Steps

After validating the Reader Enhance flow:

1. **Deploy to staging**
   ```bash
   npm run deploy:staging
   ```

2. **Run E2E tests on staging**
   ```bash
   npm run test:e2e:staging
   ```

3. **Load testing**
   ```bash
   npm run test:load
   ```

4. **Security audit**
   ```bash
   npm audit
   npm run security:check
   ```

5. **Documentation**
   - Update API documentation
   - Create user guide
   - Document known limitations

## Support

- GitHub Issues: [github.com/your-org/novel-enchant/issues](https://github.com)
- Documentation: [docs.novel-enchant.com](https://docs.example.com)
- Discord: [discord.gg/novel-enchant](https://discord.gg)

---

*For production deployment guide, see [DEPLOYMENT.md](../../../DEPLOYMENT.md)*
*For API reference, see [contracts/openapi.yaml](./contracts/openapi.yaml)*