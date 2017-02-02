import { DataService } from './data-service';
import * as PouchDB from 'pouchdb';

export class TransactionService extends DataService {
  private _indexes = [
    {fields: ['date']}, 
    {fields: ['amount']},
    {fields: ['category']},
    {fields: ['date', 'amount']},
    {fields: ['date', 'category']},
    {fields: ['amount', 'category']},
    {fields: ['date', 'amount', 'category']}
  ];
  
  constructor() {
    super();
    this._collection = 'transaction';
    PouchDB.on('created', (dbName) => {
      if (this._dbName === dbName) {
        this.ensureIndexes();
      }
    });
  }
  
  ensureIndexes() {
    // Ensure indexes have been created before find
    return Promise.all(this._indexes.map(index => this._db.createIndex({index: index})));
  }
  
  beforeFind() {
    if (this._db) {
      return this.ensureIndexes();
    }
    // Ensure db connection has been created before find
    return super.init().then(() => {
      return this.ensureIndexes();
    });
  }
  
  retrieve(limit?, skip?, query?: { startDate?: string, endDate?: string, minAmount?: number, maxAmount?: number, category?: string }, sort?: Array<any>) {
    let selector = { $and: [] };
    selector['$and'].push({ _id: { $gte: `${this._collection}_` } });
    selector['$and'].push({ _id: { $lte: `${this._collection}_\uffff` } });
    let sortProperty;
    if (sort && sort.length > 0) {
      sortProperty = Object.keys(sort[0])[0];
    }
    let hasAdditionalSelector = false;
    if (query && query.startDate) {
      selector['$and'].push({ 
        date: {'$gte': query.startDate} 
      });
      if (sortProperty && sortProperty === 'date') {
        hasAdditionalSelector = true;
      }
    }
    if (query && query.endDate) {
      selector['$and'].push({ 
        date: {'$lte': query.endDate} 
      });
      if (sortProperty && sortProperty === 'date') {
        hasAdditionalSelector = true;
      }
    }
    if (query && query.minAmount) {
      selector['$and'].push({ 
        amount: {'$gte': query.minAmount} 
      });
      if (sortProperty && sortProperty === 'amount') {
        hasAdditionalSelector = true;
      }
    }
    if (query && query.maxAmount) {
      selector['$and'].push({ 
        amount: {'$lte': query.maxAmount} 
      });
      if (sortProperty && sortProperty === 'amount') {
        hasAdditionalSelector = true;
      }
    }
    if (query && query.category) {
      selector['$and'].push({ 
        category: query.category
      });
      if (sortProperty && sortProperty === 'category') {
        hasAdditionalSelector = true;
      }
    }
    if (sortProperty && !hasAdditionalSelector) {
      let additionalSelector = {};
      additionalSelector[sortProperty] = { $gt: null };
      selector['$and'].push(additionalSelector);
    }
    return this.beforeFind().then(() => {
      let options: any = {
        selector: selector
      };
      if (limit) {
        options.limit = limit;
      }
      if (skip) {
        options.skip = skip;
      }
      if (sort) {
        options.sort = sort;
      }
      return this._db
        .find(options)
        .then(result => result.docs);
    });
  }
  
  search(term?: string) {
    // Sort option is impossible here, use default sort by _id
    return this.beforeFind().then(() => {
      let options: any = {
        selector: {
          $and: [
            { _id: { $gte: `${this._collection}_` } },
            { _id: { $lte: `${this._collection}_\uffff` } },
            {
              $or: [{
                title: {$regex: '^.*' + term + '.*$'}
              }, {
                category: {$regex: '^.*' + term + '.*$'}
              }]
            }
          ]
        },
        limit: 100
      };
      return this._db
        .find(options)
        .then((result) => {
          return result.docs;
        });
    });
  }
  
}
