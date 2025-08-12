#!/bin/bash

# Database Status Verification Script
# Comprehensive check of all database components

echo "🔍 Kin Workspace Database Status Verification"
echo "=============================================="
echo ""

# Check Docker
echo "🐳 Docker Status:"
if docker info > /dev/null 2>&1; then
    echo "   ✅ Docker is running"
else
    echo "   ❌ Docker is not running"
    exit 1
fi

# Check Containers
echo ""
echo "📦 Container Status:"
POSTGRES_STATUS=$(docker ps --filter "name=kin-workspace-cms-postgres" --format "{{.Status}}" 2>/dev/null)
REDIS_STATUS=$(docker ps --filter "name=kin-workspace-cms-redis" --format "{{.Status}}" 2>/dev/null)

if [[ $POSTGRES_STATUS == *"Up"* ]] && [[ $POSTGRES_STATUS == *"healthy"* ]]; then
    echo "   ✅ PostgreSQL: $POSTGRES_STATUS"
else
    echo "   ❌ PostgreSQL: Not running or unhealthy"
fi

if [[ $REDIS_STATUS == *"Up"* ]] && [[ $REDIS_STATUS == *"healthy"* ]]; then
    echo "   ✅ Redis: $REDIS_STATUS"
else
    echo "   ❌ Redis: Not running or unhealthy"
fi

# Check Database Connection
echo ""
echo "🗄️  Database Connection:"
if docker exec kin-workspace-cms-postgres pg_isready -U cms_user -d kin_workspace_cms > /dev/null 2>&1; then
    echo "   ✅ PostgreSQL connection successful"
else
    echo "   ❌ PostgreSQL connection failed"
fi

# Check Data
echo ""
echo "📊 Data Verification:"
USER_COUNT=$(docker exec kin-workspace-cms-postgres psql -U cms_user -d kin_workspace_cms -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null | xargs)
CATEGORY_COUNT=$(docker exec kin-workspace-cms-postgres psql -U cms_user -d kin_workspace_cms -t -c "SELECT COUNT(*) FROM categories;" 2>/dev/null | xargs)
PRODUCT_COUNT=$(docker exec kin-workspace-cms-postgres psql -U cms_user -d kin_workspace_cms -t -c "SELECT COUNT(*) FROM products;" 2>/dev/null | xargs)

echo "   👤 Users: $USER_COUNT"
echo "   📁 Categories: $CATEGORY_COUNT"
echo "   📦 Products: $PRODUCT_COUNT"

if [[ $USER_COUNT -ge 1 ]] && [[ $CATEGORY_COUNT -ge 4 ]] && [[ $PRODUCT_COUNT -ge 7 ]]; then
    echo "   ✅ Data migration successful"
else
    echo "   ❌ Data migration incomplete"
fi

# Check Prisma
echo ""
echo "🔧 Prisma Status:"
cd cms
if npx prisma db pull --print > /dev/null 2>&1; then
    echo "   ✅ Prisma schema synchronized"
else
    echo "   ❌ Prisma schema issues"
fi

# Port Check
echo ""
echo "🌐 Port Status:"
if nc -z localhost 5432 2>/dev/null; then
    echo "   ✅ Port 5432 (PostgreSQL) is open"
else
    echo "   ❌ Port 5432 (PostgreSQL) is not accessible"
fi

if nc -z localhost 6379 2>/dev/null; then
    echo "   ✅ Port 6379 (Redis) is open"
else
    echo "   ❌ Port 6379 (Redis) is not accessible"
fi

echo ""
echo "🎯 Summary:"
if [[ $POSTGRES_STATUS == *"Up"* ]] && [[ $USER_COUNT -ge 1 ]] && [[ $CATEGORY_COUNT -ge 4 ]] && [[ $PRODUCT_COUNT -ge 7 ]]; then
    echo "   🟢 ALL SYSTEMS OPERATIONAL"
    echo "   🚀 Ready for development!"
    echo ""
    echo "📋 Quick Start:"
    echo "   CMS:        cd cms && npm run dev"
    echo "   E-commerce: cd kin-workspace && npm run dev"
    echo "   Database:   cd cms && npx prisma studio"
else
    echo "   🔴 ISSUES DETECTED"
    echo "   Please check the errors above"
fi

echo ""