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
exports.AbstractService = void 0;
const database_helpers_1 = require("database-helpers");
const node_debug_1 = require("node-debug");
const node_utilities_1 = require("node-utilities");
class AbstractService {
    constructor(debugSource, tableName, primaryKeyColumnNames, dataColumnNames, systemColumnNames = []) {
        this.debugSource = debugSource;
        this.tableName = tableName;
        this.primaryKeyColumnNames = primaryKeyColumnNames;
        this.dataColumnNames = dataColumnNames;
        this.systemColumnNames = systemColumnNames;
        this.columnNames = [
            ...primaryKeyColumnNames,
            ...dataColumnNames,
            ...systemColumnNames,
        ];
    }
    create(query, createData) {
        return __awaiter(this, void 0, void 0, function* () {
            this.query = query;
            const debug = new node_debug_1.Debug(`${this.debugSource}.create`);
            debug.write(node_debug_1.MessageType.Entry, `createData=${JSON.stringify(createData)}`);
            this.primaryKey = (0, node_utilities_1.pick)(createData, this.primaryKeyColumnNames);
            debug.write(node_debug_1.MessageType.Value, `this.primaryKey=${JSON.stringify(this.primaryKey)}`);
            this.createData = Object.assign({}, createData);
            this.systemData = {};
            if (Object.keys(this.primaryKey).length) {
                debug.write(node_debug_1.MessageType.Step, 'Checking primary key...');
                yield (0, database_helpers_1.checkPrimaryKey)(this.query, this.tableName, this.primaryKey);
            }
            yield this.preCreate();
            debug.write(node_debug_1.MessageType.Step, 'Creating row...');
            this.row = (yield (0, database_helpers_1.createRow)(this.query, this.tableName, Object.assign(Object.assign({}, this.createData), this.systemData), this.columnNames));
            debug.write(node_debug_1.MessageType.Value, `this.row=${JSON.stringify(this.row)}`);
            yield this.postCreate();
            debug.write(node_debug_1.MessageType.Exit, `this.row=${JSON.stringify(this.row)}`);
            return this.row;
        });
    }
    find(query) {
        return __awaiter(this, void 0, void 0, function* () {
            this.query = query;
            const debug = new node_debug_1.Debug(`${this.debugSource}.find`);
            yield this.preFind();
            yield this.postFind();
            debug.write(node_debug_1.MessageType.Exit);
        });
    }
    findOne(query, primaryKey) {
        return __awaiter(this, void 0, void 0, function* () {
            this.query = query;
            const debug = new node_debug_1.Debug(`${this.debugSource}.findOne`);
            debug.write(node_debug_1.MessageType.Entry, `primaryKey=${JSON.stringify(primaryKey)}`);
            this.primaryKey = Object.assign({}, primaryKey);
            debug.write(node_debug_1.MessageType.Value, `this.primaryKey=${JSON.stringify(this.primaryKey)}`);
            yield this.preFindOne();
            this.row = (yield (0, database_helpers_1.findByPrimaryKey)(this.query, this.tableName, this.primaryKey, {
                columnNames: [],
            }));
            debug.write(node_debug_1.MessageType.Value, `this.row=${JSON.stringify(this.row)}`);
            yield this.postFindOne();
            debug.write(node_debug_1.MessageType.Exit, `this.row=${JSON.stringify(this.row)}`);
            return this.row;
        });
    }
    update(query, primaryKey, updateData) {
        return __awaiter(this, void 0, void 0, function* () {
            this.query = query;
            const debug = new node_debug_1.Debug(`${this.debugSource}.update`);
            debug.write(node_debug_1.MessageType.Entry, `primaryKey=${JSON.stringify(primaryKey)};updateData=${JSON.stringify(updateData)}`);
            this.primaryKey = Object.assign({}, primaryKey);
            this.updateData = Object.assign({}, updateData);
            this.systemData = {};
            debug.write(node_debug_1.MessageType.Step, 'Finding row by primary key...');
            this.row = (yield (0, database_helpers_1.findByPrimaryKey)(this.query, this.tableName, this.primaryKey, {
                columnNames: this.columnNames,
                forUpdate: true,
            }));
            debug.write(node_debug_1.MessageType.Value, `this.row=${JSON.stringify(this.row)}`);
            const mergedRow = Object.assign({}, this.row, this.updateData);
            if (!(0, node_utilities_1.objectsEqual)((0, node_utilities_1.pick)(mergedRow, this.dataColumnNames), (0, node_utilities_1.pick)(this.row, this.dataColumnNames))) {
                yield this.preUpdate();
                debug.write(node_debug_1.MessageType.Step, 'Updating row...');
                this.row = (yield (0, database_helpers_1.updateRow)(this.query, this.tableName, this.primaryKey, Object.assign(Object.assign({}, this.updateData), this.systemData), this.columnNames));
                debug.write(node_debug_1.MessageType.Value, `this.row=${JSON.stringify(this.row)}`);
                yield this.postUpdate();
            }
            debug.write(node_debug_1.MessageType.Exit, `this.row=${JSON.stringify(this.row)}`);
            return this.row;
        });
    }
    delete(query, primaryKey) {
        return __awaiter(this, void 0, void 0, function* () {
            this.query = query;
            const debug = new node_debug_1.Debug(`${this.debugSource}.delete`);
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
    // Pre-hooks
    preCreate() {
        return __awaiter(this, void 0, void 0, function* () { });
    }
    preFind() {
        return __awaiter(this, void 0, void 0, function* () { });
    }
    preFindOne() {
        return __awaiter(this, void 0, void 0, function* () { });
    }
    preUpdate() {
        return __awaiter(this, void 0, void 0, function* () { });
    }
    preDelete() {
        return __awaiter(this, void 0, void 0, function* () { });
    }
    // Post-hooks
    postCreate() {
        return __awaiter(this, void 0, void 0, function* () { });
    }
    postFind() {
        return __awaiter(this, void 0, void 0, function* () { });
    }
    postFindOne() {
        return __awaiter(this, void 0, void 0, function* () { });
    }
    postUpdate() {
        return __awaiter(this, void 0, void 0, function* () { });
    }
    postDelete() {
        return __awaiter(this, void 0, void 0, function* () { });
    }
}
exports.AbstractService = AbstractService;
