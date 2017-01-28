import { Component } from '@angular/core';
import { ViewController, NavParams } from 'ionic-angular';

/*
  Generated class for the Popover page.

  See http://ionicframework.com/docs/v2/components/#navigation for more info on
  Ionic pages and navigation.
*/
@Component({
  selector: 'page-popover',
  templateUrl: 'popover.html'
})
export class PopoverPage {
  private charts: Array<any> = [];

  constructor(private viewCtrl: ViewController,
    private navParams: NavParams) {}

  ionViewDidLoad() {
    this.charts =  this.navParams.get('charts').map(chart => Object.assign({}, chart));
  }
  
  select(chartId) {
    this.charts.forEach((chart) => {
      chart.isSelected = chartId === chart.id;
    });
    this.viewCtrl.dismiss(this.charts);
  }

}
