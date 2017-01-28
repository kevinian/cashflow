import { Component, ViewChild } from '@angular/core';
import { Platform, Content, ModalController, LoadingController, ToastController, List } from 'ionic-angular';
import * as later from 'later';

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
  private transactions = [];
  private categories = [];
  public crons = [];
  private limit: number = 10;
  private skip: number = 0;
  private searchTerm: string = '';
  // Default filter
  private startDate: string;
  private endDate: string;
  private minAmount: number;
  private maxAmount: number;
  private category: string = '';
  
  private showToolbar: boolean = false;
  private showFilter: boolean = false;

  constructor(private platform: Platform,
    private modalCtrl: ModalController,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
    private transactionService: TransactionService,
    private categoryService: CategoryService,
    private cronService: CronService) {
  }
  
  ionViewDidLoad() {
    this.transactionService.retrieve(this.limit, this.skip)
      .then((transactions) => {
        // console.log('history list', transactions);
        this.transactions.push.apply(this.transactions, transactions);
        this.skip = this.transactions.length;
        // required for test
        if (this.transactions.length === 0) {
          this.transactionService.ensureIndexes().then(() => {
            let promises = [];
            for (let i=0;i<50;i++) {
              promises[i] = this.transactionService.replaceOrCreate({
                title: '标题 ' + i,
                date: new Date().toISOString().slice(0, 10),
                category: '分类 ' + i,
                amount: i,
                description: '描述 ' + i
              });
            }
            Promise.all(promises).then(() => {
              this.transactionService.retrieve(this.limit, this.skip)
                .then(transactions => {
                  this.transactions.push.apply(this.transactions, transactions);
                  this.skip = this.transactions.length;
                })
                .catch(console.error.bind(console));
            });
          });
        }
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
  
  applyFilter() {
    let loading = this.loadingCtrl.create({
      content: '设置过滤器...'
    });
    loading.present();
    this.skip = 0;
    this.transactionService.retrieve(this.limit, this.skip, {
      startDate: this.startDate,
      endDate: this.endDate,
      minAmount: this.minAmount,
      maxAmount: this.maxAmount,
      category: this.category
    })
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
    this.startDate = undefined;
    this.endDate = undefined;
    this.minAmount = undefined;
    this.maxAmount = undefined;
    this.category = '';
    this.skip = 0;
    this.transactionService.retrieve(this.limit, this.skip)
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
        duration: 2000
      });
      toast.present();
      this.transactions.splice(index, 1);
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
  
  doRefresh(refresher) {
    // Retrieve all cron jobs
    this.cronService.retrieve()
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
              transaction.date = date.toISOString().slice(0, 10);
              return transaction;
            });
            if (occurrences.length > 0) {
              bulk.push.apply(bulk, transactions);
              startDate = this.getOccurences(sched, 2, occurrences.pop())[1];
            }
          } while (transactions.length === 5);
          cron.fireAt = startDate.toISOString().slice(0, 10);
          return cron;
        });
        this.transactionService.bulkReplaceOrCreate(bulk)
          .then(() => {
            // Retrieve all transactions
            this.skip = 0;
            this.transactionService.retrieve(this.limit, this.skip)
              .then(transactions => {
                this.transactions = []; // Clear stale
                this.transactions.push.apply(this.transactions, transactions);
                this.skip = this.transactions.length;
                refresher.complete();
              })
              .catch(console.error.bind(console));
          })
          .catch(console.error.bind(console));
        console.log('update crons', crons);
        // Update all cron jobs
        if (bulk.length > 0) {
          this.cronService.bulkReplaceOrCreate(crons);
        }
      })
      .catch(console.error.bind(console));
    this.searchTerm = '';
  }
  
  doInfinite(infiniteScroll) {
    if (this.searchTerm && this.searchTerm.trim() !== '') {
      infiniteScroll.complete();
    } else {
      this.transactionService.retrieve(this.limit, this.skip, {
        startDate: this.startDate,
        endDate: this.endDate,
        minAmount: this.minAmount,
        maxAmount: this.maxAmount,
        category: this.category
      })
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
      this.transactionService.retrieve(this.limit, this.skip)
        .then(transactions => {
          this.transactions = [];
          this.transactions.push.apply(this.transactions, transactions);
          this.skip = this.transactions.length;
        })
        .catch(console.error.bind(console));
    }
  }

}
