import { describe, expect, it } from "vitest";
import { buildDashboardData, type BonusRow, type TitleRow, type WorkerRow } from "./analytics";

const workers: WorkerRow[] = [
  { WORKER_ID: "1", FIRST_NAME: "Monika", LAST_NAME: "Arora", SALARY: "100000", JOINING_DATE: "2014-02-20 09:00:00", DEPARTMENT: "HR" },
  { WORKER_ID: "2", FIRST_NAME: "Niharika", LAST_NAME: "Verma", SALARY: "80000", JOINING_DATE: "2014-06-11 09:00:00", DEPARTMENT: "Admin" },
  { WORKER_ID: "3", FIRST_NAME: "Vishal", LAST_NAME: "Singhal", SALARY: "300000", JOINING_DATE: "2014-02-20 09:00:00", DEPARTMENT: "HR" },
  { WORKER_ID: "4", FIRST_NAME: "Amitabh", LAST_NAME: "Singh", SALARY: "500000", JOINING_DATE: "2014-02-20 09:00:00", DEPARTMENT: "Admin" },
  { WORKER_ID: "5", FIRST_NAME: "Vivek", LAST_NAME: "Bhati", SALARY: "500000", JOINING_DATE: "2014-06-11 09:00:00", DEPARTMENT: "Admin" },
  { WORKER_ID: "6", FIRST_NAME: "Vipul", LAST_NAME: "Diwan", SALARY: "200000", JOINING_DATE: "2014-06-11 09:00:00", DEPARTMENT: "Account" },
  { WORKER_ID: "7", FIRST_NAME: "Satish", LAST_NAME: "Kumar", SALARY: "75000", JOINING_DATE: "2014-01-20 09:00:00", DEPARTMENT: "Account" },
  { WORKER_ID: "8", FIRST_NAME: "Geetika", LAST_NAME: "Chauhan", SALARY: "90000", JOINING_DATE: "2014-04-11 09:00:00", DEPARTMENT: "Admin" },
  { WORKER_ID: "9", FIRST_NAME: "Mo", LAST_NAME: "Ar", SALARY: "90000", JOINING_DATE: "2014-02-20 09:00:00", DEPARTMENT: "Account" },
  { WORKER_ID: "10", FIRST_NAME: "Ni", LAST_NAME: "Ver", SALARY: "80000", JOINING_DATE: "2014-06-11 09:00:00", DEPARTMENT: "Admin" },
  { WORKER_ID: "11", FIRST_NAME: "Vi", LAST_NAME: "Sing", SALARY: "300000", JOINING_DATE: "2014-02-20 09:00:00", DEPARTMENT: "HR" },
  { WORKER_ID: "12", FIRST_NAME: "Ami", LAST_NAME: "Singh", SALARY: "500000", JOINING_DATE: "2014-02-20 09:00:00", DEPARTMENT: "Admin" },
  { WORKER_ID: "13", FIRST_NAME: "Viv", LAST_NAME: "Bha", SALARY: "500000", JOINING_DATE: "2014-06-11 09:00:00", DEPARTMENT: "Admin" },
  { WORKER_ID: "14", FIRST_NAME: "Vipul", LAST_NAME: "Diwan", SALARY: "200000", JOINING_DATE: "2014-06-11 09:00:00", DEPARTMENT: "Admin" },
  { WORKER_ID: "15", FIRST_NAME: "Satish", LAST_NAME: "Kumar", SALARY: "75000", JOINING_DATE: "2014-01-20 09:00:00", DEPARTMENT: "Account" },
  { WORKER_ID: "16", FIRST_NAME: "Gee", LAST_NAME: "Cha", SALARY: "85000", JOINING_DATE: "2014-04-11 09:00:00", DEPARTMENT: "Account" },
];

