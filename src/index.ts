import { Query } from 'database';
import {
  checkPrimaryKey,
  createRow,
  deleteRow,
  findByPrimaryKey,
  updateRow,
} from 'database-helpers';
import { Debug, MessageType } from 'node-debug';
import { areObjectsEqual, pickObjectKeys } from 'node-utilities';

export { Query };

export type Audit = {
  creation_date?: Date;
  created_by?: string;
  last_update_date?: Date;
  last_updated_by?: string;
};

const auditColumnNames = [
  'creation_date',
  'created_by',
  'last_update_date',
  'last_updated_by',
];

export type CreateData<
  PrimaryKey extends Record<string, any>,
  Data extends Record<string, any>,
> = PrimaryKey & Data;

export type UpdateData<Data extends Record<string, any>> = Partial<Data>;

export type Row<
  PrimaryKey extends Record<string, any>,
  Data extends Record<string, any>,
  System extends Record<string, any> = Record<string, never>,
> = Required<PrimaryKey & Data & Audit & System>;

export abstract class BaseService<
  PrimaryKey extends Record<string, any>,
  Data extends Record<string, any>,
  System extends Record<string, any> = Record<string, never>,
> {
  readonly columnNames: string[];
  query = {} as Query;
  primaryKey = {} as PrimaryKey;
  createData = {} as CreateData<PrimaryKey, Data>;
  audit = {} as Audit;
  system = {} as System;
  createdRow = {} as Row<PrimaryKey, Data, System>;
  row = {} as Row<PrimaryKey, Data, System>;
  updateData = {} as UpdateData<Data>;
  updatedRow = {} as Row<PrimaryKey, Data, System>;

  /**
   * Constructs a new instance of the BaseService class.
   * @param debugSource - a string identifying the source of debug messages
   * @param tableName - the name of the database table
   * @param primaryKeyColumnNames - an array of column names that make up the primary key
   * @param dataColumnNames - an array of column names that store data
   * @param systemColumnNames - an array of column names that store system data
   */
  constructor(
    readonly debugSource: string,
    readonly tableName: string,
    readonly primaryKeyColumnNames: string[],
    readonly dataColumnNames: string[],
    readonly systemColumnNames: string[] = [],
  ) {
    // Combine all relevant column names into a single array
    // for easy access throughout the class.
    this.columnNames = [
      ...primaryKeyColumnNames,
      ...dataColumnNames,
      ...auditColumnNames,
      ...systemColumnNames,
    ];
  }

  /**
   * Creates a new row in the database table.
   * @param query - a Query object for the database connection
   * @param createData - the data to insert into the table
   * @param userUUID - an optional user UUID to set in the audit columns
   * @returns a Promise that resolves to the inserted row
   */
  async create(
    query: Query,
    createData: CreateData<PrimaryKey, Data>,
    userUUID?: string,
  ): Promise<Row<PrimaryKey, Data, System>> {
    this.query = query;
    const debug = new Debug(`${this.debugSource}.create(base)`);
    debug.write(
      MessageType.Entry,
      `createData=${JSON.stringify(createData)}` +
        (typeof userUUID != 'undefined' ? `;userUUID=$userUUID}` : ''),
    );
    this.primaryKey = pickObjectKeys(
      createData,
      this.primaryKeyColumnNames,
    ) as PrimaryKey;
    debug.write(
      MessageType.Value,
      `this.primaryKey=${JSON.stringify(this.primaryKey)}`,
    );
    if (
      Object.keys(this.primaryKey).length == this.primaryKeyColumnNames.length
    ) {
      debug.write(MessageType.Step, 'Checking primary key...');
      await checkPrimaryKey(this.query, this.tableName, this.primaryKey);
    }
    this.createData = Object.assign({}, createData);
    this.audit = {};
    if (typeof userUUID != 'undefined') {
      this.audit.created_by = this.audit.last_updated_by = userUUID;
    }
    this.system = {} as System;
    await this.preCreate();
    debug.write(MessageType.Step, 'Creating row...');
    this.createdRow = (await createRow(
      this.query,
      this.tableName,
      { ...this.createData, ...this.audit, ...this.system },
      this.columnNames,
    )) as Row<PrimaryKey, Data, System>;
    debug.write(
      MessageType.Value,
      `this.createdRow=${JSON.stringify(this.createdRow)}`,
    );
    await this.postCreate();
    debug.write(
      MessageType.Exit,
      `this.createdRow=${JSON.stringify(this.createdRow)}`,
    );
    return this.createdRow;
  }

  /**
   * Find rows in the database table.
   * @param query - a Query object for the database connection
   * @returns a Promise that resolves when the rows are found
   */
  async find(query: Query) {
    this.query = query;
    const debug = new Debug(`${this.debugSource}.find(base)`);
    await this.preFind();
    debug.write(MessageType.Step, 'Finding rows...');
    await this.postFind();
    debug.write(MessageType.Exit);
  }

  /**
   * Finds a single row in the database table by primary key.
   * @param query - a Query object for the database connection
   * @param primaryKey - the primary key of the row to find
   * @returns a Promise that resolves to the found row
   */
  async findOne(
    query: Query,
    primaryKey: PrimaryKey,
  ): Promise<Row<PrimaryKey, Data, System>> {
    this.query = query;
    const debug = new Debug(`${this.debugSource}.findOne(base)`);
    debug.write(MessageType.Entry, `primaryKey=${JSON.stringify(primaryKey)}`);
    this.primaryKey = Object.assign({}, primaryKey);
    await this.preFindOne();
    debug.write(MessageType.Step, 'Finding row...');
    this.row = (await findByPrimaryKey(
      this.query,
      this.tableName,
      this.primaryKey,
      {
        columnNames: this.columnNames,
      },
    )) as Row<PrimaryKey, Data, System>;
    debug.write(MessageType.Value, `this.row=${JSON.stringify(this.row)}`);
    await this.postFindOne();
    debug.write(MessageType.Exit, `this.row=${JSON.stringify(this.row)}`);
    return this.row;
  }

  /**
   * Updates a single row in the database table by primary key.
   * @param query - a Query object for the database connection
   * @param primaryKey - the primary key of the row to update
   * @param updateData - the data to update in the row
   * @param userUUID - an optional user UUID to set in the audit columns
   * @returns a Promise that resolves to the updated row
   */
  async update(
    query: Query,
    primaryKey: PrimaryKey,
    updateData: UpdateData<Data>,
    userUUID?: string,
  ): Promise<Row<PrimaryKey, Data, System>> {
    this.query = query;
    const debug = new Debug(`${this.debugSource}.update(base)`);
    debug.write(
      MessageType.Entry,
      `primaryKey=${JSON.stringify(primaryKey)};` +
        `updateData=${JSON.stringify(updateData)}` +
        (typeof userUUID != 'undefined' ? `;userUUID=${userUUID}` : ''),
    );
    this.primaryKey = Object.assign({}, primaryKey);
    debug.write(MessageType.Step, 'Finding row by primary key...');
    this.row = (await findByPrimaryKey(
      this.query,
      this.tableName,
      this.primaryKey,
      {
        columnNames: this.columnNames,
        forUpdate: true,
      },
    )) as Row<PrimaryKey, Data, System>;
    debug.write(MessageType.Value, `this.row=${JSON.stringify(this.row)}`);
    const mergedRow = Object.assign({}, this.row, updateData);
    if (
      !areObjectsEqual(
        pickObjectKeys(mergedRow, this.dataColumnNames),
        pickObjectKeys(this.row, this.dataColumnNames),
      )
    ) {
      this.updateData = Object.assign({}, updateData);
      this.audit = {};
      this.audit.last_update_date = new Date();
      if (typeof userUUID != 'undefined') {
        this.audit.last_updated_by = userUUID;
      }
      this.system = {} as System;
      await this.preUpdate();
      debug.write(MessageType.Step, 'Updating row...');
      this.updatedRow = (await updateRow(
        this.query,
        this.tableName,
        this.primaryKey,
        { ...this.updateData, ...this.audit, ...this.system },
        this.columnNames,
      )) as Row<PrimaryKey, Data, System>;
      debug.write(
        MessageType.Value,
        `this.updatedRow=${JSON.stringify(this.updatedRow)}`,
      );
      await this.postUpdate();
      debug.write(
        MessageType.Exit,
        `this.updatedRow=${JSON.stringify(this.updatedRow)}`,
      );
      return this.updatedRow;
    } else {
      debug.write(MessageType.Exit, `this.row=${JSON.stringify(this.row)}`);
      return this.row;
    }
  }

  /**
   * Deletes a row in the database table by primary key.
   * @param query - a Query object for the database connection
   * @param primaryKey - the primary key of the row to delete
   * @returns a Promise that resolves when the row is deleted
   */
  async delete(query: Query, primaryKey: PrimaryKey): Promise<void> {
    this.query = query;
    const debug = new Debug(`${this.debugSource}.delete(base)`);
    debug.write(MessageType.Entry, `primaryKey=${JSON.stringify(primaryKey)}`);
    this.primaryKey = Object.assign({}, primaryKey);
    debug.write(MessageType.Step, 'Finding row by primary key...');
    this.row = (await findByPrimaryKey(
      this.query,
      this.tableName,
      this.primaryKey,
      {
        forUpdate: true,
      },
    )) as Row<PrimaryKey, Data, System>;
    debug.write(MessageType.Value, `this.row=${JSON.stringify(this.row)}`);
    await this.preDelete();
    debug.write(MessageType.Step, 'Deleting row...');
    await deleteRow(this.query, this.tableName, this.primaryKey);
    await this.postDelete();
    debug.write(MessageType.Exit);
  }

  /**
   * Called before a row is inserted into the database table.
   * @returns a Promise that resolves when the pre-hook is complete
   */
  async preCreate(): Promise<void> {}

  /**
   * Called before rows are found in the database table.
   * @returns a Promise that resolves when the pre-hook is complete
   */
  async preFind(): Promise<void> {}

  /**
   * Called before a row is found in the database table by primary key.
   * @returns a Promise that resolves when the pre-hook is complete
   */
  async preFindOne(): Promise<void> {}

  /**
   * Called before a row is updated in the database table by primary key.
   * @returns a Promise that resolves when the pre-hook is complete
   */
  async preUpdate(): Promise<void> {}

  /**
   * Called before a row is deleted from the database table by primary key.
   * @returns a Promise that resolves when the pre-hook is complete
   */
  async preDelete(): Promise<void> {}

  /**
   * Called after a row is inserted into the database table.
   * @returns a Promise that resolves when the post-hook is complete
   */
  async postCreate(): Promise<void> {}

  /**
   * Called after rows are found in the database table.
   * @returns a Promise that resolves when the post-hook is complete
   */
  async postFind(): Promise<void> {}

  /**
   * Called after a row is found in the database table by primary key.
   * @returns a Promise that resolves when the post-hook is complete
   */
  async postFindOne(): Promise<void> {}

  /**
   * Called after a row is updated in the database table by primary key.
   * @returns a Promise that resolves when the post-hook is complete
   */
  async postUpdate(): Promise<void> {}

  /**
   * Called after a row is deleted from the database table by primary key.
   * @returns a Promise that resolves when the post-hook is complete
   */
  async postDelete(): Promise<void> {}
}
