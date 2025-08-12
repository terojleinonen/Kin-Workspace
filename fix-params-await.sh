#!/bin/bash

# Fix Next.js 15 params await requirement in all route handlers

echo "🔧 Fixing params await in Next.js route handlers..."

# Find all route.ts files and fix the params type and usage
find cms/app/api -name "route.ts" -type f | while read -r file; do
    echo "Processing: $file"
    
    # Skip if already fixed (contains Promise<{)
    if grep -q "Promise<{" "$file"; then
        echo "  ✅ Already fixed"
        continue
    fi
    
    # Fix the type definition
    sed -i '' 's/{ params }: { params: { \([^}]*\) }/{ params }: { params: Promise<{ \1 }>/g' "$file"
    
    # Fix the destructuring (add await)
    sed -i '' 's/const { \([^}]*\) } = params/const { \1 } = await params/g' "$file"
    
    echo "  ✅ Fixed"
done

echo "🎉 All route handlers updated!"