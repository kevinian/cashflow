import { Component, ViewChild } from '@angular/core';
import { ModalController, Content } from 'ionic-angular';
import * as _ from 'lodash';
import * as moment from 'moment';

import { DetailPage } from '../detail/detail';
import { TransactionService } from '../../providers/transaction-service';

@Component({
  selector: 'page-summary',
  templateUrl: 'summary.html'
})
export class SummaryPage {
  @ViewChild(Content) content: Content;
  private thisMonthTotalExpense: number = 0;
  private thisMonthTotalIncome: number = 0;
  private lastMonthTotalExpense: number = 0;
  private lastMonthTotalIncome: number = 0;

  constructor(private modalCtrl: ModalController, private transactionService: TransactionService) {
  }
  
  ionViewDidLoad() {
    this.transactionService.retrieve(undefined, 0, {
      startDate: moment().startOf('month').format('YYYY-MM-DD'),
      endDate: moment().endOf('month').format('YYYY-MM-DD')
    })
      .then((transactions) => {
        this.thisMonthTotalExpense = _.sumBy(transactions, 'amount');
      })
      .catch((err) => {
        console.log(err);
      });
    this.transactionService.retrieve(undefined, 0, {
      startDate: moment().subtract(1, 'months').startOf('month').format('YYYY-MM-DD'),
      endDate: moment().subtract(1, 'months').endOf('month').format('YYYY-MM-DD')
    })
      .then((transactions) => {
        this.lastMonthTotalExpense = _.sumBy(transactions, 'amount');
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
    modal.present();
  }

}
