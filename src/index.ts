import { Query } from 'database';
import {
  checkPrimaryKey,
  createRow,
  deleteRow,
  findByPrimaryKey,
  updateRow,
} from 'database-helpers';
import { Debug, MessageType } from 'node-debug';
import { objectsEqual, pick } from 'node-utilities';

export { Query };

export type CreateData<PrimaryKey, Data> = PrimaryKey & Data;

export type Row<PrimaryKey, Data, System> = Required<PrimaryKey> &
  Required<Data> &
  Required<System>;

export type UpdateData<Data> = Partial<Data>;

export abstract class Service<
  PrimaryKey extends Record<string, string | number>,
  Data extends Record<string, any>,
  System extends Record<string, any> = Record<string, never>,
> {
  columnNames: string[];
  query: Query = {} as Query;
  primaryKey: PrimaryKey = {} as PrimaryKey;
  createData: CreateData<PrimaryKey, Data> = {} as CreateData<PrimaryKey, Data>;
  updateData: UpdateData<Data> = {} as UpdateData<Data>;
  systemData: System = {} as System;
  row: Row<PrimaryKey, Data, System> = {} as Row<PrimaryKey, Data, System>;

  constructor(
    readonly debugSource: string,
    readonly tableName: string,
    readonly primaryKeyColumnNames: string[],
    readonly dataColumnNames: string[],
    readonly systemColumnNames: string[] = [],
  ) {
    this.columnNames = [
      ...primaryKeyColumnNames,
      ...dataColumnNames,
      ...systemColumnNames,
    ];
  }

  async create(query: Query, createData: CreateData<PrimaryKey, Data>) {
    this.query = query;
    const debug = new Debug(`${this.debugSource}.create`);
    debug.write(MessageType.Entry, `createData=${JSON.stringify(createData)}`);
    this.primaryKey = pick(
      createData,
      this.primaryKeyColumnNames,
    ) as PrimaryKey;
    debug.write(
      MessageType.Value,
      `this.primaryKey=${JSON.stringify(this.primaryKey)}`,
    );
    this.createData = Object.assign({}, createData);
    this.systemData = {} as System;
    if (Object.keys(this.primaryKey).length) {
      debug.write(MessageType.Step, 'Checking primary key...');
      await checkPrimaryKey(this.query, this.tableName, this.primaryKey);
    }
    await this.preCreate();
    debug.write(MessageType.Step, 'Creating row...');
    this.row = (await createRow(
      this.query,
      this.tableName,
      { ...this.createData, ...this.systemData },
      this.columnNames,
    )) as Row<PrimaryKey, Data, System>;
    debug.write(MessageType.Value, `this.row=${JSON.stringify(this.row)}`);
    await this.postCreate();
    debug.write(MessageType.Exit, `this.row=${JSON.stringify(this.row)}`);
    return this.row;
  }

  async find(query: Query) {
    this.query = query;
    const debug = new Debug(`${this.debugSource}.find`);
    await this.preFind();
    await this.postFind();
    debug.write(MessageType.Exit);
  }

  async findOne(query: Query, primaryKey: PrimaryKey) {
    this.query = query;
    const debug = new Debug(`${this.debugSource}.findOne`);
    debug.write(MessageType.Entry, `primaryKey=${JSON.stringify(primaryKey)}`);
    this.primaryKey = Object.assign({}, primaryKey);
    debug.write(
      MessageType.Value,
      `this.primaryKey=${JSON.stringify(this.primaryKey)}`,
    );
    await this.preFindOne();
    this.row = (await findByPrimaryKey(
      this.query,
      this.tableName,
      this.primaryKey,
      {
        columnNames: [],
      },
    )) as Row<PrimaryKey, Data, System>;
    debug.write(MessageType.Value, `this.row=${JSON.stringify(this.row)}`);
    await this.postFindOne();
    debug.write(MessageType.Exit, `this.row=${JSON.stringify(this.row)}`);
    return this.row;
  }

  async update(
    query: Query,
    primaryKey: PrimaryKey,
    updateData: UpdateData<Data>,
  ) {
    this.query = query;
    const debug = new Debug(`${this.debugSource}.update`);
    debug.write(
      MessageType.Entry,
      `primaryKey=${JSON.stringify(primaryKey)};updateData=${JSON.stringify(updateData)}`,
    );
    this.primaryKey = Object.assign({}, primaryKey);
    this.updateData = Object.assign({}, updateData);
    this.systemData = {} as System;
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
    const mergedRow = Object.assign({}, this.row, this.updateData);
    if (
      !objectsEqual(
        pick(mergedRow, this.dataColumnNames),
        pick(this.row, this.dataColumnNames),
      )
    ) {
      await this.preUpdate();
      debug.write(MessageType.Step, 'Updating row...');
      this.row = (await updateRow(
        this.query,
        this.tableName,
        this.primaryKey,
        { ...this.updateData, ...this.systemData },
        this.columnNames,
      )) as Row<PrimaryKey, Data, System>;
      debug.write(MessageType.Value, `this.row=${JSON.stringify(this.row)}`);
      await this.postUpdate();
    }
    debug.write(MessageType.Exit, `this.row=${JSON.stringify(this.row)}`);
    return this.row;
  }

  async delete(query: Query, primaryKey: PrimaryKey) {
    this.query = query;
    const debug = new Debug(`${this.debugSource}.delete`);
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

  // Pre-hooks
  async preCreate() {}
  async preFind() {}
  async preFindOne() {}
  async preUpdate() {}
  async preDelete() {}

  // Post-hooks
  async postCreate() {}
  async postFind() {}
  async postFindOne() {}
  async postUpdate() {}
  async postDelete() {}
}
