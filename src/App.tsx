import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  LabelList,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { buildDashboardData, type DashboardData } from "./lib/analytics";
import { fallbackData } from "./lib/fallbackData";
import { compactMoney, money, percent } from "./lib/format";
import { getCopy, nextLanguage, type Language } from "./lib/i18n";

const colors = ["#2563eb", "#059669", "#d97706", "#dc2626", "#7c3aed", "#0891b2"];

export default function App() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState<Language>("en");
  const copy = getCopy(language);

  useEffect(() => {
    fetch("/api/dashboard-data")
      .then((response) => {
        if (!response.ok) throw new Error(copy.loadError);
        return response.json();
      })
      .then(setData)
      .catch(() =>
        setData(buildDashboardData({ ...fallbackData, source: "client-fallback" })),
      );
  }, [copy.loadError]);

  const outlierData = useMemo(() => {
    if (!data) return [];
    return [
      { label: copy.outliers.min, value: data.kpis.minSalary },
      { label: copy.outliers.median, value: data.kpis.medianSalary },
      { label: copy.outliers.average, value: data.kpis.averageSalary },
      { label: copy.outliers.max, value: data.kpis.maxSalary },
    ];
  }, [copy, data]);

  const localizedSalaryBands = useMemo(() => {
    if (!data) return [];
    return data.salaryBands.map((item) => ({
      ...item,
      displayBand: copy.salaryBands[item.band as keyof typeof copy.salaryBands],
    }));
  }, [copy, data]);

  const insights = useMemo(() => {
    if (!data) return [];
    return [
      copy.insights.compensationCost(compactMoney(data.kpis.totalIncome, copy.locale)),
      copy.insights.bonusShare(percent(data.kpis.totalBonus / data.kpis.totalIncome * 100)),
      copy.insights.bonusCoverage(
        data.kpis.employeesWithBonus,
        data.kpis.totalEmployees,
        percent(data.kpis.bonusCoverage),
      ),
    ];
  }, [copy, data]);

  if (error) {
    return (
      <main className="app-shell">
        <section className="empty-state">
          <h1>{copy.loadingTitle}</h1>
          <p>{error}</p>
        </section>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="app-shell">
        <section className="empty-state">
          <h1>{copy.loadingTitle}</h1>
          <p>{copy.loading}</p>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">{copy.eyebrow}</p>
          <h1>{copy.pageTitle}</h1>
        </div>
        <div className="header-actions">
          <button
            className="language-toggle"
            type="button"
            onClick={() => setLanguage(nextLanguage(language))}
            aria-label="Switch language"
          >
            {copy.languageToggle}
          </button>
          <div className="source-pill">{data.source}</div>
        </div>
      </header>

      <section className="kpi-grid" aria-label={copy.kpiSummary}>
        <KpiCard label={copy.kpis.employees} value={money(data.kpis.totalEmployees, copy.locale)} />
        <KpiCard label={copy.kpis.totalSalary} value={compactMoney(data.kpis.totalSalary, copy.locale)} />
        <KpiCard label={copy.kpis.totalBonus} value={compactMoney(data.kpis.totalBonus, copy.locale)} />
        <KpiCard label={copy.kpis.totalIncome} value={compactMoney(data.kpis.totalIncome, copy.locale)} />
        <KpiCard label={copy.kpis.averageSalary} value={compactMoney(data.kpis.averageSalary, copy.locale)} />
        <KpiCard label={copy.kpis.medianSalary} value={compactMoney(data.kpis.medianSalary, copy.locale)} />
      </section>

      <section className="insight-strip">
        {insights.map((insight) => (
          <article className="insight" key={insight}>
            {insight}
          </article>
        ))}
      </section>

      <section className="dashboard-grid">
        <ChartPanel title={copy.charts.incomeShareTitle} subtitle={copy.charts.incomeShareSubtitle}>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data.departmentContribution}
                dataKey="totalIncome"
                nameKey="department"
                cx="50%"
                cy="50%"
                innerRadius={72}
                outerRadius={108}
                paddingAngle={2}
              >
                {data.departmentContribution.map((entry, index) => (
                  <Cell key={entry.department} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => money(value, copy.locale)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartPanel>

        <ChartPanel title={copy.charts.shareCompareTitle} subtitle={copy.charts.shareCompareSubtitle}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.departmentContribution}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="department" />
              <YAxis tickFormatter={(value) => `${value}%`} />
              <Tooltip formatter={(value: number) => percent(value)} />
              <Legend />
              <Bar dataKey="headcountShare" name={copy.chartNames.headcountShare} fill="#94a3b8" radius={[4, 4, 0, 0]} />
              <Bar dataKey="incomeShare" name={copy.chartNames.incomeShare} fill="#2563eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>

        <ChartPanel title={copy.charts.averageSalaryTitle} subtitle={copy.charts.averageSalarySubtitle}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.departmentContribution} layout="vertical" margin={{ left: 24 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tickFormatter={(value) => compactMoney(value, copy.locale)} />
              <YAxis type="category" dataKey="department" width={80} />
              <Tooltip formatter={(value: number) => money(value, copy.locale)} />
              <Bar dataKey="averageSalary" name={copy.chartNames.averageSalary} fill="#059669" radius={[0, 4, 4, 0]}>
                <LabelList dataKey="averageSalary" position="right" formatter={(value: number) => compactMoney(value, copy.locale)} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>

        <ChartPanel title={copy.charts.bonusTitle} subtitle={copy.charts.bonusSubtitle}>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={data.bonusDistribution}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="department" />
              <YAxis yAxisId="left" tickFormatter={(value) => compactMoney(value, copy.locale)} />
              <YAxis yAxisId="right" orientation="right" tickFormatter={(value) => `${value}%`} />
              <Tooltip formatter={(value: number, name) => (String(name).includes("Coverage") || String(name).includes("Coverage") ? percent(value) : money(value, copy.locale))} />
              <Legend />
              <Bar yAxisId="left" dataKey="totalBonus" name={copy.chartNames.totalBonus} fill="#d97706" radius={[4, 4, 0, 0]} />
              <Line yAxisId="right" dataKey="bonusCoverage" name={copy.chartNames.bonusCoverage} stroke="#dc2626" strokeWidth={3} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartPanel>

        <ChartPanel title={copy.charts.salaryBandTitle} subtitle={copy.charts.salaryBandSubtitle}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={localizedSalaryBands}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="displayBand" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="employees" name={copy.chartNames.employees} fill="#7c3aed" radius={[4, 4, 0, 0]}>
                <LabelList dataKey="employees" position="top" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>

        <ChartPanel title={copy.charts.topCompTitle} subtitle={copy.charts.topCompSubtitle}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.topCompensation.slice(0, 6)} layout="vertical" margin={{ left: 34 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tickFormatter={(value) => compactMoney(value, copy.locale)} />
              <YAxis type="category" dataKey="fullName" width={112} />
              <Tooltip formatter={(value: number) => money(value, copy.locale)} />
              <Bar dataKey="totalIncome" name={copy.chartNames.totalIncome} fill="#0891b2" radius={[0, 4, 4, 0]}>
                <LabelList dataKey="totalIncome" position="right" formatter={(value: number) => compactMoney(value, copy.locale)} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>

        <ChartPanel title={copy.charts.outlierTitle} subtitle={copy.charts.outlierSubtitle}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={outlierData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" />
              <YAxis tickFormatter={(value) => compactMoney(value, copy.locale)} />
              <Tooltip formatter={(value: number) => money(value, copy.locale)} />
              <Bar dataKey="value" name={copy.chartNames.salary} fill="#475569" radius={[4, 4, 0, 0]}>
                <LabelList dataKey="value" position="top" formatter={(value: number) => compactMoney(value, copy.locale)} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>

        <section className="detail-panel">
          <div className="panel-heading">
            <div>
              <h2>{copy.table.title}</h2>
              <p>{copy.table.subtitle}</p>
            </div>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{copy.table.name}</th>
                  <th>{copy.table.department}</th>
                  <th>{copy.table.titleColumn}</th>
                  <th>{copy.table.salary}</th>
                  <th>{copy.table.bonus}</th>
                  <th>{copy.table.totalIncome}</th>
                </tr>
              </thead>
              <tbody>
                {data.employees.map((employee) => (
                  <tr key={employee.workerId}>
                    <td>{employee.fullName}</td>
                    <td>{employee.department}</td>
                    <td>{employee.title === "Unassigned" ? copy.table.unassigned : employee.title}</td>
                    <td>{money(employee.salary, copy.locale)}</td>
                    <td>{money(employee.totalBonus, copy.locale)}</td>
                    <td>{money(employee.totalIncome, copy.locale)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </main>
  );
}

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="kpi-card">
      <p>{label}</p>
      <strong>{value}</strong>
    </article>
  );
}

function ChartPanel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section className="chart-panel">
      <div className="panel-heading">
        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
      </div>
      {children}
    </section>
  );
}
