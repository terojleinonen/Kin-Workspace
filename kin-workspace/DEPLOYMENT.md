# Deployment Guide

This guide covers deploying Kin Workspace to various platforms.

## 🚀 Quick Deploy to Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/kin-workspace)

### Manual Vercel Deployment

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   vercel
   ```

4. **Set Environment Variables:**
   - Go to your Vercel dashboard
   - Navigate to your project settings
   - Add environment variables:
     ```
     DATABASE_URL=your-production-database-url
     JWT_SECRET=your-super-secret-production-key
     ```

## 🐘 Database Setup for Production

### Option 1: PostgreSQL (Recommended)

1. **Get a PostgreSQL database:**
   - [Supabase](https://supabase.com) (Free tier available)
   - [Railway](https://railway.app)
   - [PlanetScale](https://planetscale.com)
   - [Neon](https://neon.tech)

2. **Update Prisma schema:**
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

3. **Run migrations:**
   ```bash
   npx prisma migrate deploy
   ```

### Option 2: SQLite (Development/Small Scale)

For small deployments, you can continue using SQLite:

```bash
# Ensure database file is created
npx prisma migrate deploy
```

## 🌐 Other Deployment Platforms

### Netlify

1. **Build settings:**
   - Build command: `npm run build`
   - Publish directory: `.next`

2. **Environment variables:**
   ```
   DATABASE_URL=your-database-url
   JWT_SECRET=your-secret-key
   ```

### Railway

1. **Connect GitHub repository**
2. **Add environment variables**
3. **Deploy automatically on push**

### Docker Deployment

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npx prisma generate
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

## 🔧 Environment Variables

### Required Variables

```bash
# Database
DATABASE_URL="your-database-connection-string"

# Authentication
JWT_SECRET="your-super-secret-jwt-key-minimum-32-characters"

# Optional
NEXT_PUBLIC_APP_URL="https://your-domain.com"
```

### Security Considerations

- **Never commit `.env` files**
- **Use strong JWT secrets** (minimum 32 characters)
- **Use HTTPS in production**
- **Enable CORS properly**
- **Set up proper database permissions**

## 📊 Performance Optimization

### Database

- **Connection pooling** for high traffic
- **Database indexing** for frequently queried fields
- **Query optimization** for complex operations

### Next.js

- **Image optimization** is already configured
- **Static generation** where possible
- **API route optimization**

### Monitoring

Consider adding:
- **Error tracking** (Sentry)
- **Analytics** (Vercel Analytics)
- **Performance monitoring** (Vercel Speed Insights)

## 🔍 Health Checks

Add a health check endpoint:

```typescript
// app/api/health/route.ts
export async function GET() {
  return Response.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString() 
  })
}
```

## 🚨 Troubleshooting

### Common Issues

1. **Database connection errors:**
   - Check DATABASE_URL format
   - Verify database is accessible
   - Run migrations: `npx prisma migrate deploy`

2. **Build failures:**
   - Check TypeScript errors: `npm run type-check`
   - Verify all dependencies are installed
   - Check environment variables

3. **Authentication issues:**
   - Verify JWT_SECRET is set
   - Check token expiration settings
   - Validate API endpoints

### Logs and Debugging

- **Vercel:** Check function logs in dashboard
- **Railway:** View deployment logs
- **Local:** Use `npm run dev` for development

## 📈 Scaling Considerations

### Database
- **Read replicas** for high read traffic
- **Connection pooling** (PgBouncer for PostgreSQL)
- **Database sharding** for very large datasets

### Application
- **CDN** for static assets
- **Caching** strategies (Redis)
- **Load balancing** for multiple instances

### Monitoring
- **Database performance** monitoring
- **API response times**
- **Error rates and alerting**

## 🔄 CI/CD Pipeline

Example GitHub Actions workflow:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

## 📞 Support

If you encounter deployment issues:

1. Check the [troubleshooting section](#-troubleshooting)
2. Review platform-specific documentation
3. Open an issue with deployment details

Happy deploying! 🚀