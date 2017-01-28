import { DataService } from './data-service';

export class CronService extends DataService {
  constructor() {
    super();
    this._collection = 'cron';
  }

}
