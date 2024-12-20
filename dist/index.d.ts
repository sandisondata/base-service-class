import { Query } from 'database';
export { Query };
export type Audit = {
    creation_date?: Date;
    created_by?: string;
    last_update_date?: Date;
    last_updated_by?: string;
};
export type CreateData<PrimaryKey extends Record<string, any>, Data extends Record<string, any>> = PrimaryKey & Data;
export type Row<PrimaryKey extends Record<string, any>, Data extends Record<string, any>, System extends Record<string, any> = Record<string, never>> = Required<PrimaryKey & Data & Audit & System>;
export type UpdateData<Data extends Record<string, any>> = Partial<Data>;
export declare abstract class BaseService<PrimaryKey extends Record<string, any>, Data extends Record<string, any>, System extends Record<string, any> = Record<string, never>> {
    readonly name: string;
    readonly tableName: string;
    readonly primaryKeyColumnNames: string[];
    readonly dataColumnNames: string[];
    readonly systemColumnNames: string[];
    readonly columnNames: string[];
    query: Query;
    primaryKey: PrimaryKey;
    createData: CreateData<PrimaryKey, Data>;
    audit: Audit;
    system: System;
    createdRow: Row<PrimaryKey, Data, System>;
    row: Row<PrimaryKey, Data, System>;
    updateData: UpdateData<Data>;
    updatedRow: Row<PrimaryKey, Data, System>;
    /**
     * Constructs a new instance of the BaseService class.
     * @param name - a string identifying the name of the service
     * @param tableName - the name of the database table
     * @param primaryKeyColumnNames - an array of column names that make up the primary key
     * @param dataColumnNames - an array of column names that store data
     * @param systemColumnNames - an optional array of column names that store system data
     */
    constructor(name: string, tableName: string, primaryKeyColumnNames: string[], dataColumnNames: string[], systemColumnNames?: string[]);
    /**
     * Creates a new row in the database table.
     * @param query - a Query object for the database connection
     * @param createData - the data to insert into the table
     * @param userUUID - an optional user UUID to set in the audit columns
     * @returns a Promise that resolves to the inserted row
     */
    create(query: Query, createData: CreateData<PrimaryKey, Data>, userUUID?: string): Promise<Row<PrimaryKey, Data, System>>;
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
    findOne(query: Query, primaryKey: Required<PrimaryKey>): Promise<Row<PrimaryKey, Data, System>>;
    /**
     * Updates a single row in the database table by primary key.
     * @param query - a Query object for the database connection
     * @param primaryKey - the primary key of the row to update
     * @param updateData - the data to update in the row
     * @param userUUID - an optional user UUID to set in the audit columns
     * @returns a Promise that resolves to the updated row
     */
    update(query: Query, primaryKey: Required<PrimaryKey>, updateData: UpdateData<Data>, userUUID?: string): Promise<Row<PrimaryKey, Data, System>>;
    /**
     * Deletes a row in the database table by primary key.
     * @param query - a Query object for the database connection
     * @param primaryKey - the primary key of the row to delete
     * @returns a Promise that resolves when the row is deleted
     */
    delete(query: Query, primaryKey: Required<PrimaryKey>): Promise<void>;
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
     * Called before a row is updated in the database table by primary key.
     * @returns a Promise that resolves when the pre-hook is complete
     */
    preUpdate(): Promise<void>;
    /**
     * Called before a row is deleted from the database table by primary key.
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
     * Called after a row is updated in the database table by primary key.
     * @returns a Promise that resolves when the post-hook is complete
     */
    postUpdate(): Promise<void>;
    /**
     * Called after a row is deleted from the database table by primary key.
     * @returns a Promise that resolves when the post-hook is complete
     */
    postDelete(): Promise<void>;
}
