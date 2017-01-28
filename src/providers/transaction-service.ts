import { DataService } from './data-service';

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
    this.ensureIndexes();
  }
  
  ensureIndexes() {
    return Promise.all(this._indexes.map(index => this._db.createIndex({index: index})))
  }
  
  retrieve(limit?, skip?, query?: { startDate?: string, endDate?: string, minAmount?: number, maxAmount?: number, category?: string }, sort?: string) {
    let selector = { $and: [] };
    if (query) {
      if (query.startDate) {
        selector['$and'].push({ 
          date: {'$gte': query.startDate} 
        });
      }
      if (query.endDate) {
        selector['$and'].push({ 
          date: {'$lte': query.endDate} 
        });
      }
      if (query.minAmount) {
        selector['$and'].push({ 
          amount: {'$gte': query.minAmount} 
        });
      }
      if (query.maxAmount) {
        selector['$and'].push({ 
          amount: {'$lte': query.maxAmount} 
        });
      }
      // TODO: categories
      if (query.category) {
        selector['$and'].push({ 
          category: query.category
        });
      }
    }
    if (selector['$and'].length > 0) {
      console.log('retrieve', limit, skip, selector);
      return this.ensureIndexes().then(() => {
        let options: any = {
          selector: selector,
          sort: sort
        };
        if (limit) {
          options.limit = limit;
        }
        if (skip) {
          options.skip = skip;
        }
        return this._db
          .find(options)
          .then((result) => {
            return result.docs;
          });
      });
    } else {
      return super.retrieve(limit, skip);
    }
  }
  
  search(term?: string) {
    return this.ensureIndexes().then(() => {
      let options: any = {
        selector: {
          _id: {$gte: null},
          $or: [{
            title: {$regex: '^.*' + term + '.*$'}
          }, {
            category: {$regex: '^.*' + term + '.*$'}
          }]
        }
      };
      return this._db
        .find(options)
        .then((result) => {
          return result.docs;
        });
    });
  }
  
}
