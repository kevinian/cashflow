import { Component } from '@angular/core';
import { AlertController, ToastController } from 'ionic-angular';
import * as _ from 'lodash';

import { CategoryService } from '../../providers/category-service';
import { CronService } from '../../providers/cron-service';

@Component({
  selector: 'page-setting',
  templateUrl: 'setting.html'
})
export class SettingPage {
  private categories = [];
  private crons = [];

  constructor(private alertCtrl: AlertController,
    private toastCtrl: ToastController,
    private categoryService: CategoryService,
    private cronService: CronService) {
    
  }
  
  ionViewDidLoad() {
    this.categoryService.retrieve()
      .then((categories) => {
        this.categories = categories;
      })
      .catch(console.error.bind(console));
    this.cronService.retrieve()
      .then((crons) => {
        this.crons = crons;
      })
      .catch(console.error.bind(console));
  }
  
  presentAddNewCategory() {
    let alert = this.alertCtrl.create();
    alert.setTitle('添加新分类?');
    alert.setMessage('请输入一个新的分类名');
    alert.addInput({
      name: 'category',
      placeholder: '分类名'
    });
    alert.addButton('取消');
    alert.addButton({
      text: '确认',
      handler: data => {console.log('new', data);
        let newCategory = data.category;
        if (newCategory !== '') {
          let category = {
            id: `categories_${newCategory}`,
            name: newCategory
          };
          this.categoryService.replaceOrCreate(category).then(() => {
            let toast = this.toastCtrl.create({
              message: '已添加',
              duration: 1000
            });
            toast.present();
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
      }
    });
    alert.present();
  }
  
  presentDeleteCategories() {
    let alert = this.alertCtrl.create();
    alert.setTitle('删除哪些分类?');
    this.categories.forEach((category) => {
      alert.addInput({
        type: 'checkbox',
        label: category.name,
        value: category._id,
        checked: false
      });
    });
    alert.addButton('取消');
    alert.addButton({
      text: '确认',
      handler: data => {
        let categories = this.categories
          .filter(category => data.indexOf(category._id) !== -1)
          .map((category) => {
            category._deleted = true;
            return category;
          });
        if (categories.length > 0) {
          this.categoryService.bulkReplaceOrCreate(categories).then(() => {
            let toast = this.toastCtrl.create({
              message: '已删除',
              duration: 1000
            });
            toast.present();
            this.categories = _.differenceBy(this.categories, categories, '_id');
          })
          .catch((err) => {
            let toast = this.toastCtrl.create({
              message: '删除失败，请重试！',
              showCloseButton: true,
              closeButtonText: '确定？'
            });
            toast.present();
          });
        }
      }
    });
    alert.present();
  }
  
  presentDeleteCrons() {
    let alert = this.alertCtrl.create();
    alert.setTitle('删除哪些循环任务?');
    this.crons.forEach((cron) => {
      alert.addInput({
        type: 'checkbox',
        label: `${cron.transaction.category}， ${cron.transaction.title}`,
        value: cron._id,
        checked: false
      });
    });
    alert.addButton('取消');
    alert.addButton({
      text: '确认',
      handler: data => {
        let crons = this.crons
          .filter(cron => data.indexOf(cron._id) !== -1)
          .map((cron) => {
            cron._deleted = true;
            return cron;
          });
        if (crons.length > 0) {
          this.cronService.bulkReplaceOrCreate(crons).then(() => {
            let toast = this.toastCtrl.create({
              message: '已删除',
              duration: 1000
            });
            toast.present();
            this.crons = _.differenceBy(this.crons, crons, '_id');
          })
          .catch((err) => {
            let toast = this.toastCtrl.create({
              message: '删除失败，请重试！',
              showCloseButton: true,
              closeButtonText: '确定？'
            });
            toast.present();
          });
        }
      }
    });
    alert.present();
  }

}
