/**
 * Backup and Recovery System
 * Handles automated database backups, media file backups, and recovery operations
 */

import { PrismaClient } from '@prisma/client';
import { promises as fs } from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { createReadStream, createWriteStream } from 'fs';
import { createGzip, createGunzip } from 'zlib';
import { pipeline } from 'stream';

const execAsync = promisify(exec);
const pipelineAsync = promisify(pipeline);

export interface BackupConfig {
  databaseUrl: string;
  backupDir: string;
  mediaDir: string;
  retentionDays: number;
  compressionEnabled: boolean;
  encryptionEnabled: boolean;
  encryptionKey?: string;
}

export interface BackupMetadata {
  id: string;
  type: 'database' | 'media' | 'full';
  filename: string;
  size: number;
  compressed: boolean;
  encrypted: boolean;
  createdAt: Date;
  createdBy: string;
  description?: string;
  checksum: string;
  version: string;
}

export interface BackupStatus {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  startTime: Date;
  endTime?: Date;
  error?: string;
  metadata?: BackupMetadata;
}

export interface RestoreOptions {
  backupId: string;
  restoreDatabase: boolean;
  restoreMedia: boolean;
  targetPath?: string;
  overwriteExisting: boolean;
}

export class BackupService {
  private prisma: PrismaClient;
  private config: BackupConfig;
  private activeBackups = new Map<string, BackupStatus>();

  constructor(prisma: PrismaClient, config: BackupConfig) {
    this.prisma = prisma;
    this.config = config;
    this.ensureBackupDirectory();
  }

  /**
   * Create a full backup (database + media)
   */
  async createFullBackup(
    createdBy: string,
    description?: string
  ): Promise<string> {
    const backupId = this.generateBackupId();
    const status: BackupStatus = {
      id: backupId,
      status: 'pending',
      progress: 0,
      startTime: new Date()
    };

    this.activeBackups.set(backupId, status);

    try {
      status.status = 'running';
      
      // Create database backup
      status.progress = 10;
      const dbBackupPath = await this.createDatabaseBackup(backupId);
      
      // Create media backup
      status.progress = 50;
      const mediaBackupPath = await this.createMediaBackup(backupId);
      
      // Combine backups
      status.progress = 80;
      const fullBackupPath = await this.combineBackups(
        backupId,
        dbBackupPath,
        mediaBackupPath
      );

      // Generate metadata
      const metadata = await this.generateBackupMetadata(
        backupId,
        'full',
        fullBackupPath,
        createdBy,
        description
      );

      // Store metadata in database
      await this.storeBackupMetadata(metadata);

      status.status = 'completed';
      status.progress = 100;
      status.endTime = new Date();
      status.metadata = metadata;

      // Clean up temporary files
      await this.cleanupTempFiles([dbBackupPath, mediaBackupPath]);

      return backupId;

    } catch (error) {
      status.status = 'failed';
      status.error = error instanceof Error ? error.message : 'Unknown error';
      status.endTime = new Date();
      
      console.error('Full backup failed:', error);
      throw error;
    }
  }

  /**
   * Create database-only backup
   */
  async createDatabaseBackup(backupId?: string): Promise<string> {
    const id = backupId || this.generateBackupId();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `db-backup-${timestamp}.sql`;
    const backupPath = path.join(this.config.backupDir, filename);

    try {
      // Extract database connection details
      const dbUrl = new URL(this.config.databaseUrl);
      const dbName = dbUrl.pathname.slice(1);
      const host = dbUrl.hostname;
      const port = dbUrl.port || '5432';
      const username = dbUrl.username;
      const password = dbUrl.password;

      // Create pg_dump command
      const dumpCommand = [
        'pg_dump',
        `--host=${host}`,
        `--port=${port}`,
        `--username=${username}`,
        '--no-password',
        '--verbose',
        '--clean',
        '--no-acl',
        '--no-owner',
        `--file=${backupPath}`,
        dbName
      ].join(' ');

      // Set password environment variable
      const env = { ...process.env, PGPASSWORD: password };

      // Execute backup
      await execAsync(dumpCommand, { env });

      // Compress if enabled
      if (this.config.compressionEnabled) {
        const compressedPath = `${backupPath}.gz`;
        await this.compressFile(backupPath, compressedPath);
        await fs.unlink(backupPath);
        return compressedPath;
      }

      return backupPath;

    } catch (error) {
      console.error('Database backup failed:', error);
      throw new Error(`Database backup failed: ${error}`);
    }
  }

