import * as later from 'later';
import * as moment from 'moment';

import { DataService } from './data-service';

export class CronService extends DataService {
  constructor() {
    super();
    this._collection = 'cron';
  }
  
  getOccurences(sched, ...args) {
    let occurrences = sched.next(...args);
    if (typeof occurrences === 'number') { // no occurrences, result is 0
      return [];
    }
    if (typeof occurrences === 'date') { // only one occurrences, result is date
      return [occurrences];
    }
    // more occurrences, result is array
    return occurrences;
  }
  
  runJobForCron(job, cron) {
    let bulk = [];
    let sched = later.schedule(later.parse.cron(cron.fireInterval));
    let startDate = new Date(cron.fireAt);
    let endDate = new Date();
    let transactions = [];
    // Retrieve all occurrences
    do {
      let occurrences = this.getOccurences(sched, 5, startDate, endDate);
      transactions = occurrences.map((date) => {
        let transaction = Object.assign({}, cron.transaction);
        transaction.date = moment(date).format('YYYY-MM-DD');
        return transaction;
      });
      if (occurrences.length > 0) {
        bulk.push.apply(bulk, transactions);
        startDate = this.getOccurences(sched, 2, occurrences.pop())[1];
      }
    } while (transactions.length === 5);
    cron.fireAt = moment(startDate).format('YYYY-MM-DD');
    // Update this cron
    if (bulk.length > 0) {
      super.replaceOrCreate(cron);
    }
    return job(bulk);
  }
  
  runJobForAllCrons(job) {
    return super.retrieve()
      .then((crons) => {
        let bulk = [];
        crons = crons.map((cron) => {
          let sched = later.schedule(later.parse.cron(cron.fireInterval));
          let startDate = new Date(cron.fireAt);
          let endDate = new Date();
          let transactions = [];
          // Retrieve all occurrences
          do {
            let occurrences = this.getOccurences(sched, 5, startDate, endDate);
            transactions = occurrences.map((date) => {
              let transaction = Object.assign({}, cron.transaction);
              transaction.date = moment(date).format('YYYY-MM-DD');
              return transaction;
            });
            if (occurrences.length > 0) {
              bulk.push.apply(bulk, transactions);
              startDate = this.getOccurences(sched, 2, occurrences.pop())[1];
            }
          } while (transactions.length === 5);
          cron.fireAt = moment(startDate).format('YYYY-MM-DD');
          return cron;
        });
        // Update all crons
        if (bulk.length > 0) {
          super.bulkReplaceOrCreate(crons);
        }
        return job(bulk);
      });
  }

}
