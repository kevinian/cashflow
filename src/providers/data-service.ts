import { Injectable } from '@angular/core';
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
  protected _dbName: string = 'Cashflow';
  protected _dbOpts = { adapter: 'websql' };
  protected _db;
  protected _collection = '';

  constructor() {
    this.init();
  }
  
  init() {
    this._db = new PouchDB(this._dbName, this._dbOpts);
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
