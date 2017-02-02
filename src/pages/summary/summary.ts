import { Component, ViewChild } from '@angular/core';
import { ModalController, Content, NavParams } from 'ionic-angular';
import * as _ from 'lodash';
import * as moment from 'moment';
moment.locale('zh-cn');

import { DetailPage } from '../detail/detail';
import { TransactionService } from '../../providers/transaction-service';

@Component({
  selector: 'page-summary',
  templateUrl: 'summary.html'
})
export class SummaryPage {
  @ViewChild(Content) content: Content;
  private events: any;
  private thisMonthTotalExpense: number = 0;
  private thisMonthTotalIncome: number = 0;
  private lastMonthTotalExpense: number = 0;
  private lastMonthTotalIncome: number = 0;

  constructor(private modalCtrl: ModalController, 
    private navParams: NavParams,
    private transactionService: TransactionService) {
    this.events = navParams.data.events;
  }
  
  ionViewDidLoad() {
    this.events.subscribe('refreshSummaryTab', () => {
      this.calculate();
    });
    this.calculate();
  }
  
  calculate() {
    this.transactionService.retrieve(undefined, 0, {
      startDate: moment().startOf('month').format('YYYY-MM-DD'),
      endDate: moment().endOf('month').format('YYYY-MM-DD')
    })
      .then((transactions) => {
        let partitions = _.partition(transactions, transaction => transaction['type'] === 'income');
        this.thisMonthTotalIncome = _.sumBy(partitions[0], 'amount');
        this.thisMonthTotalExpense = _.sumBy(partitions[1], 'amount');
      })
      .catch((err) => {
        console.log(err);
      });
    this.transactionService.retrieve(undefined, 0, {
      startDate: moment().subtract(1, 'months').startOf('month').format('YYYY-MM-DD'),
      endDate: moment().subtract(1, 'months').endOf('month').format('YYYY-MM-DD')
    })
      .then((transactions) => {
        let partitions = _.partition(transactions, transaction => transaction['type'] === 'income');
        this.lastMonthTotalIncome = _.sumBy(partitions[0], 'amount');
        this.lastMonthTotalExpense = _.sumBy(partitions[1], 'amount');
      })
      .catch((err) => {
        console.log(err);
      });
  }
  
  scrollToTop() {
    this.content.scrollToTop();
  }
  
  presentModal() {
    let modal = this.modalCtrl.create(DetailPage);
    modal.onDidDismiss((transaction) => {
      if (transaction) {
        this.events.publish('refreshSummaryTab');
        this.events.publish('refreshHistoryTab');
      }
    });
    modal.present();
  }

}
