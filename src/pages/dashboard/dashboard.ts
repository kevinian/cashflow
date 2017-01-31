import { Component } from '@angular/core';
import { Events } from 'ionic-angular';

import { SummaryPage } from '../summary/summary';
import { HistoryPage } from '../history/history';
import { AnalysisPage } from '../analysis/analysis';

@Component({
  templateUrl: 'dashboard.html'
})
export class DashboardPage {
  tabParams: any = {};
  
  // this tells the tabs component which Pages
  // should be each tab's root Page
  tab1Root: any = SummaryPage;
  tab2Root: any = HistoryPage;
  tab3Root: any = AnalysisPage;

  constructor(private events: Events) {
    this.tabParams = { events: events };
  }
}
