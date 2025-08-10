/**
 * Image Optimization Service
 * Handles image processing, resizing, and optimization for better performance
 */

import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';
import { ImageCache } from './cache';

interface ImageProcessingOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp' | 'avif';
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  background?: string;
  blur?: number;
  sharpen?: boolean;
  grayscale?: boolean;
}

interface OptimizedImageResult {
  buffer: Buffer;
  metadata: {
    width: number;
    height: number;
    format: string;
    size: number;
  };
  originalSize: number;
  optimizedSize: number;
  compressionRatio: number;
}

interface ImageVariant {
  name: string;
  width: number;
  height?: number;
  quality: number;
  format?: string;
}

export class ImageOptimizationService {
  private cache: ImageCache;
  private uploadDir: string;
  private optimizedDir: string;

  // Predefined image variants for responsive images
  private static readonly IMAGE_VARIANTS: ImageVariant[] = [
    { name: 'thumbnail', width: 150, height: 150, quality: 80 },
    { name: 'small', width: 300, quality: 85 },
    { name: 'medium', width: 600, quality: 85 },
    { name: 'large', width: 1200, quality: 90 },
    { name: 'xlarge', width: 1920, quality: 90 }
  ];

  constructor(uploadDir: string = 'public/uploads') {
    this.cache = new ImageCache();
    this.uploadDir = uploadDir;
    this.optimizedDir = path.join(uploadDir, 'optimized');
    this.ensureDirectories();
  }

  /**
   * Optimize a single image with specified options
   */
  async optimizeImage(
    inputPath: string,
    options: ImageProcessingOptions = {}
  ): Promise<OptimizedImageResult> {
    try {
      // Check cache first
      const cached = await this.cache.getCachedImageMetadata(inputPath, options);
      if (cached && await this.fileExists(cached.processedPath)) {
        const buffer = await fs.readFile(cached.processedPath);
        return {
          buffer,
          metadata: cached.metadata,
          originalSize: cached.metadata.originalSize,
          optimizedSize: buffer.length,
          compressionRatio: cached.metadata.compressionRatio
        };
      }

      // Read original image
      const originalBuffer = await fs.readFile(inputPath);
      const originalSize = originalBuffer.length;

      // Create Sharp instance
      let image = sharp(originalBuffer);

      // Get original metadata
      const originalMetadata = await image.metadata();

      // Apply transformations
      if (options.width || options.height) {
        image = image.resize({
          width: options.width,
          height: options.height,
          fit: options.fit || 'cover',
          background: options.background || { r: 255, g: 255, b: 255, alpha: 1 }
        });
      }

      // Apply filters
      if (options.blur) {
        image = image.blur(options.blur);
      }

      if (options.sharpen) {
        image = image.sharpen();
      }

      if (options.grayscale) {
        image = image.grayscale();
      }

      // Set format and quality
      const format = options.format || this.getOptimalFormat(originalMetadata.format);
      const quality = options.quality || this.getOptimalQuality(format);

      switch (format) {
        case 'jpeg':
          image = image.jpeg({ quality, progressive: true });
          break;
        case 'png':
          image = image.png({ quality, progressive: true });
          break;
        case 'webp':
          image = image.webp({ quality });
          break;
        case 'avif':
          image = image.avif({ quality });
          break;
      }

      // Process image
      const optimizedBuffer = await image.toBuffer();
      const metadata = await sharp(optimizedBuffer).metadata();

      const result: OptimizedImageResult = {
        buffer: optimizedBuffer,
        metadata: {
          width: metadata.width!,
          height: metadata.height!,
          format: metadata.format!,
          size: optimizedBuffer.length
        },
        originalSize,
        optimizedSize: optimizedBuffer.length,
        compressionRatio: Math.round((1 - optimizedBuffer.length / originalSize) * 100)
      };

      // Cache the result
      const outputPath = this.generateOptimizedPath(inputPath, options);
      await fs.writeFile(outputPath, optimizedBuffer);
      await this.cache.cacheImageMetadata(inputPath, outputPath, {
        ...result.metadata,
        originalSize,
        compressionRatio: result.compressionRatio
      });

      return result;

    } catch (error) {
      console.error('Image optimization error:', error);
      throw new Error(`Failed to optimize image: ${error}`);
    }
  }

  /**
   * Generate multiple variants of an image for responsive design
   */
  async generateImageVariants(
    inputPath: string,
    customVariants?: ImageVariant[]
  ): Promise<Record<string, OptimizedImageResult>> {
    const variants = customVariants || ImageOptimizationService.IMAGE_VARIANTS;
    const results: Record<string, OptimizedImageResult> = {};

    // Process variants in parallel
    const promises = variants.map(async (variant) => {
      const options: ImageProcessingOptions = {
        width: variant.width,
        height: variant.height,
        quality: variant.quality,
        format: variant.format as any
      };

      const result = await this.optimizeImage(inputPath, options);
      return { name: variant.name, result };
    });

    const variantResults = await Promise.all(promises);
    
    variantResults.forEach(({ name, result }) => {
      results[name] = result;
    });

    return results;
  }

  /**
   * Generate WebP and AVIF versions for modern browsers
   */
  async generateModernFormats(inputPath: string): Promise<{
    webp: OptimizedImageResult;
    avif: OptimizedImageResult;
  }> {
    const [webp, avif] = await Promise.all([
      this.optimizeImage(inputPath, { format: 'webp', quality: 85 }),
      this.optimizeImage(inputPath, { format: 'avif', quality: 80 })
    ]);

    return { webp, avif };
  }

