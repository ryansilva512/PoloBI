import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const CHART_COLORS = [
  "hsl(210, 85%, 42%)",
  "hsl(195, 75%, 32%)",
  "hsl(175, 65%, 30%)",
  "hsl(160, 60%, 28%)",
  "hsl(145, 55%, 26%)",
];

const CHART_COLORS_DARK = [
  "hsl(210, 85%, 65%)",
  "hsl(195, 75%, 68%)",
  "hsl(175, 65%, 70%)",
  "hsl(160, 60%, 72%)",
  "hsl(145, 55%, 74%)",
];

interface ChartCardProps {
  titulo: string;
  subtitulo?: string;
  children: React.ReactNode;
  className?: string;
  acoes?: React.ReactNode;
  testId?: string;
}

export function ChartCard({
  titulo,
  subtitulo,
  children,
  className,
  acoes,
  testId,
}: ChartCardProps) {
  return (
    <Card className={cn("rounded-md", className)} data-testid={testId}>
      <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-4">
        <div>
          <CardTitle className="text-base font-semibold">{titulo}</CardTitle>
          {subtitulo && (
            <p className="text-xs text-muted-foreground mt-1">{subtitulo}</p>
          )}
        </div>
        {acoes && <div className="flex items-center gap-2">{acoes}</div>}
      </CardHeader>
      <CardContent className="pt-0">{children}</CardContent>
    </Card>
  );
}

interface LineChartData {
  data: string;
  [key: string]: string | number;
}

interface SimpleLineChartProps {
  data: LineChartData[];
  dataKeys: { key: string; label: string; color?: string }[];
  altura?: number;
  formatoY?: (value: number) => string;
  formatoTooltip?: (value: number, name: string) => string;
}

export function SimpleLineChart({
  data,
  dataKeys,
  altura = 300,
  formatoY,
  formatoTooltip,
}: SimpleLineChartProps) {
  return (
    <ResponsiveContainer width="100%" height={altura}>
      <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis
          dataKey="data"
          tick={{ fontSize: 11 }}
          className="text-muted-foreground"
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 11 }}
          className="text-muted-foreground"
          tickLine={false}
          axisLine={false}
          tickFormatter={formatoY}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--popover))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "6px",
            fontSize: "12px",
          }}
          formatter={formatoTooltip}
        />
        <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
        {dataKeys.map((dk, index) => (
          <Line
            key={dk.key}
            type="monotone"
            dataKey={dk.key}
            name={dk.label}
            stroke={dk.color || CHART_COLORS[index % CHART_COLORS.length]}
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

interface BarChartData {
  label: string;
  [key: string]: string | number;
}

interface SimpleBarChartProps {
  data: BarChartData[];
  dataKeys: { key: string; label: string; color?: string }[];
  altura?: number;
  layout?: "horizontal" | "vertical";
  stacked?: boolean;
  formatoTooltip?: (value: number, name: string) => string;
}

export function SimpleBarChart({
  data,
  dataKeys,
  altura = 300,
  layout = "vertical",
  stacked = false,
  formatoTooltip,
}: SimpleBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={altura}>
      <BarChart
        data={data}
        layout={layout}
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        {layout === "vertical" ? (
          <>
            <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis
              dataKey="label"
              type="category"
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={100}
            />
          </>
        ) : (
          <>
            <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
          </>
        )}
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--popover))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "6px",
            fontSize: "12px",
          }}
          formatter={formatoTooltip}
        />
        <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
        {dataKeys.map((dk, index) => (
          <Bar
            key={dk.key}
            dataKey={dk.key}
            name={dk.label}
            fill={dk.color || CHART_COLORS[index % CHART_COLORS.length]}
            stackId={stacked ? "stack" : undefined}
            radius={[4, 4, 0, 0]}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

interface DonutChartData {
  name: string;
  value: number;
  color?: string;
}

interface SimpleDonutChartProps {
  data: DonutChartData[];
  altura?: number;
  innerRadius?: number;
  outerRadius?: number;
  showLabel?: boolean;
  formatoTooltip?: (value: number, name: string) => string;
  centerLabel?: string;
  centerValue?: string | number;
}

export function SimpleDonutChart({
  data,
  altura = 250,
  innerRadius = 60,
  outerRadius = 90,
  showLabel = false,
  formatoTooltip,
  centerLabel,
  centerValue,
}: SimpleDonutChartProps) {
  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={altura}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            paddingAngle={2}
            dataKey="value"
            label={
              showLabel
                ? ({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                : undefined
            }
            labelLine={showLabel}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color || CHART_COLORS[index % CHART_COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--popover))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "6px",
              fontSize: "12px",
            }}
            formatter={formatoTooltip}
          />
          <Legend
            verticalAlign="bottom"
            wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }}
          />
        </PieChart>
      </ResponsiveContainer>
      {centerLabel && centerValue !== undefined && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-bold font-mono">{centerValue}</span>
          <span className="text-xs text-muted-foreground">{centerLabel}</span>
        </div>
      )}
    </div>
  );
}

interface AreaChartData {
  data: string;
  [key: string]: string | number;
}

interface SimpleAreaChartProps {
  data: AreaChartData[];
  dataKeys: { key: string; label: string; color?: string }[];
  altura?: number;
  stacked?: boolean;
  formatoY?: (value: number) => string;
  formatoTooltip?: (value: number, name: string) => string;
}

export function SimpleAreaChart({
  data,
  dataKeys,
  altura = 300,
  stacked = false,
  formatoY,
  formatoTooltip,
}: SimpleAreaChartProps) {
  return (
    <ResponsiveContainer width="100%" height={altura}>
      <AreaChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis
          dataKey="data"
          tick={{ fontSize: 11 }}
          className="text-muted-foreground"
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 11 }}
          className="text-muted-foreground"
          tickLine={false}
          axisLine={false}
          tickFormatter={formatoY}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--popover))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "6px",
            fontSize: "12px",
          }}
          formatter={formatoTooltip}
        />
        <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
        {dataKeys.map((dk, index) => (
          <Area
            key={dk.key}
            type="monotone"
            dataKey={dk.key}
            name={dk.label}
            stroke={dk.color || CHART_COLORS[index % CHART_COLORS.length]}
            fill={dk.color || CHART_COLORS[index % CHART_COLORS.length]}
            fillOpacity={0.2}
            strokeWidth={2}
            stackId={stacked ? "stack" : undefined}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function ChartSkeleton({ altura = 300 }: { altura?: number }) {
  return (
    <div
      className="animate-pulse bg-muted rounded-md"
      style={{ height: altura }}
    />
  );
}
