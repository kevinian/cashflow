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
    selector['$and'].push({ _id: { $gte: `${this._collection}_` } });
    selector['$and'].push({ _id: { $lte: `${this._collection}_\uffff` } });
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
      if (query.category) {
        selector['$and'].push({ 
          category: query.category
        });
      }
    }
    if (selector['$and'].length > 0) {
      return this.ensureIndexes().then(() => {
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
          options.sort = [sort];
        }
        return this._db
          .find(options)
          .then((result) => {
            // console.log('retrieve', limit, skip, selector, result);
            return result.docs;
          });
      });
    } else {
      return super.retrieve(limit, skip);
    }
  }
  
  search(term?: string) {
    // Sort option is impossible here, use default sort by _id
    return this.ensureIndexes().then(() => {
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
