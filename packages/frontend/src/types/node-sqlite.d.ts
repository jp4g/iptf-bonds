declare module "node:sqlite" {
  export class StatementSync {
    run(...parameters: unknown[]): {
      changes: number;
      lastInsertRowid: number | bigint;
    };

    get<Row extends Record<string, unknown> = Record<string, unknown>>(
      ...parameters: unknown[]
    ): Row | undefined;

    all<Row extends Record<string, unknown> = Record<string, unknown>>(
      ...parameters: unknown[]
    ): Row[];
  }

  export class DatabaseSync {
    constructor(location: string);
    exec(sql: string): void;
    prepare(sql: string): StatementSync;
    close(): void;
  }
}
