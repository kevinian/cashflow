import { Component } from '@angular/core';
import { ViewController, NavParams, ToastController } from 'ionic-angular';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import * as math from 'mathjs';
import * as later from 'later';

import { TransactionService } from '../../providers/transaction-service';
import { CategoryService } from '../../providers/category-service';
import { CronService } from '../../providers/cron-service';

/*
  Generated class for the Detail page.

  See http://ionicframework.com/docs/v2/components/#navigation for more info on
  Ionic pages and navigation.
*/
@Component({
  selector: 'page-detail',
  templateUrl: 'detail.html'
})
export class DetailPage {
  public originalTransaction: any = {};
  private transaction: any = {};
  private categories = [];
  private detailForm: FormGroup;
  private type: string = 'expense';
  private showCategoryEditor: boolean = false;
  private showCalculator: boolean = false;
  private newCategory: string = '';
  private expression: string = '';
  private scheduler: string = 'never';

  constructor(private viewCtrl: ViewController,
    private navParams: NavParams,
    private toastCtrl: ToastController,
    private formBuilder: FormBuilder,
    private transactionService: TransactionService,
    private categoryService: CategoryService,
    private cronService: CronService) {
    this.detailForm = this.formBuilder.group({
      title: [''],
      date: [''],
      category: ['', Validators.required],
      amount: ['', Validators.required],
      description: ['']
    });
  }

  ionViewDidLoad() {
    let editTransaction = this.navParams.get('transaction');
    if (editTransaction) {
      this.transaction = Object.assign({}, editTransaction);
      this.originalTransaction = editTransaction;
    } else {
      this.transaction = {
        title: '',
        date: new Date().toISOString().slice(0, 10),
        category: '',
        amount: undefined,
        description: ''
      };
      this.originalTransaction = this.transaction;
    }
    this.categoryService.retrieve()
      .then(categories => {
        this.categories = categories;
      })
      .catch(console.error.bind(console));
  }
  
  convertToNumber(value) {
    return +value;
  }
  
  toggleCategoryEditor() {
    this.showCategoryEditor = !this.showCategoryEditor;
  }
  
  addCategory() {
    let category = {
      id: `categories_${this.newCategory}`,
      name: this.newCategory
    };
    this.categoryService.replaceOrCreate(category).then(() => {
      let toast = this.toastCtrl.create({
        message: '已添加',
        duration: 2000
      });
      toast.present();
      this.newCategory = '';
      this.toggleCategoryEditor();
      this.categories.push(category);
    })
    .catch((err) => {
      let toast = this.toastCtrl.create({
        message: '添加失败，请重试！',
        showCloseButton: true,
        closeButtonText: '确定？'
      });
      toast.present();
    });
  }
  
  toggleCalculator() {
    this.showCalculator = !this.showCalculator;
  }
  
  addToExpression(value) {
    this.expression += value;
  }
  
  calculate() {
    this.expression = math.eval(this.expression);
  }
  
  applyAmount() {
    let amount = Number(this.expression);
    if(!isNaN(amount)) {
      this.transaction.amount = amount;
    }
    this.expression = '';
    this.toggleCalculator();
  }
  
  getFireInterval() {
    let fireAt = new Date(this.transaction.date);
    let day = later.day.val(fireAt);
    let month = later.month.val(fireAt);
    let dayOfWeek = later.dayOfWeek.val(fireAt);
    if (this.scheduler === 'weekly') {
      return `0 0 * * ${dayOfWeek} ?`;
    }
    
    if (this.scheduler === 'monthly') {
      if (day > 28) {
        return `0 0 L * ? ?`;
      } else {
        return `0 0 ${day} * ? ?`;
      }
    }
    
    if (this.scheduler === 'yearly') {
      return `0 0 ${day} ${month} ? ?`;
    }
  }
  
  save() {
    this.transaction.date = this.transaction.date.slice(0, 10);
    if (this.scheduler === 'never') {
      this.transactionService.replaceOrCreate(this.transaction).then((result) => {
        this.transaction._rev = result.rev;
        let toast = this.toastCtrl.create({
          message: '已保存',
          duration: 2000
        });
        toast.present();
      })
      .catch((err) => {
        let toast = this.toastCtrl.create({
          message: '保存失败，请刷新后重试！',
          showCloseButton: true,
          closeButtonText: '确定？'
        });
        toast.present();
      });
    } else {
      // add cron job
      let cron = {
        fireInterval: this.getFireInterval(),
        fireAt: this.transaction.date,
        transaction: this.transaction
      };
      this.cronService.replaceOrCreate(cron).then((result) => {
        let toast = this.toastCtrl.create({
          message: '已保存',
          duration: 2000
        });
        toast.present();
      })
      .catch((err) => {
        let toast = this.toastCtrl.create({
          message: '保存失败，请刷新后重试！',
          showCloseButton: true,
          closeButtonText: '确定？'
        });
        toast.present();
      });
    }
    this.viewCtrl.dismiss(this.transaction);
  }
  
  cancel() {
    this.viewCtrl.dismiss(this.originalTransaction);
  }
  
}