  /**
   * Batch optimize multiple images
   */
  async batchOptimize(
    inputPaths: string[],
    options: ImageProcessingOptions = {}
  ): Promise<Record<string, OptimizedImageResult | Error>> {
    const results: Record<string, OptimizedImageResult | Error> = {};

    // Process images in batches to avoid overwhelming the system
    const batchSize = 5;
    for (let i = 0; i < inputPaths.length; i += batchSize) {
      const batch = inputPaths.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (inputPath) => {
        try {
          const result = await this.optimizeImage(inputPath, options);
          return { path: inputPath, result };
        } catch (error) {
          return { path: inputPath, error: error as Error };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      
      batchResults.forEach(({ path, result, error }) => {
        results[path] = error || result!;
      });
    }

    return results;
  }

  /**
   * Get image information without processing
   */
  async getImageInfo(inputPath: string): Promise<{
    width: number;
    height: number;
    format: string;
    size: number;
    density?: number;
    hasAlpha: boolean;
  }> {
    try {
      const metadata = await sharp(inputPath).metadata();
      const stats = await fs.stat(inputPath);

      return {
        width: metadata.width!,
        height: metadata.height!,
        format: metadata.format!,
        size: stats.size,
        density: metadata.density,
        hasAlpha: metadata.hasAlpha || false
      };
    } catch (error) {
      throw new Error(`Failed to get image info: ${error}`);
    }
  }

  /**
   * Create a placeholder image (blur/low quality)
   */
  async createPlaceholder(
    inputPath: string,
    width: number = 20,
    quality: number = 20
  ): Promise<Buffer> {
    try {
      return await sharp(inputPath)
        .resize(width, null, { fit: 'inside' })
        .blur(1)
        .jpeg({ quality })
        .toBuffer();
    } catch (error) {
      throw new Error(`Failed to create placeholder: ${error}`);
    }
  }

  /**
   * Validate image file
   */
  async validateImage(inputPath: string): Promise<{
    isValid: boolean;
    errors: string[];
    metadata?: any;
  }> {
    const errors: string[] = [];

    try {
      // Check if file exists
      if (!await this.fileExists(inputPath)) {
        errors.push('File does not exist');
        return { isValid: false, errors };
      }

      // Check file size (max 50MB)
      const stats = await fs.stat(inputPath);
      if (stats.size > 50 * 1024 * 1024) {
        errors.push('File size exceeds 50MB limit');
      }

      // Try to read metadata
      const metadata = await sharp(inputPath).metadata();

      // Check dimensions
      if (!metadata.width || !metadata.height) {
        errors.push('Invalid image dimensions');
      }

      // Check format
      const supportedFormats = ['jpeg', 'png', 'webp', 'gif', 'svg', 'tiff'];
      if (!metadata.format || !supportedFormats.includes(metadata.format)) {
        errors.push(`Unsupported format: ${metadata.format}`);
      }

      return {
        isValid: errors.length === 0,
        errors,
        metadata: errors.length === 0 ? metadata : undefined
      };

    } catch (error) {
      errors.push(`Failed to validate image: ${error}`);
      return { isValid: false, errors };
    }
  }

  /**
   * Clean up old optimized images
   */
  async cleanupOptimizedImages(olderThanDays: number = 30): Promise<{
    deletedCount: number;
    freedSpace: number;
  }> {
    try {
      const cutoffTime = Date.now() - (olderThanDays * 24 * 60 * 60 * 1000);
      let deletedCount = 0;
      let freedSpace = 0;

      const files = await this.getFilesRecursively(this.optimizedDir);
      
      for (const file of files) {
        const stats = await fs.stat(file);
        if (stats.mtime.getTime() < cutoffTime) {
          freedSpace += stats.size;
          await fs.unlink(file);
          deletedCount++;
        }
      }

      return { deletedCount, freedSpace };

    } catch (error) {
      console.error('Cleanup error:', error);
      return { deletedCount: 0, freedSpace: 0 };
    }
  }

  /**
   * Get optimal format based on original format and browser support
   */
  private getOptimalFormat(originalFormat?: string): 'jpeg' | 'png' | 'webp' {
    // For now, return webp for most cases, jpeg for photos, png for graphics
    if (originalFormat === 'png') return 'png';
    return 'webp';
  }

  /**
   * Get optimal quality based on format
   */
  private getOptimalQuality(format: string): number {
    switch (format) {
      case 'jpeg': return 85;
      case 'png': return 90;
      case 'webp': return 80;
      case 'avif': return 75;
      default: return 85;
    }
  }

  /**
   * Generate optimized file path
   */
  private generateOptimizedPath(
    inputPath: string,
    options: ImageProcessingOptions
  ): string {
    const parsedPath = path.parse(inputPath);
    const optionsHash = this.hashOptions(options);
    const filename = `${parsedPath.name}_${optionsHash}.${options.format || 'webp'}`;
    
    return path.join(this.optimizedDir, filename);
  }

  /**
   * Create hash from options for caching
   */
  private hashOptions(options: ImageProcessingOptions): string {
    const optionsString = JSON.stringify(options);
    let hash = 0;
    for (let i = 0; i < optionsString.length; i++) {
      const char = optionsString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Ensure required directories exist
   */
  private async ensureDirectories(): Promise<void> {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
      await fs.mkdir(this.optimizedDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create directories:', error);
    }
  }

  /**
   * Check if file exists
   */
  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get all files recursively from directory
   */
  private async getFilesRecursively(dir: string): Promise<string[]> {
    const files: string[] = [];
    
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          files.push(...await this.getFilesRecursively(fullPath));
        } else {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Directory might not exist or be accessible
    }

    return files;
  }
}