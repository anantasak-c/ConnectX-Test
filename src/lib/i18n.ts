export const languages = ["en", "th"] as const;

export type Language = (typeof languages)[number];

const copy = {
  en: {
    locale: "en-US",
    languageName: "English",
    languageToggle: "TH",
    eyebrow: "Executive Compensation Analytics",
    pageTitle: "HR Cost & Bonus Dashboard",
    loadingTitle: "Executive HR Dashboard",
    loading: "Loading compensation analytics...",
    loadError: "Dashboard data could not be loaded.",
    kpiSummary: "KPI summary",
    kpis: {
      employees: "Employees",
      totalSalary: "Total Salary",
      totalBonus: "Total Bonus",
      totalIncome: "Total Income",
      averageSalary: "Avg Salary",
      medianSalary: "Median Salary",
    },
    charts: {
      incomeShareTitle: "Income Share by Department",
      incomeShareSubtitle: "Contribution to total compensation",
      shareCompareTitle: "Headcount Share vs Income Share",
      shareCompareSubtitle: "Highlights cost concentration",
      averageSalaryTitle: "Average Salary by Department",
      averageSalarySubtitle: "Cost per employee signal",
      bonusTitle: "Bonus Distribution",
      bonusSubtitle: "Concentration and coverage",
      salaryBandTitle: "Salary Band Distribution",
      salaryBandSubtitle: "Compensation structure",
      topCompTitle: "Top Compensation Ranking",
      topCompSubtitle: "Sorted by total income",
      outlierTitle: "Salary Outlier View",
      outlierSubtitle: "Average is above median",
    },
    chartNames: {
      headcountShare: "Headcount Share",
      incomeShare: "Income Share",
      averageSalary: "Average Salary",
      totalBonus: "Total Bonus",
      bonusCoverage: "Bonus Coverage",
      employees: "Employees",
      totalIncome: "Total Income",
      salary: "Salary",
    },
    outliers: {
      min: "Min",
      median: "Median",
      average: "Average",
      max: "Max",
    },
    salaryBands: {
      "Below 100K": "Below 100K",
      "100K-199K": "100K-199K",
      "200K-399K": "200K-399K",
      "400K+": "400K+",
    },
    table: {
      title: "Employee Drill-down",
      subtitle: "Sorted by total income",
      name: "Name",
      department: "Department",
      titleColumn: "Title",
      salary: "Salary",
      bonus: "Bonus",
      totalIncome: "Total Income",
      unassigned: "Unassigned",
    },
    insights: {
      compensationCost: (value: string) =>
        `Compensation cost is ${value}, with salary as the dominant component.`,
      bonusShare: (value: string) =>
        `Bonus is ${value} of total income, so incentives are a small part of overall compensation.`,
      bonusCoverage: (withBonus: number, total: number, coverage: string) =>
        `${withBonus} of ${total} employees receive bonus coverage (${coverage}).`,
    },
  },
  th: {
    locale: "th-TH",
    languageName: "ไทย",
    languageToggle: "EN",
    eyebrow: "Executive Compensation Analytics",
    pageTitle: "HR Cost & Bonus Dashboard",
    loadingTitle: "แดชบอร์ด HR สำหรับผู้บริหาร",
    loading: "กำลังโหลดข้อมูลวิเคราะห์ค่าตอบแทน...",
    loadError: "ไม่สามารถโหลดข้อมูลแดชบอร์ดได้",
    kpiSummary: "สรุป KPI",
    kpis: {
      employees: "พนักงาน",
      totalSalary: "เงินเดือนรวม",
      totalBonus: "โบนัสรวม",
      totalIncome: "รายได้รวม",
      averageSalary: "เงินเดือนเฉลี่ย",
      medianSalary: "มัธยฐานเงินเดือน",
    },
    charts: {
      incomeShareTitle: "สัดส่วนรายได้รวมตามแผนก",
      incomeShareSubtitle: "ดู contribution ต่อ compensation ทั้งองค์กร",
      shareCompareTitle: "สัดส่วนพนักงานเทียบสัดส่วนค่าใช้จ่าย",
      shareCompareSubtitle: "ชี้จุดที่ cost กระจุกตัว",
      averageSalaryTitle: "เงินเดือนเฉลี่ยตามแผนก",
      averageSalarySubtitle: "สัญญาณ cost ต่อหัว",
      bonusTitle: "การกระจายโบนัส",
      bonusSubtitle: "ดูความกระจุกตัวและ coverage",
      salaryBandTitle: "โครงสร้าง Salary Band",
      salaryBandSubtitle: "การกระจายระดับค่าตอบแทน",
      topCompTitle: "อันดับค่าตอบแทนสูงสุด",
      topCompSubtitle: "เรียงตามรายได้รวม",
      outlierTitle: "มุมมอง Outlier เงินเดือน",
      outlierSubtitle: "ค่าเฉลี่ยสูงกว่ามัธยฐาน",
    },
    chartNames: {
      headcountShare: "สัดส่วนพนักงาน",
      incomeShare: "สัดส่วนรายได้รวม",
      averageSalary: "เงินเดือนเฉลี่ย",
      totalBonus: "โบนัสรวม",
      bonusCoverage: "Bonus Coverage",
      employees: "พนักงาน",
      totalIncome: "รายได้รวม",
      salary: "เงินเดือน",
    },
    outliers: {
      min: "ต่ำสุด",
      median: "มัธยฐาน",
      average: "เฉลี่ย",
      max: "สูงสุด",
    },
    salaryBands: {
      "Below 100K": "ต่ำกว่า 100K",
      "100K-199K": "100K-199K",
      "200K-399K": "200K-399K",
      "400K+": "400K+",
    },
    table: {
      title: "รายละเอียดพนักงาน",
      subtitle: "เรียงตามรายได้รวม",
      name: "ชื่อ",
      department: "แผนก",
      titleColumn: "ตำแหน่ง",
      salary: "เงินเดือน",
      bonus: "โบนัส",
      totalIncome: "รายได้รวม",
      unassigned: "ไม่ระบุ",
    },
    insights: {
      compensationCost: (value: string) =>
        `ค่าใช้จ่าย compensation รวมอยู่ที่ ${value} โดยเงินเดือนเป็นสัดส่วนหลัก`,
      bonusShare: (value: string) =>
        `โบนัสคิดเป็น ${value} ของรายได้รวม แปลว่า incentive ยังเป็นสัดส่วนเล็กเมื่อเทียบกับ compensation ทั้งหมด`,
      bonusCoverage: (withBonus: number, total: number, coverage: string) =>
        `มีพนักงาน ${withBonus} จาก ${total} คนที่ได้รับโบนัส คิดเป็น ${coverage}`,
    },
  },
} as const;

export type Copy = (typeof copy)[Language];

export function getCopy(language: string): Copy {
  return language === "th" ? copy.th : copy.en;
}

export function nextLanguage(language: Language): Language {
  return language === "en" ? "th" : "en";
}
