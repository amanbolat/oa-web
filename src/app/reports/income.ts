import { Component } from '@angular/core';
import { AccountService } from '../core/account.service';
import { OrgService } from '../core/org.service';
import { ConfigService } from '../core/config.service';
import { SessionService } from '../core/session.service';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';
import 'rxjs/add/observable/zip';
import { Account, AccountTree } from '../shared/account';
import { Org } from '../shared/org';
import { TxListPage } from '../transaction/list';
import { 
  FormGroup,
  FormControl,
  Validators,
  FormBuilder,
  AbstractControl,
  ValidationErrors
} from '@angular/forms';
import { AppError } from '../shared/error';
import { Util } from '../shared/util';

@Component({
  selector: 'app-income',
  templateUrl: 'income.html',
  styleUrls: ['./reports.scss']
})
export class IncomeReport {
  public org: Org;
  public startDate: Date;
  public endDate: Date;
  public incomeAccount: Account;
  public incomeAccounts: Account[] = [];
  public expenseAccount: Account;
  public expenseAccounts: Account[] = [];
  public form: FormGroup;
  public error: AppError;
  public showDateForm: boolean = false;
  private treeSubscription: Subscription;

  constructor(
    private fb: FormBuilder,
    private accountService: AccountService,
    private orgService: OrgService,
    private configService: ConfigService,
    private sessionService: SessionService) {
    this.startDate = new Date();
    this.startDate.setDate(1);
    this.startDate.setHours(0, 0, 0, 0);
    this.endDate = new Date(this.startDate);
    this.endDate.setMonth(this.startDate.getMonth() + 1);

    let reportData = this.configService.get('reportData');

    if(reportData && reportData.income) {
      let reportConfig = reportData.income;
      if(reportConfig.startDate) {
        this.startDate = new Date(reportConfig.startDate);
      }

      if(reportConfig.endDate) {
        this.endDate = new Date(reportConfig.endDate);
      }
    }

    this.form = fb.group({
      startDate: [Util.getLocalDateString(this.startDate), Validators.required],
      endDate: [Util.getLocalDateString(new Date(this.endDate.getTime() - 1)), Validators.required]
    });
  }

  ngOnInit() {
    this.sessionService.setLoading(true);
    this.org = this.orgService.getCurrentOrg();

    this.treeSubscription = this.accountService.getAccountTreeWithPeriodBalance(this.startDate, this.endDate)
      .subscribe(tree => {
        this.sessionService.setLoading(false);
        this.incomeAccount = tree.getAccountByName('Income', 1);
        this.incomeAccounts = tree.getFlattenedAccounts(this.incomeAccount);
        this.expenseAccount = tree.getAccountByName('Expenses', 1);
        this.expenseAccounts = tree.getFlattenedAccounts(this.expenseAccount);
      });
  }

  toggleShowDateForm() {
    this.showDateForm = !this.showDateForm;
  }

  onSubmit() {
    this.treeSubscription.unsubscribe();
    //this.dataService.setLoading(true);
    this.showDateForm = false;
    this.startDate = Util.getDateFromLocalDateString(this.form.value.startDate);
    this.endDate = Util.getDateFromLocalDateString(this.form.value.endDate);
    this.endDate.setDate(this.endDate.getDate() + 1);

    let reportData = this.configService.get('reportData');

    if(!reportData) {
      reportData = {};
    }

    reportData.income = {
      startDate: this.startDate,
      endDate: this.endDate
    }

    this.configService.put('reportData', reportData);

    this.ngOnInit();
  }
}