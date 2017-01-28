import { NgModule, ErrorHandler } from '@angular/core';
import { IonicApp, IonicModule, IonicErrorHandler } from 'ionic-angular';
import { ChartsModule } from 'ng2-charts/ng2-charts';
import { MyApp } from './app.component';
import { DetailPage } from '../pages/detail/detail';
import { SummaryPage } from '../pages/summary/summary';
import { HistoryPage } from '../pages/history/history';
import { AnalysisPage } from '../pages/analysis/analysis';
import { PopoverPage } from '../pages/popover/popover';
import { DashboardPage } from '../pages/dashboard/dashboard';
import { SettingPage } from '../pages/setting/setting';
import { ScrollToTop } from '../components/scroll-to-top/scroll-to-top';
import { TransactionService } from '../providers/transaction-service';
import { CategoryService } from '../providers/category-service';
import { CronService } from '../providers/cron-service';

@NgModule({
  declarations: [
    MyApp,
    ScrollToTop,
    DetailPage,
    SummaryPage,
    HistoryPage,
    AnalysisPage,
    PopoverPage,
    DashboardPage,
    SettingPage
  ],
  imports: [
    IonicModule.forRoot(MyApp),
    ChartsModule
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    DetailPage,
    SummaryPage,
    HistoryPage,
    AnalysisPage,
    PopoverPage,
    DashboardPage,
    SettingPage
  ],
  providers: [{provide: ErrorHandler, useClass: IonicErrorHandler}, TransactionService, CategoryService, CronService]
})
export class AppModule {}
