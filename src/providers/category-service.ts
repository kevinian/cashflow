import { DataService } from './data-service';

export class CategoryService extends DataService {
  constructor() {
    super();
    this._collection = 'category';
  }
  
}