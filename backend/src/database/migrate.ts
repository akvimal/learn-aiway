import fs from 'fs';
import path from 'path';
import { database } from '../config/database.config';
import { logger } from '../config/logger.config';

export class MigrationRunner {
  private migrationsPath: string;

  constructor() {
    this.migrationsPath = path.join(__dirname, 'migrations');
  }

  async runMigrations(): Promise<void> {
    try {
      // Create migrations tracking table if it doesn't exist
      await this.createMigrationsTable();

      // Get all migration files
      const migrationFiles = this.getMigrationFiles();

      // Get already executed migrations
      const executedMigrations = await this.getExecutedMigrations();

      // Filter out already executed migrations
      const pendingMigrations = migrationFiles.filter(
        (file) => !executedMigrations.includes(file)
      );

      if (pendingMigrations.length === 0) {
        logger.info('No pending migrations');
        return;
      }

      logger.info(`Found ${pendingMigrations.length} pending migration(s)`);

      // Execute each pending migration
      for (const migrationFile of pendingMigrations) {
        await this.executeMigration(migrationFile);
      }

      logger.info('All migrations completed successfully');
    } catch (error) {
      logger.error('Migration failed', error);
      throw error;
    }
  }

  private async createMigrationsTable(): Promise<void> {
    const query = `
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;
    await database.query(query);
  }

  private getMigrationFiles(): string[] {
    const files = fs.readdirSync(this.migrationsPath);
    return files
      .filter((file) => file.endsWith('.sql'))
      .sort();
  }

  private async getExecutedMigrations(): Promise<string[]> {
    const result = await database.query<{ name: string }>(
      'SELECT name FROM migrations ORDER BY id'
    );
    return result.rows.map((row) => row.name);
  }

  private async executeMigration(filename: string): Promise<void> {
    logger.info(`Executing migration: ${filename}`);

    const filePath = path.join(this.migrationsPath, filename);
    const sql = fs.readFileSync(filePath, 'utf-8');

    await database.transaction(async (client) => {
      // Execute the migration SQL
      await client.query(sql);

      // Record the migration as executed
      await client.query(
        'INSERT INTO migrations (name) VALUES ($1)',
        [filename]
      );
    });

    logger.info(`Migration completed: ${filename}`);
  }
}

// Run migrations if this file is executed directly
if (require.main === module) {
  const runner = new MigrationRunner();
  runner.runMigrations()
    .then(() => {
      logger.info('Migration process completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Migration process failed', error);
      process.exit(1);
    });
}
