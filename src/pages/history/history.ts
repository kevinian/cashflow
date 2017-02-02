import { Component, ViewChild } from '@angular/core';
import { Platform, Content, ModalController, LoadingController, ToastController, NavParams, List } from 'ionic-angular';

import { DetailPage } from '../detail/detail';
import { TransactionService } from '../../providers/transaction-service';
import { CategoryService } from '../../providers/category-service';
import { CronService } from '../../providers/cron-service';

@Component({
  selector: 'page-history',
  templateUrl: 'history.html'
})
export class HistoryPage {
  @ViewChild(Content) content: Content;
  @ViewChild(List) list: List;
  private events: any;
  private transactions = [];
  private categories = [];
  public crons = [];
  private showToolbar: boolean = false;
  private showFilter: boolean = false;
  private searchTerm: string = '';
  private limit: number = 10;
  private skip: number = 0;
  private sortProperty: string = 'date';
  private sortDirection: string = 'desc';
  private get sort(){
    let sort = {};
    sort[this.sortProperty] = this.sortDirection;
    return [sort];
  }
  private set sort(sort) {
    if (Array.isArray(sort) && sort.length > 0) {
      let pair = sort[0];
      for (let key in pair) {
        if (pair.hasOwnProperty(key)) {
          this.sortProperty = key;
          this.sortDirection = pair[key];
          return;
        }
      }
    }
  }
  private startDate: string;
  private endDate: string;
  private minAmount: number;
  private maxAmount: number;
  private category: string = '';
  private get selector() {
    return {
      startDate: this.startDate,
      endDate: this.endDate,
      minAmount: this.minAmount,
      maxAmount: this.maxAmount,
      category: this.category
    };
  };
  private set selector(selector: { startDate?: string, endDate?: string, minAmount?: number, maxAmount?: number, category?: string }) {
    this.startDate = selector.startDate;
    this.endDate = selector.endDate;
    this.minAmount = selector.minAmount;
    this.maxAmount = selector.maxAmount;
    this.category = selector.category || '';
  }

  constructor(private platform: Platform,
    private modalCtrl: ModalController,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
    private navParams: NavParams,
    private transactionService: TransactionService,
    private categoryService: CategoryService,
    private cronService: CronService) {
      this.events = navParams.data.events;
  }
  
  ionViewDidLoad() {
    this.events.subscribe('refreshHistoryTab', () => {
      this.reset();
    });
    this.transactionService.retrieve(this.limit, this.skip, this.selector, this.sort)
      .then((transactions) => {
        this.transactions.push.apply(this.transactions, transactions);
        this.skip = this.transactions.length;
      })
      .catch(console.error.bind(console));
  }
  
  convertToNumber(value) {
    return +value;
  }
  
  scrollToTop() {
    this.content.scrollToTop();
  }
  
  toggleToolbar() {
    this.categoryService.retrieve()
      .then((categories) => {
        this.categories = categories;
        this.showToolbar = !this.showToolbar;
        this.content.resize();
      })
      .catch(console.error.bind(console));
  }
  
  reset() {
    this.selector = {};
    this.sort = [{ date: 'desc' }];
    this.skip = 0;
    this.transactionService.retrieve(this.limit, this.skip, this.selector, this.sort)
      .then(transactions => {
        this.transactions = []; // Clear stale
        this.transactions.push.apply(this.transactions, transactions);
        this.skip = this.transactions.length;
      })
      .catch(console.error.bind(console));
    this.searchTerm = '';
  }
  
  applyFilter() {
    let loading = this.loadingCtrl.create({
      content: '设置过滤器...'
    });
    loading.present();
    this.skip = 0;
    this.transactionService.retrieve(this.limit, this.skip, this.selector, this.sort)
      .then(transactions => {
        loading.dismiss();
        this.toggleToolbar();
        this.transactions = []; // Clear stale
        this.transactions.push.apply(this.transactions, transactions);
        this.skip = this.transactions.length;
      })
      .catch((err) => {
        console.log(err);
      });
    this.searchTerm = '';
  }
  
  resetFilter() {
    let loading = this.loadingCtrl.create({
      content: '重置过滤器...'
    });
    loading.present();
    // Reset default filter
    this.selector = {};
    this.sort = [{ date: 'desc' }];
    this.skip = 0;
    this.transactionService.retrieve(this.limit, this.skip, this.selector, this.sort)
      .then(transactions => {
        loading.dismiss();
        this.toggleToolbar();
        this.transactions = []; // Clear stale
        this.transactions.push.apply(this.transactions, transactions);
        this.skip = this.transactions.length;
      })
      .catch(console.error.bind(console));
    this.searchTerm = '';
  }
  
  edit(index) {
    this.list.closeSlidingItems();
    let modal = this.modalCtrl.create(DetailPage, { transaction: this.transactions[index] });
    modal.onDidDismiss((transaction) => {
      if (transaction) {
        this.transactions[index] = transaction;
        this.events.publish('refreshSummaryTab');
      }
    });
    modal.present();
  }
  
  remove(index) {
    this.list.closeSlidingItems();
    let transaction = this.transactions[index];
    console.log('remove transaction', transaction);
    this.transactionService.remove(transaction).then(() => {
      let toast = this.toastCtrl.create({
        message: '已删除',
        duration: 1000
      });
      toast.present();
      this.transactions.splice(index, 1);
      this.events.publish('refreshSummaryTab');
    })
    .catch((err) => {
      console.log('remove error', err);
      let toast = this.toastCtrl.create({
        message: '删除失败，请刷新后重试！',
        showCloseButton: true,
        closeButtonText: '确定？'
      });
      toast.present();
    });
  }
  
  doRefresh(refresher) {
    this.searchTerm = '';
    let job = (bulk) => {
      return this.transactionService.bulkReplaceOrCreate(bulk);
    };
    this.cronService.runJobForAllCrons(job).then((bulk) =>{
      // Retrieve all transactions
      this.skip = 0;
      this.transactionService.retrieve(this.limit, this.skip, this.selector, this.sort)
        .then(transactions => {
          this.transactions = []; // Clear stale
          this.transactions.push.apply(this.transactions, transactions);
          this.skip = this.transactions.length;
          refresher.complete();
        })
        .catch(console.error.bind(console));
      if (bulk.length > 0) {
        this.events.publish('refreshSummaryTab');
      }
    });
  }
  
  doInfinite(infiniteScroll) {
    if (this.searchTerm && this.searchTerm.trim() !== '') {
      infiniteScroll.complete();
    } else {
      this.transactionService.retrieve(this.limit, this.skip, this.selector, this.sort)
        .then(transactions => {
          this.transactions.push.apply(this.transactions, transactions);
          this.skip = this.transactions.length;
          infiniteScroll.complete();
        })
        .catch(console.error.bind(console));
    }
  }
  
  search() {
    if (this.searchTerm && this.searchTerm.trim() !== '') {
      this.transactionService.search(this.searchTerm).then((transactions) => {
        this.transactions = transactions;
        this.skip = this.transactions.length;
      });
    } else {
      this.skip = 0;
      this.transactionService.retrieve(this.limit, this.skip, this.selector, this.sort)
        .then(transactions => {
          this.transactions = [];
          this.transactions.push.apply(this.transactions, transactions);
          this.skip = this.transactions.length;
        })
        .catch(console.error.bind(console));
    }
  }

}
