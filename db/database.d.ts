import { DatabaseModule } from '../types';

declare const database: Promise<DatabaseModule>;
export = database;