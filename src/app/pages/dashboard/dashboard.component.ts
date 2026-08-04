import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';

import { EmployeeDetails, EmployeeSalaryRecords, ProjectSites } from '../../models/etoan-models';
import { EtoanSandboxService } from '../../store/sandbox/etoan-sandbox';

interface DashboardLink {
  title: string;
  description: string;
  route: string;
  icon: string;
  tag: string;
}

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, CurrencyPipe, RouterModule, ButtonModule, CardModule, TagModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  employees: EmployeeDetails[] = [];
  projectSites: ProjectSites[] = [];
  salaryRecords: EmployeeSalaryRecords[] = [];

  readonly navigationLinks: DashboardLink[] = [
    {
      title: 'Submit Timecard',
      description: 'Create a new daily worker timecard entry.',
      route: '/timecard-submission',
      icon: 'pi pi-clock',
      tag: 'Timecard',
    },
    {
      title: 'View Timecard',
      description: 'View the submitted timecard layout.',
      route: '/view-timecard',
      icon: 'pi pi-eye',
      tag: 'Review',
    },
    {
      title: 'Timecard Records',
      description: 'Search and review all historical timecard records.',
      route: '/timecard-records',
      icon: 'pi pi-table',
      tag: 'Records',
    },
    {
      title: 'Salary Entry',
      description: 'Generate salary from worker rates, days, OT, and deductions.',
      route: '/salary-entry',
      icon: 'pi pi-calculator',
      tag: 'Payroll',
    },
    {
      title: 'Salary Records',
      description: 'Review generated monthly salary records and payment totals.',
      route: '/salary-records',
      icon: 'pi pi-wallet',
      tag: 'New',
    },
    {
      title: 'Create Invoice',
      description: 'Generate client invoices and download them as PDF files.',
      route: '/invoice',
      icon: 'pi pi-file-pdf',
      tag: 'Invoice',
    },
  ];

  constructor(private sandbox: EtoanSandboxService) {}

  ngOnInit(): void {
    this.sandbox.getEmployeeDetails();
    this.sandbox.getProjectSites();
    this.sandbox.getEmployeeSalaryRecords();

    this.sandbox.employeeDetails$.subscribe((employees) => {
      this.employees = employees ?? [];
    });

    this.sandbox.projectSites$.subscribe((projectSites) => {
      this.projectSites = projectSites ?? [];
    });

    this.sandbox.employeeSalaryRecords$.subscribe((salaryRecords) => {
      this.salaryRecords = salaryRecords ?? [];
    });
  }

  get activeEmployeesCount(): number {
    return this.employees.filter((employee) => employee.status?.toLowerCase() === 'active').length || this.employees.length;
  }

  get activeProjectsCount(): number {
    return this.projectSites.filter((site) => site.status?.toLowerCase() === 'active').length || this.projectSites.length;
  }

  get totalNetSalary(): number {
    return this.salaryRecords.reduce((total, record) => total + Number(record.net_salary || 0), 0);
  }

  get latestSalaryPeriod(): string {
    if (!this.salaryRecords.length) return 'No payroll yet';

    const latest = [...this.salaryRecords].sort((a, b) => {
      const left = Number(a.salary_year) * 100 + Number(a.salary_month);
      const right = Number(b.salary_year) * 100 + Number(b.salary_month);
      return right - left;
    })[0];

    return `${this.getMonthName(latest.salary_month)} ${latest.salary_year}`;
  }

  private getMonthName(month: number): string {
    return new Date(2000, Number(month) - 1, 1).toLocaleString('en-SG', { month: 'short' });
  }
}
