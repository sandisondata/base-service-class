import { Query } from 'database';
type CreateData<PrimaryKey, Data> = PrimaryKey & Data;
type Audit = {
    creation_date?: Date;
    created_by?: string;
    last_update_date?: Date;
    last_updated_by?: string;
};
type Row<PrimaryKey, Data, isAuditable, System> = Required<PrimaryKey> & Required<Data> & (isAuditable extends true ? Required<Audit> : Record<string, never>) & Required<System>;
type UpdateData<Data> = Partial<Data>;
declare abstract class Service<PrimaryKey extends Record<string, string | number>, Data extends Record<string, any>, isAuditable extends boolean = true, System extends Record<string, any> = Record<string, never>> {
    readonly debugSource: string;
    readonly tableName: string;
    readonly primaryKeyColumnNames: string[];
    readonly dataColumnNames: string[];
    readonly isAuditable: boolean;
    readonly systemColumnNames: string[];
    columnNames: string[];
    query: Query;
    primaryKey: PrimaryKey;
    createData: CreateData<PrimaryKey, Data>;
    system: System;
    row: Row<PrimaryKey, Data, isAuditable, System>;
    updateData: UpdateData<Data>;
    oldRow: Row<PrimaryKey, Data, isAuditable, System>;
    /**
     * Constructs a new instance of the Service class.
     * @param debugSource - a string identifying the source of debug messages
     * @param tableName - the name of the database table
     * @param primaryKeyColumnNames - an array of column names that make up the primary key
     * @param dataColumnNames - an array of column names that store data
     * @param isAuditable - a boolean indicating if the table has audit columns
     * @param systemColumnNames - an array of column names that store system data
     */
    constructor(debugSource: string, tableName: string, primaryKeyColumnNames: string[], dataColumnNames: string[], isAuditable?: boolean, systemColumnNames?: string[]);
    /**
     * Creates a new row in the database table.
     * @param query - a Query object for the database connection
     * @param createData - the data to insert into the table
     * @param userUUId - an optional user UUID to set in the audit columns
     * @returns a Promise that resolves to the inserted row
     */
    create(query: Query, createData: CreateData<PrimaryKey, Data>, userUUId?: string): Promise<Row<PrimaryKey, Data, isAuditable, System>>;
    /**
     * Find rows in the database table.
     * @param query - a Query object for the database connection
     * @returns a Promise that resolves when the rows are found
     */
    find(query: Query): Promise<void>;
    /**
     * Finds a single row in the database table by primary key.
     * @param query - a Query object for the database connection
     * @param primaryKey - the primary key of the row to find
     * @returns a Promise that resolves to the found row
     */
    findOne(query: Query, primaryKey: PrimaryKey): Promise<Row<PrimaryKey, Data, isAuditable, System>>;
    /**
     * Updates a single row in the database table by primary key.
     * @param query - a Query object for the database connection
     * @param primaryKey - the primary key of the row to update
     * @param updateData - the data to update in the row
     * @param userUUId - an optional user UUID to set in the audit columns
     * @returns a Promise that resolves to the updated row
     */
    update(query: Query, primaryKey: PrimaryKey, updateData: UpdateData<Data>, userUUId?: string): Promise<Row<PrimaryKey, Data, isAuditable, System>>;
    /**
     * Deletes a row in the database table by primary key.
     * @param query - a Query object for the database connection
     * @param primaryKey - the primary key of the row to delete
     * @returns a Promise that resolves when the row is deleted
     */
    delete(query: Query, primaryKey: PrimaryKey): Promise<void>;
    /**
     * Called before a row is inserted into the database table.
     * @returns a Promise that resolves when the pre-hook is complete
     */
    preCreate(): Promise<void>;
    /**
     * Called before rows are found in the database table.
     * @returns a Promise that resolves when the pre-hook is complete
     */
    preFind(): Promise<void>;
    /**
     * Called before a row is found in the database table by primary key.
     * @returns a Promise that resolves when the pre-hook is complete
     */
    preFindOne(): Promise<void>;
    /**
     * Called before a row is updated in the database table.
     * @returns a Promise that resolves when the pre-hook is complete
     */
    preUpdate(): Promise<void>;
    /**
     * Called before a row is deleted from the database table.
     * @returns a Promise that resolves when the pre-hook is complete
     */
    preDelete(): Promise<void>;
    /**
     * Called after a row is inserted into the database table.
     * @returns a Promise that resolves when the post-hook is complete
     */
    postCreate(): Promise<void>;
    /**
     * Called after rows are found in the database table.
     * @returns a Promise that resolves when the post-hook is complete
     */
    postFind(): Promise<void>;
    /**
     * Called after a row is found in the database table by primary key.
     * @returns a Promise that resolves when the post-hook is complete
     */
    postFindOne(): Promise<void>;
    /**
     * Called after a row is updated in the database table.
     * @returns a Promise that resolves when the post-hook is complete
     */
    postUpdate(): Promise<void>;
    /**
     * Called after a row is deleted from the database table.
     * @returns a Promise that resolves when the post-hook is complete
     */
    postDelete(): Promise<void>;
}
export { Query, CreateData, Row, UpdateData, Service };