  /**
   * Create media files backup
   */
  async createMediaBackup(backupId?: string): Promise<string> {
    const id = backupId || this.generateBackupId();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `media-backup-${timestamp}.tar.gz`;
    const backupPath = path.join(this.config.backupDir, filename);

    try {
      // Create tar archive of media directory
      const tarCommand = [
        'tar',
        '-czf',
        backupPath,
        '-C',
        path.dirname(this.config.mediaDir),
        path.basename(this.config.mediaDir)
      ].join(' ');

      await execAsync(tarCommand);
      return backupPath;

    } catch (error) {
      console.error('Media backup failed:', error);
      throw new Error(`Media backup failed: ${error}`);
    }
  }

  /**
   * Restore from backup
   */
  async restoreFromBackup(
    options: RestoreOptions,
    restoredBy: string
  ): Promise<void> {
    try {
      // Get backup metadata
      const backup = await this.getBackupMetadata(options.backupId);
      if (!backup) {
        throw new Error('Backup not found');
      }

      const backupPath = path.join(this.config.backupDir, backup.filename);

      // Verify backup integrity
      await this.verifyBackupIntegrity(backupPath, backup.checksum);

      if (backup.type === 'full') {
        // Extract full backup
        const extractedPaths = await this.extractFullBackup(backupPath);
        
        if (options.restoreDatabase) {
          await this.restoreDatabase(extractedPaths.database);
        }
        
        if (options.restoreMedia) {
          await this.restoreMedia(extractedPaths.media, options.overwriteExisting);
        }

        // Clean up extracted files
        await this.cleanupTempFiles([extractedPaths.database, extractedPaths.media]);

      } else if (backup.type === 'database' && options.restoreDatabase) {
        await this.restoreDatabase(backupPath);
        
      } else if (backup.type === 'media' && options.restoreMedia) {
        await this.restoreMedia(backupPath, options.overwriteExisting);
      }

      // Log restore operation
      await this.logRestoreOperation(options.backupId, restoredBy);

    } catch (error) {
      console.error('Restore failed:', error);
      throw error;
    }
  }

  /**
   * List available backups
   */
  async listBackups(
    type?: 'database' | 'media' | 'full',
    limit: number = 50
  ): Promise<BackupMetadata[]> {
    try {
      const whereClause = type ? { type } : {};
      
      const backups = await this.prisma.backup.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        take: limit
      });

