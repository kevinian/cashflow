import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage';
import { UUID } from 'angular2-uuid';
import * as PouchDB from 'pouchdb';
import * as FindPlugin from 'pouchdb-find';
PouchDB.plugin(FindPlugin);

/*
  Generated class for the DataService provider.

  See https://angular.io/docs/ts/latest/guide/dependency-injection.html
  for more info on providers and Angular 2 DI.
*/
@Injectable()
export class DataService {
  protected _storage;
  protected _dbName;
  protected _dbOpts = { adapter: 'websql', auto_compaction: true };
  protected _db;
  protected _collection = '';

  constructor() {
    this._storage = new Storage(['sqlite', 'websql', 'indexeddb'], { name: '_cashflow_Config' });
    this._storage.ready().then(() => {
      this.init();
    });
    PouchDB.on('destroyed', (dbName) => {
      if (this._dbName === dbName) {
        this.init();
      }
    });
  }
  
  init() {
    return this._storage.get('_dbName').then((dbName) => {
      this._dbName = dbName || 'Cashflow';
      this._db = new PouchDB(this._dbName, this._dbOpts);
      return this._storage.set('_dbName', this._dbName);
    });
  }
  
  reset() {
    return this._storage.set('_dbName', `Cashflow_${Date.now()}`).then(() => {
      return this._db.viewCleanup().then(() => {
        return this._db.destroy();
      });
    });
  }
  
  retrieve(limit?, skip?) {
    let options: any = {
      include_docs: true,
      startkey: `${this._collection}_`, 
      endkey: `${this._collection}_\uffff`
    };
    if (limit) {
      options.limit = limit;
    }
    if (skip) {
      options.skip = skip;
    }
    return this._db
      .allDocs(options)
      .then((result) => {
        return result.rows.map(row => row.doc);
      });
  }
  
  remove(document) {
    return this._db.remove(document);
  }
  
  replaceOrCreate(document) {
    if (!document._id) {
      document._id = `${this._collection}_${UUID.UUID()}`;
    }
    return this._db.put(document);
  }
  
  bulkReplaceOrCreate(documents) {
    documents = documents.map((document) => {
      if (!document._id) {
        document._id = `${this._collection}_${UUID.UUID()}`;
      }
      return document;
    });
    return this._db.bulkDocs(documents);
  }
  
  destroy() {
    return this.retrieve().then((documents) => {
      documents = documents.map((document) => {
        document._deleted = true;
        return document;
      });
      return this._db.bulkDocs(documents);
    });
  }

}
