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
  private pieChartLabels: Array<any> = [];
  private pieChartData: Array<any> = [];
  private isBarChartLoading: boolean = false;
  private barCharts: Array<any> = [{
    id: 1,
    label: '近三月',
    isSelected: true
  }, {
    id: 2,
    label: '近六月',
    isSelected: false
  }];
  private barChartLabel: string;
  private barChartType: string = 'bar';
  private barChartOptions: any = {
    scaleShowVerticalLines: false,
    responsive: true,
    maintainAspectRatio: false
  };
  private barChartLabels: Array<any> = [];
  private barChartData: Array<any> = [
    {data: []},
    {data: []}
  ];

  constructor(private popoverCtrl: PopoverController, private transactionService: TransactionService) {

  }
  
  ionViewDidLoad() {
    this.buildLineChart();
    this.buildBarChart();
    this.buildPieChart();
  }
  
  scrollToTop() {
    this.content.scrollToTop();
  }
  
  getSelectedChart(charts) {
    return charts.find(chart => chart.isSelected);
  }
  
  sumByMonth(startDate, endDate) {
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
            // Workaround for typescript compile error
            let partitions = _.partition(group, transaction => transaction['type'] === 'income');
            return {
              month: group[0].date,
              sum: {
                income: _.sumBy(partitions[0], 'amount'),
                expense: _.sumBy(partitions[1], 'amount')
              } 
            };
          })
          .value();
      })
      .catch((err) => {
        console.log(err);
      });
  }
  
  sumByCategory(startDate, endDate) {
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
      this.sumByMonth(startDate, endDate).then((dataSet) => {
        // Use timeout because of user experience
        // chart.js draw graph much more faster if no data exists
        let timeout = this.lineChartLabels.length === 0 ? 50 : 0;
        this.isLineChartLoading = false;
        setTimeout(() => {
          this.lineChartLabels = _.map(dataSet, 'month');
          this.lineChartData = [{
            data: _.map(dataSet, 'sum.expense')
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
      this.sumByCategory(startDate, endDate).then((dataSet) => {
        let timeout = this.pieChartLabels.length === 0 ? 50 : 0;
        this.isPieChartLoading = false;
        setTimeout(() => {
          this.pieChartLabels = _.map(dataSet, 'category');
          this.pieChartData = _.map(dataSet, 'sum');
        }, timeout);
      });
    }
  }

  presentBarChartOptions() {
    let popover = this.popoverCtrl.create(PopoverPage, {charts: this.barCharts});
    popover.onDidDismiss((changed) => {
      if (changed) {
        let currentChart = this.getSelectedChart(this.barCharts);
        let changedChart = this.getSelectedChart(changed);
        if (currentChart.id !== changedChart.id) {
          this.barCharts = changed;
          this.buildBarChart();
        }
      }
    });
    popover.present({ ev: event });
  }
  
  buildBarChart() {
    this.isBarChartLoading = true;
    let currentChart = this.getSelectedChart(this.barCharts);
    this.barChartLabel = currentChart.label;
    let startDate;
    let endDate;
    if (currentChart.id === 1) {
      startDate = moment().subtract(2, 'months').startOf('month').format('YYYY-MM-DD');
    } else if (currentChart.id === 2) {
      startDate = moment().subtract(5, 'months').startOf('month').format('YYYY-MM-DD');
    }
    endDate = moment().endOf('month').format('YYYY-MM-DD');
    if (startDate && endDate) {
      this.sumByMonth(startDate, endDate).then((dataSet) => {
        // Use timeout because of user experience
        // chart.js draw graph much more faster if no data exists
        let timeout = this.barChartLabels.length === 0 ? 50 : 0;
        this.isBarChartLoading = false;
        setTimeout(() => {
          this.barChartLabels = _.map(dataSet, 'month');
          this.barChartData = [{
            data: _.map(dataSet, 'sum.expense'),
            label: '支出'
          }, {
            data: _.map(dataSet, 'sum.income'),
            label: '收入'
          }];
        }, timeout);
      });
    }
  }

  // Events
  private chartClicked(e: any):void {
    // console.log(e);
  }

  private chartHovered(e: any):void {
    // console.log(e);
  }

}