const titles: TitleRow[] = [
  { WORKER_REF_ID: "1", WORKER_TITLE: "Manager", AFFECTED_FROM: "2016-02-20 00:00:00" },
  { WORKER_REF_ID: "2", WORKER_TITLE: "Executive", AFFECTED_FROM: "2016-06-11 00:00:00" },
  { WORKER_REF_ID: "8", WORKER_TITLE: "Executive", AFFECTED_FROM: "2016-06-11 00:00:00" },
  { WORKER_REF_ID: "5", WORKER_TITLE: "Manager", AFFECTED_FROM: "2016-06-11 00:00:00" },
  { WORKER_REF_ID: "4", WORKER_TITLE: "Asst. Manager", AFFECTED_FROM: "2016-06-11 00:00:00" },
  { WORKER_REF_ID: "7", WORKER_TITLE: "Executive", AFFECTED_FROM: "2016-06-11 00:00:00" },
  { WORKER_REF_ID: "6", WORKER_TITLE: "Lead", AFFECTED_FROM: "2016-06-11 00:00:00" },
  { WORKER_REF_ID: "3", WORKER_TITLE: "Lead", AFFECTED_FROM: "2016-06-11 00:00:00" },
];

const bonuses: BonusRow[] = [
  { WORKER_REF_ID: "1", BONUS_AMOUNT: "5000", BONUS_DATE: "2016-02-20 00:00:00" },
  { WORKER_REF_ID: "2", BONUS_AMOUNT: "3000", BONUS_DATE: "2016-06-11 00:00:00" },
  { WORKER_REF_ID: "3", BONUS_AMOUNT: "4000", BONUS_DATE: "2016-02-20 00:00:00" },
  { WORKER_REF_ID: "1", BONUS_AMOUNT: "4500", BONUS_DATE: "2016-02-20 00:00:00" },
  { WORKER_REF_ID: "2", BONUS_AMOUNT: "3500", BONUS_DATE: "2016-06-11 00:00:00" },
];

describe("buildDashboardData", () => {
  const result = buildDashboardData({ workers, titles, bonuses, source: "test" });

  it("calculates executive KPI totals", () => {
    expect(result.kpis.totalEmployees).toBe(16);
    expect(result.kpis.totalSalary).toBe(3675000);
    expect(result.kpis.averageSalary).toBe(229688);
    expect(result.kpis.totalBonus).toBe(20000);
    expect(result.kpis.totalIncome).toBe(3695000);
    expect(result.kpis.medianSalary).toBe(150000);
    expect(result.kpis.minSalary).toBe(75000);
    expect(result.kpis.maxSalary).toBe(500000);
  });

  it("calculates department contribution against headcount share", () => {
    const admin = result.departmentContribution.find((item) => item.department === "Admin");
    const account = result.departmentContribution.find((item) => item.department === "Account");

    expect(admin).toMatchObject({
      employees: 8,
      totalIncome: 2456500,
      headcountShare: 50,
      incomeShare: 66.48,
    });
    expect(account).toMatchObject({
      employees: 5,
      totalIncome: 525000,
      incomeShare: 14.21,
      averageSalary: 105000,
    });
  });

  it("calculates bonus concentration and coverage", () => {
    const hr = result.bonusDistribution.find((item) => item.department === "HR");

    expect(result.kpis.employeesWithBonus).toBe(3);
    expect(result.kpis.bonusCoverage).toBe(18.75);
    expect(hr).toMatchObject({
      totalBonus: 13500,
      employeesWithBonus: 2,
      bonusCoverage: 66.67,
      bonusShare: 67.5,
    });
  });

  it("groups workers into salary bands", () => {
    expect(result.salaryBands).toEqual([
      { band: "Below 100K", employees: 7 },
      { band: "100K-199K", employees: 1 },
      { band: "200K-399K", employees: 4 },
      { band: "400K+", employees: 4 },
    ]);
  });

  it("sorts top compensation by total income", () => {
    expect(result.topCompensation.slice(0, 3).map((worker) => worker.fullName)).toEqual([
      "Amitabh Singh",
      "Vivek Bhati",
      "Ami Singh",
    ]);
  });
});
