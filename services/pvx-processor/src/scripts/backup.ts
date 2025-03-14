import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs/promises';
import { logger } from '../utils/logger';

const execAsync = promisify(exec);

interface BackupOptions {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  backupDir: string;
  compress?: boolean;
  includeSchema?: boolean;
}

/**
 * Create a backup of the PostgreSQL database
 */
export async function createBackup(options: BackupOptions): Promise<string> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `backup_${options.database}_${timestamp}.sql${options.compress ? '.gz' : ''}`;
  const backupPath = path.join(options.backupDir, filename);

  // Ensure backup directory exists
  await fs.mkdir(options.backupDir, { recursive: true });

  // Build pg_dump command
  const command = [
    'pg_dump',
    `-h ${options.host}`,
    `-p ${options.port}`,
    `-U ${options.username}`,
    `-d ${options.database}`,
    options.includeSchema ? '' : '--data-only',
    options.compress ? '| gzip' : '',
    `> "${backupPath}"`
  ].join(' ');

  try {
    // Set PGPASSWORD environment variable
    process.env.PGPASSWORD = options.password;

    // Execute backup
    await execAsync(command);
    logger.info(`Backup created successfully: ${filename}`);

    return backupPath;
  } catch (error) {
    logger.error('Backup failed:', error);
    throw error;
  } finally {
    // Clear password from environment
    delete process.env.PGPASSWORD;
  }
}

/**
 * Restore a database from backup
 */
export async function restoreFromBackup(
  backupPath: string,
  options: BackupOptions
): Promise<void> {
  // Build psql command
  const command = [
    options.compress ? 'gunzip -c' : 'cat',
    `"${backupPath}"`,
    '|',
    'psql',
    `-h ${options.host}`,
    `-p ${options.port}`,
    `-U ${options.username}`,
    `-d ${options.database}`
  ].join(' ');

  try {
    // Set PGPASSWORD environment variable
    process.env.PGPASSWORD = options.password;

    // Execute restore
    await execAsync(command);
    logger.info('Database restored successfully');
  } catch (error) {
    logger.error('Restore failed:', error);
    throw error;
  } finally {
    // Clear password from environment
    delete process.env.PGPASSWORD;
  }
}

/**
 * Manage backup retention
 */
export async function manageBackupRetention(
  backupDir: string,
  options: {
    keepDaily?: number;
    keepWeekly?: number;
    keepMonthly?: number;
  }
): Promise<void> {
  const files = await fs.readdir(backupDir);
  const backups = files
    .filter(f => f.startsWith('backup_'))
    .map(filename => ({
      filename,
      path: path.join(backupDir, filename),
      timestamp: new Date(filename.split('_')[2].split('.')[0])
    }))
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  // Keep required number of daily backups
  const dailyBackups = new Set<string>();
  const weeklyBackups = new Set<string>();
  const monthlyBackups = new Set<string>();

  for (const backup of backups) {
    const date = backup.timestamp;
    const dayKey = date.toISOString().split('T')[0];
    const weekKey = `${date.getFullYear()}-W${Math.floor(date.getDate() / 7)}`;
    const monthKey = `${date.getFullYear()}-${date.getMonth()}`;

    if (options.keepDaily && dailyBackups.size < options.keepDaily && !dailyBackups.has(dayKey)) {
      dailyBackups.add(dayKey);
      continue;
    }

    if (options.keepWeekly && weeklyBackups.size < options.keepWeekly && !weeklyBackups.has(weekKey)) {
      weeklyBackups.add(weekKey);
      continue;
    }

    if (options.keepMonthly && monthlyBackups.size < options.keepMonthly && !monthlyBackups.has(monthKey)) {
      monthlyBackups.add(monthKey);
      continue;
    }

    // Delete backup if it doesn't need to be kept
    await fs.unlink(backup.path);
    logger.info(`Deleted old backup: ${backup.filename}`);
  }
}

// CLI entry point
if (require.main === module) {
  const args = process.argv.slice(2);
  const [action, ...params] = args;

  const options: BackupOptions = {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
    database: process.env.POSTGRES_DB || 'pvx_migration',
    username: process.env.POSTGRES_USER || '',
    password: process.env.POSTGRES_PASSWORD || '',
    backupDir: process.env.BACKUP_DIR || './backups',
    compress: true,
    includeSchema: true
  };

  switch (action) {
    case 'backup':
      createBackup(options)
        .then(path => console.log('Backup created:', path))
        .catch(console.error);
      break;

    case 'restore':
      if (!params[0]) {
        console.error('Backup path required for restore');
        process.exit(1);
      }
      restoreFromBackup(params[0], options)
        .then(() => console.log('Restore completed'))
        .catch(console.error);
      break;

    case 'cleanup':
      manageBackupRetention(options.backupDir, {
        keepDaily: 7,
        keepWeekly: 4,
        keepMonthly: 3
      })
        .then(() => console.log('Backup cleanup completed'))
        .catch(console.error);
      break;

    default:
      console.error('Usage: ts-node backup.ts <backup|restore|cleanup> [backup_path]');
      process.exit(1);
  }
}
