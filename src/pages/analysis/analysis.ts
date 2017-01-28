import { Component, ViewChild } from '@angular/core';
import { Content, PopoverController } from 'ionic-angular';
import * as _ from 'lodash';
import * as moment from 'moment';

import { PopoverPage } from '../popover/popover';
import { TransactionService } from '../../providers/transaction-service';

@Component({
  selector: 'page-analysis',
  templateUrl: 'analysis.html'
})
export class AnalysisPage {
  @ViewChild(Content) content: Content;
  private isLineChartLoading: boolean = false;
  private lineCharts: Array<any> = [{
    id: 1,
    label: '近三月',
    isSelected: true
  }, {
    id: 2,
    label: '近六月',
    isSelected: false
  }];
  private lineChartLabel: string;
  private lineChartType: string = 'line';
  private lineChartOptions: any = {
    responsive: true,
    maintainAspectRatio: false
  };
  private lineChartColors: Array<any> = [
    { // grey
      backgroundColor: 'rgba(148,159,177,0.2)',
      borderColor: 'rgba(148,159,177,1)',
      pointBackgroundColor: 'rgba(148,159,177,1)',
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: 'rgba(148,159,177,0.8)'
    }
  ];
  private lineChartLabels: Array<any> = [];
  private lineChartData: Array<any> = [
    {data: []}
  ];
  private isPieChartLoading = false;
  private pieCharts: Array<any> = [{
    id: 1,
    label: '当前',
    isSelected: true
  }, {
    id: 2,
    label: '上月',
    isSelected: false
  }];
  private pieChartLabel: string;
  private pieChartType: string = 'pie';
  private pieChartOptions: any = {
    responsive: true,
    maintainAspectRatio: false
  };
  private pieChartLabels: any[] = [];
  private pieChartData: any[] = [];

  constructor(private popoverCtrl: PopoverController, private transactionService: TransactionService) {

  }
  
  ionViewDidLoad() {
    this.buildLineChart();
    this.buildPieChart();
  }
  
  scrollToTop() {
    this.content.scrollToTop();
  }
  
  getSelectedChart(charts) {
    return charts.find(chart => chart.isSelected);
  }
  
  presentLineChartOptions(event) {
    let popover = this.popoverCtrl.create(PopoverPage, {charts: this.lineCharts});
    popover.onDidDismiss((changed) => {
      if (changed) {
        let currentChart = this.getSelectedChart(this.lineCharts);
        let changedChart = this.getSelectedChart(changed);
        if (currentChart.id !== changedChart.id) {
          this.lineCharts = changed;
          this.buildLineChart();
        }
      }
    });
    popover.present({ ev: event });
  }
  
  getLineChartDataSet(startDate, endDate) {
    return this.transactionService.retrieve(undefined, 0, {
      startDate: startDate,
      endDate: endDate
    })
      .then((transactions) => {
        return _.chain(transactions)
          .map((transaction) => {
            transaction.date = moment(transaction.date).format('MMM');
            return transaction;
          })
          .groupBy('date')
          .map((group) => {
            return {
              month: group[0].date,
              sum: _.sumBy(group, 'amount')
            };
          })
          .value();
      })
      .catch((err) => {
        console.log(err);
      });
  }
  
  buildLineChart() {
    this.isLineChartLoading = true;
    let currentChart = this.getSelectedChart(this.lineCharts);
    this.lineChartLabel = currentChart.label;
    let startDate;
    let endDate;
    if (currentChart.id === 1) {
      startDate = moment().subtract(2, 'months').startOf('month').format('YYYY-MM-DD');
    } else if (currentChart.id === 2) {
      startDate = moment().subtract(5, 'months').startOf('month').format('YYYY-MM-DD');
    }
    endDate = moment().endOf('month').format('YYYY-MM-DD');
    if (startDate && endDate) {
      this.getLineChartDataSet(startDate, endDate).then((dataSet) => {
        // Use timeout because of user experience
        // chart.js draw graph much more faster if no data exists
        let timeout = this.lineChartLabels.length === 0 ? 50 : 0;
        this.isLineChartLoading = false;
        setTimeout(() => {
          this.lineChartLabels = _.map(dataSet, 'month');
          this.lineChartData = [{
            data: _.map(dataSet, 'sum'),
            label: '上三个月'
          }];
        }, timeout);
      });
    }
  }
  
  presentPieChartOptions(event) {
    let popover = this.popoverCtrl.create(PopoverPage, {charts: this.pieCharts});
    popover.onDidDismiss((changed) => {
      if (changed) {
        let currentChart = this.getSelectedChart(this.pieCharts);
        let changedChart = this.getSelectedChart(changed);
        if (currentChart.id !== changedChart.id) {
          this.pieCharts = changed;
          this.buildPieChart();
        }
      }
    });
    popover.present({ ev: event });
  }
  
  getPieChartDataSet(startDate, endDate) {
    return this.transactionService.retrieve(undefined, 0, {
      startDate: startDate,
      endDate: endDate
    })
      .then((transactions) => {
        return _.chain(transactions)
         .groupBy('category')
         .map((group) => {
           return {
             category: group[0].category,
             sum: _.sumBy(group, 'amount')
           };
         })
         .value();
      })
      .catch((err) => {
        console.log(err);
      });
  }
  
  buildPieChart() {
    this.isPieChartLoading = true;
    let currentChart = this.getSelectedChart(this.pieCharts);
    this.pieChartLabel = currentChart.label;
    let startDate;
    let endDate
    if (currentChart.id === 1) {
      startDate = moment().startOf('month').format('YYYY-MM-DD');
      endDate = moment().endOf('month').format('YYYY-MM-DD');
    } else if (currentChart.id === 2) {
      startDate = moment().subtract(1, 'months').startOf('month').format('YYYY-MM-DD');
      endDate = moment().subtract(1, 'months').endOf('month').format('YYYY-MM-DD');
    }
    if (startDate && endDate) {
      this.getPieChartDataSet(startDate, endDate).then((dataSet) => {
        let timeout = this.pieChartLabels.length === 0 ? 50 : 0;
        this.isPieChartLoading = false;
        setTimeout(() => {
          this.pieChartLabels = _.map(dataSet, 'category');
          this.pieChartData = _.map(dataSet, 'sum');
        }, timeout);
      });
    }
  }
  
  // Bar Chart
  public barChartOptions:any = {
    scaleShowVerticalLines: false,
    responsive: true,
    maintainAspectRatio: false
  };
  public barChartLabels:string[] = ['2006', '2007', '2008', '2009', '2010', '2011', '2012'];
  public barChartType:string = 'bar';
  public barChartLegend:boolean = true;

  public barChartData:any[] = [
    {data: [65, 59, 80, 81, 56, 55, 40], label: 'Series A'},
    {data: [28, 48, 40, 19, 86, 27, 90], label: 'Series B'}
  ];
  
  // events
  public chartClicked(e:any):void {
    // console.log(e);
  }

  public chartHovered(e:any):void {
    // console.log(e);
  }

}
