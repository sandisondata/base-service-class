"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseService = void 0;
const database_helpers_1 = require("database-helpers");
const node_debug_1 = require("node-debug");
const node_utilities_1 = require("node-utilities");
const auditColumnNames = [
    'creation_date',
    'created_by',
    'last_update_date',
    'last_updated_by',
];
class BaseService {
    /**
     * Constructs a new instance of the BaseService class.
     * @param name - a string identifying the name of the service
     * @param tableName - the name of the database table
     * @param primaryKeyColumnNames - an array of column names that make up the primary key
     * @param dataColumnNames - an array of column names that store data
     * @param systemColumnNames - an optional array of column names that store system data
     */
    constructor(name, tableName, primaryKeyColumnNames, dataColumnNames, systemColumnNames = []) {
        this.name = name;
        this.tableName = tableName;
        this.primaryKeyColumnNames = primaryKeyColumnNames;
        this.dataColumnNames = dataColumnNames;
        this.systemColumnNames = systemColumnNames;
        this.query = {};
        this.primaryKey = {};
        this.createData = {};
        this.audit = {};
        this.system = {};
        this.createdRow = {};
        this.row = {};
        this.updateData = {};
        this.updatedRow = {};
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
    create(query, createData, userUUID) {
        return __awaiter(this, void 0, void 0, function* () {
            this.query = query;
            const debug = new node_debug_1.Debug(`${this.name}.create(base)`);
            debug.write(node_debug_1.MessageType.Entry, `createData=${JSON.stringify(createData)}` +
                (typeof userUUID != 'undefined' ? `;userUUID=$userUUID}` : ''));
            this.primaryKey = (0, node_utilities_1.pickObjectKeys)(createData, this.primaryKeyColumnNames);
            debug.write(node_debug_1.MessageType.Value, `this.primaryKey=${JSON.stringify(this.primaryKey)}`);
            if (Object.keys(this.primaryKey).length == this.primaryKeyColumnNames.length) {
                debug.write(node_debug_1.MessageType.Step, 'Checking primary key...');
                yield (0, database_helpers_1.checkPrimaryKey)(this.query, this.tableName, this.primaryKey);
            }
            this.createData = Object.assign({}, createData);
            this.audit = {};
            if (typeof userUUID != 'undefined') {
                this.audit.created_by = this.audit.last_updated_by = userUUID;
            }
            this.system = {};
            yield this.preCreate();
            debug.write(node_debug_1.MessageType.Step, 'Creating row...');
            this.createdRow = (yield (0, database_helpers_1.createRow)(this.query, this.tableName, Object.assign(Object.assign(Object.assign({}, this.createData), this.audit), this.system), this.columnNames));
            debug.write(node_debug_1.MessageType.Value, `this.createdRow=${JSON.stringify(this.createdRow)}`);
            yield this.postCreate();
            debug.write(node_debug_1.MessageType.Exit, `this.createdRow=${JSON.stringify(this.createdRow)}`);
            return this.createdRow;
        });
    }
    /**
     * Find rows in the database table.
     * @param query - a Query object for the database connection
     * @returns a Promise that resolves when the rows are found
     */
    find(query) {
        return __awaiter(this, void 0, void 0, function* () {
            this.query = query;
            const debug = new node_debug_1.Debug(`${this.name}.find(base)`);
            yield this.preFind();
            debug.write(node_debug_1.MessageType.Step, 'Finding rows...');
            yield this.postFind();
            debug.write(node_debug_1.MessageType.Exit);
        });
    }
    /**
     * Finds a single row in the database table by primary key.
     * @param query - a Query object for the database connection
     * @param primaryKey - the primary key of the row to find
     * @returns a Promise that resolves to the found row
     */
    findOne(query, primaryKey) {
        return __awaiter(this, void 0, void 0, function* () {
            this.query = query;
            const debug = new node_debug_1.Debug(`${this.name}.findOne(base)`);
            debug.write(node_debug_1.MessageType.Entry, `primaryKey=${JSON.stringify(primaryKey)}`);
            this.primaryKey = Object.assign({}, primaryKey);
            yield this.preFindOne();
            debug.write(node_debug_1.MessageType.Step, 'Finding row...');
            this.row = (yield (0, database_helpers_1.findByPrimaryKey)(this.query, this.tableName, this.primaryKey, {
                columnNames: this.columnNames,
            }));
            debug.write(node_debug_1.MessageType.Value, `this.row=${JSON.stringify(this.row)}`);
            yield this.postFindOne();
            debug.write(node_debug_1.MessageType.Exit, `this.row=${JSON.stringify(this.row)}`);
            return this.row;
        });
    }
    /**
     * Updates a single row in the database table by primary key.
     * @param query - a Query object for the database connection
     * @param primaryKey - the primary key of the row to update
     * @param updateData - the data to update in the row
     * @param userUUID - an optional user UUID to set in the audit columns
     * @returns a Promise that resolves to the updated row
     */
    update(query, primaryKey, updateData, userUUID) {
        return __awaiter(this, void 0, void 0, function* () {
            this.query = query;
            const debug = new node_debug_1.Debug(`${this.name}.update(base)`);
            debug.write(node_debug_1.MessageType.Entry, `primaryKey=${JSON.stringify(primaryKey)};` +
                `updateData=${JSON.stringify(updateData)}` +
                (typeof userUUID != 'undefined' ? `;userUUID=${userUUID}` : ''));
            this.primaryKey = Object.assign({}, primaryKey);
            debug.write(node_debug_1.MessageType.Step, 'Finding row by primary key...');
            this.row = (yield (0, database_helpers_1.findByPrimaryKey)(this.query, this.tableName, this.primaryKey, {
                columnNames: this.columnNames,
                forUpdate: true,
            }));
            debug.write(node_debug_1.MessageType.Value, `this.row=${JSON.stringify(this.row)}`);
            const mergedRow = Object.assign({}, this.row, updateData);
            if (!(0, node_utilities_1.areObjectsEqual)((0, node_utilities_1.pickObjectKeys)(mergedRow, this.dataColumnNames), (0, node_utilities_1.pickObjectKeys)(this.row, this.dataColumnNames))) {
                this.updateData = Object.assign({}, updateData);
                this.audit = {};
                this.audit.last_update_date = new Date();
                if (typeof userUUID != 'undefined') {
                    this.audit.last_updated_by = userUUID;
                }
                this.system = {};
                yield this.preUpdate();
                debug.write(node_debug_1.MessageType.Step, 'Updating row...');
                this.updatedRow = (yield (0, database_helpers_1.updateRow)(this.query, this.tableName, this.primaryKey, Object.assign(Object.assign(Object.assign({}, this.updateData), this.audit), this.system), this.columnNames));
                debug.write(node_debug_1.MessageType.Value, `this.updatedRow=${JSON.stringify(this.updatedRow)}`);
                yield this.postUpdate();
                debug.write(node_debug_1.MessageType.Exit, `this.updatedRow=${JSON.stringify(this.updatedRow)}`);
                return this.updatedRow;
            }
            else {
                debug.write(node_debug_1.MessageType.Exit, `this.row=${JSON.stringify(this.row)}`);
                return this.row;
            }
        });
    }
    /**
     * Deletes a row in the database table by primary key.
     * @param query - a Query object for the database connection
     * @param primaryKey - the primary key of the row to delete
     * @returns a Promise that resolves when the row is deleted
     */
    delete(query, primaryKey) {
        return __awaiter(this, void 0, void 0, function* () {
            this.query = query;
            const debug = new node_debug_1.Debug(`${this.name}.delete(base)`);
            debug.write(node_debug_1.MessageType.Entry, `primaryKey=${JSON.stringify(primaryKey)}`);
            this.primaryKey = Object.assign({}, primaryKey);
            debug.write(node_debug_1.MessageType.Step, 'Finding row by primary key...');
            this.row = (yield (0, database_helpers_1.findByPrimaryKey)(this.query, this.tableName, this.primaryKey, {
                forUpdate: true,
            }));
            debug.write(node_debug_1.MessageType.Value, `this.row=${JSON.stringify(this.row)}`);
            yield this.preDelete();
            debug.write(node_debug_1.MessageType.Step, 'Deleting row...');
            yield (0, database_helpers_1.deleteRow)(this.query, this.tableName, this.primaryKey);
            yield this.postDelete();
            debug.write(node_debug_1.MessageType.Exit);
        });
    }
    /**
     * Called before a row is inserted into the database table.
     * @returns a Promise that resolves when the pre-hook is complete
     */
    preCreate() {
        return __awaiter(this, void 0, void 0, function* () { });
    }
    /**
     * Called before rows are found in the database table.
     * @returns a Promise that resolves when the pre-hook is complete
     */
    preFind() {
        return __awaiter(this, void 0, void 0, function* () { });
    }
    /**
     * Called before a row is found in the database table by primary key.
     * @returns a Promise that resolves when the pre-hook is complete
     */
    preFindOne() {
        return __awaiter(this, void 0, void 0, function* () { });
    }
    /**
     * Called before a row is updated in the database table by primary key.
     * @returns a Promise that resolves when the pre-hook is complete
     */
    preUpdate() {
        return __awaiter(this, void 0, void 0, function* () { });
    }
    /**
     * Called before a row is deleted from the database table by primary key.
     * @returns a Promise that resolves when the pre-hook is complete
     */
    preDelete() {
        return __awaiter(this, void 0, void 0, function* () { });
    }
    /**
     * Called after a row is inserted into the database table.
     * @returns a Promise that resolves when the post-hook is complete
     */
    postCreate() {
        return __awaiter(this, void 0, void 0, function* () { });
    }
    /**
     * Called after rows are found in the database table.
     * @returns a Promise that resolves when the post-hook is complete
     */
    postFind() {
        return __awaiter(this, void 0, void 0, function* () { });
    }
    /**
     * Called after a row is found in the database table by primary key.
     * @returns a Promise that resolves when the post-hook is complete
     */
    postFindOne() {
        return __awaiter(this, void 0, void 0, function* () { });
    }
    /**
     * Called after a row is updated in the database table by primary key.
     * @returns a Promise that resolves when the post-hook is complete
     */
    postUpdate() {
        return __awaiter(this, void 0, void 0, function* () { });
    }
    /**
     * Called after a row is deleted from the database table by primary key.
     * @returns a Promise that resolves when the post-hook is complete
     */
    postDelete() {
        return __awaiter(this, void 0, void 0, function* () { });
    }
}
exports.BaseService = BaseService;