      return backups.map(backup => ({
        id: backup.id,
        type: backup.type as 'database' | 'media' | 'full',
        filename: backup.filename,
        size: backup.size,
        compressed: backup.compressed,
        encrypted: backup.encrypted,
        createdAt: backup.createdAt,
        createdBy: backup.createdBy,
        description: backup.description || undefined,
        checksum: backup.checksum,
        version: backup.version
      }));

    } catch (error) {
      console.error('Failed to list backups:', error);
      throw error;
    }
  }

  /**
   * Delete old backups based on retention policy
   */
  async cleanupOldBackups(): Promise<{
    deletedCount: number;
    freedSpace: number;
  }> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays);

      const oldBackups = await this.prisma.backup.findMany({
        where: {
          createdAt: {
            lt: cutoffDate
          }
        }
      });

      let deletedCount = 0;
      let freedSpace = 0;

      for (const backup of oldBackups) {
        try {
          const backupPath = path.join(this.config.backupDir, backup.filename);
          
          // Check if file exists and get size
          try {
            const stats = await fs.stat(backupPath);
            freedSpace += stats.size;
            await fs.unlink(backupPath);
          } catch (fileError) {
            // File might already be deleted, continue
          }

          // Remove from database
          await this.prisma.backup.delete({
            where: { id: backup.id }
          });

          deletedCount++;

        } catch (error) {
          console.error(`Failed to delete backup ${backup.id}:`, error);
        }
      }

      return { deletedCount, freedSpace };

    } catch (error) {
      console.error('Backup cleanup failed:', error);
      throw error;
    }
  }

  /**
   * Verify backup integrity
   */
  async verifyBackupIntegrity(
    backupPath: string,
    expectedChecksum: string
  ): Promise<boolean> {
    try {
      const actualChecksum = await this.calculateChecksum(backupPath);
      return actualChecksum === expectedChecksum;
    } catch (error) {
      console.error('Backup integrity verification failed:', error);
      return false;
    }
  }

  /**
   * Get backup status
   */
  getBackupStatus(backupId: string): BackupStatus | null {
    return this.activeBackups.get(backupId) || null;
  }

  /**
   * Schedule automatic backups
   */
  scheduleAutomaticBackups(
    schedule: {
      database: string; // cron expression
      media: string; // cron expression
      full: string; // cron expression
    }
  ): void {
    // This would integrate with a job scheduler like node-cron
    // For now, we'll just log the schedule
    console.log('Backup schedule configured:', schedule);
  }

  /**
   * Generate backup metadata
   */
  private async generateBackupMetadata(
    id: string,
    type: 'database' | 'media' | 'full',
    filePath: string,
    createdBy: string,
    description?: string
  ): Promise<BackupMetadata> {
    const stats = await fs.stat(filePath);
    const checksum = await this.calculateChecksum(filePath);
    const filename = path.basename(filePath);

    return {
      id,
      type,
      filename,
      size: stats.size,
      compressed: this.config.compressionEnabled,
      encrypted: this.config.encryptionEnabled,
      createdAt: new Date(),
      createdBy,
      description,
      checksum,
      version: '1.0'
    };
  }

  /**
   * Store backup metadata in database
   */
  private async storeBackupMetadata(metadata: BackupMetadata): Promise<void> {
    await this.prisma.backup.create({
      data: {
        id: metadata.id,
        type: metadata.type,
        filename: metadata.filename,
        size: metadata.size,
        compressed: metadata.compressed,
        encrypted: metadata.encrypted,
        createdBy: metadata.createdBy,
        description: metadata.description,
        checksum: metadata.checksum,
        version: metadata.version
      }
    });
  }

  /**
   * Get backup metadata
   */
  private async getBackupMetadata(backupId: string): Promise<BackupMetadata | null> {
    const backup = await this.prisma.backup.findUnique({
      where: { id: backupId }
    });

    if (!backup) return null;

    return {
      id: backup.id,
      type: backup.type as 'database' | 'media' | 'full',
      filename: backup.filename,
      size: backup.size,
      compressed: backup.compressed,
      encrypted: backup.encrypted,
      createdAt: backup.createdAt,
      createdBy: backup.createdBy,
      description: backup.description || undefined,
      checksum: backup.checksum,
      version: backup.version
    };
  }

  /**
   * Combine database and media backups into full backup
   */
  private async combineBackups(
    backupId: string,
    dbBackupPath: string,
    mediaBackupPath: string
  ): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `full-backup-${timestamp}.tar.gz`;
    const fullBackupPath = path.join(this.config.backupDir, filename);

    // Create tar archive containing both backups
    const tarCommand = [
      'tar',
      '-czf',
      fullBackupPath,
      '-C',
      this.config.backupDir,
      path.basename(dbBackupPath),
      path.basename(mediaBackupPath)
    ].join(' ');

    await execAsync(tarCommand);
    return fullBackupPath;
  }

  /**
   * Extract full backup
   */
  private async extractFullBackup(backupPath: string): Promise<{
    database: string;
    media: string;
  }> {
    const extractDir = path.join(this.config.backupDir, 'temp', Date.now().toString());
    await fs.mkdir(extractDir, { recursive: true });

    // Extract tar archive
    const tarCommand = [
      'tar',
      '-xzf',
      backupPath,
      '-C',
      extractDir
    ].join(' ');

    await execAsync(tarCommand);

    // Find extracted files
    const files = await fs.readdir(extractDir);
    const dbFile = files.find(f => f.includes('db-backup'));
    const mediaFile = files.find(f => f.includes('media-backup'));

    if (!dbFile || !mediaFile) {
      throw new Error('Invalid full backup format');
    }

    return {
      database: path.join(extractDir, dbFile),
      media: path.join(extractDir, mediaFile)
    };
  }

  /**
   * Restore database from backup
   */
  private async restoreDatabase(backupPath: string): Promise<void> {
    try {
      let sqlFile = backupPath;

      // Decompress if needed
      if (backupPath.endsWith('.gz')) {
        sqlFile = backupPath.replace('.gz', '');
        await this.decompressFile(backupPath, sqlFile);
      }

      // Extract database connection details
      const dbUrl = new URL(this.config.databaseUrl);
      const dbName = dbUrl.pathname.slice(1);
      const host = dbUrl.hostname;
      const port = dbUrl.port || '5432';
      const username = dbUrl.username;
      const password = dbUrl.password;

      // Create psql restore command
      const restoreCommand = [
        'psql',
        `--host=${host}`,
        `--port=${port}`,
        `--username=${username}`,
        '--no-password',
        `--dbname=${dbName}`,
        `--file=${sqlFile}`
      ].join(' ');

      // Set password environment variable
      const env = { ...process.env, PGPASSWORD: password };

      // Execute restore
      await execAsync(restoreCommand, { env });

      // Clean up decompressed file if created
      if (sqlFile !== backupPath) {
        await fs.unlink(sqlFile);
      }

    } catch (error) {
      console.error('Database restore failed:', error);
      throw new Error(`Database restore failed: ${error}`);
    }
  }

  /**
   * Restore media files from backup
   */
  private async restoreMedia(
    backupPath: string,
    overwriteExisting: boolean
  ): Promise<void> {
    try {
      const extractFlags = overwriteExisting ? '-xzf' : '-xzf --keep-old-files';
      
      const tarCommand = [
        'tar',
        extractFlags,
        backupPath,
        '-C',
        path.dirname(this.config.mediaDir)
      ].join(' ');

      await execAsync(tarCommand);

    } catch (error) {
      console.error('Media restore failed:', error);
      throw new Error(`Media restore failed: ${error}`);
    }
  }

  /**
   * Compress file using gzip
   */
  private async compressFile(inputPath: string, outputPath: string): Promise<void> {
    const readStream = createReadStream(inputPath);
    const writeStream = createWriteStream(outputPath);
    const gzipStream = createGzip();

    await pipelineAsync(readStream, gzipStream, writeStream);
  }

  /**
   * Decompress gzip file
   */
  private async decompressFile(inputPath: string, outputPath: string): Promise<void> {
    const readStream = createReadStream(inputPath);
    const writeStream = createWriteStream(outputPath);
    const gunzipStream = createGunzip();

    await pipelineAsync(readStream, gunzipStream, writeStream);
  }

  /**
   * Calculate file checksum
   */
  private async calculateChecksum(filePath: string): Promise<string> {
    const crypto = await import('crypto');
    const hash = crypto.createHash('sha256');
    const stream = createReadStream(filePath);

    return new Promise((resolve, reject) => {
      stream.on('data', data => hash.update(data));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', reject);
    });
  }

  /**
   * Generate unique backup ID
   */
  private generateBackupId(): string {
    return `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Ensure backup directory exists
   */
  private async ensureBackupDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.config.backupDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create backup directory:', error);
    }
  }

  /**
   * Clean up temporary files
   */
  private async cleanupTempFiles(filePaths: string[]): Promise<void> {
    for (const filePath of filePaths) {
      try {
        await fs.unlink(filePath);
      } catch (error) {
        // File might not exist, continue
      }
    }
  }

  /**
   * Log restore operation
   */
  private async logRestoreOperation(backupId: string, restoredBy: string): Promise<void> {
    try {
      await this.prisma.backupRestoreLog.create({
        data: {
          backupId,
          restoredBy,
          restoredAt: new Date()
        }
      });
    } catch (error) {
      console.error('Failed to log restore operation:', error);
    }
  }
}