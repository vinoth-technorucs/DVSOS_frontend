import {
  Grid,
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Select,
  MenuItem,
  Divider,
  Avatar,
  Chip,
} from "@mui/material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  TrendingUp,
  Briefcase,
  Users,
  Car,
  ClipboardList,
  IndianRupee,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../config/routes";
import { useMdDashboard } from "../../queries/useDataQueries";
import Loader from "../../components/common/Loader";
import KpiCard from "../../components/common/KpiCard";

export default function MDDashboard() {
  const [timeRange, setTimeRange] = useState("Today");
  const navigate = useNavigate();

  const timeFrameMap = {
    Today: "today",
    "This Week": "this_week",
    "This Month": "this_month",
    "All Time": "all_time",
  };

  const { data: dashboardData, isLoading } = useMdDashboard({
    timeframe: timeFrameMap[timeRange],
  });

  const data = dashboardData || {};
  const kpis = data.kpis || {};
  const dailyThroughput = data.dailyThroughput || [];
  const statusMix = data.statusMix || [];
  const departmentPerformance = data.departmentPerformance || [];
  const revenueBreakdown = data.revenueBreakdown || {
    items: [],
    todaysTotal: 0,
  };
  const pipeline = data.pipeline || [];
  const advisorPerformance = data.advisorPerformance || [];

  const BAR_CHART_DATA = dailyThroughput.map((d) => ({
    name: d.day,
    Vehicles: d.count,
  }));
  const COLORS = [
    "#10B981",
    "#2563EB",
    "#8B5CF6",
    "#06B6D4",
    "#F59E0B",
    "#EF4444",
    "#6B7280",
  ];
  const PIE_CHART_DATA = statusMix.map((s, i) => ({
    name: s.statusName,
    value: s.count,
    color: COLORS[i % COLORS.length],
  }));

  const getDeptDisplay = (name) => {
    if (!name) return "";
    const clean = String(name).trim();
    const lower = clean.toLowerCase().replace(/[-_]/g, " ");

    const formattedName = clean
      .split(/[\s_-]+/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");

    if (lower.includes("mechanic")) {
      return `🔧 ${formattedName}`;
    }
    if (lower.includes("body") || lower.includes("denting") || lower.includes("tinkering")) {
      return `🔨 ${formattedName}`;
    }
    if (lower.includes("wash") || lower.includes("water") || lower.includes("cleaning")) {
      return `💧 ${formattedName}`;
    }
    if (lower.includes("paint")) {
      return `🎨 ${formattedName}`;
    }
    if (lower.includes("electric") || lower.includes("battery")) {
      return `⚡ ${formattedName}`;
    }
    if (lower.includes("job") || lower.includes("card") || lower.includes("parts") || lower.includes("material")) {
      return `📋 ${formattedName}`;
    }

    return `⚙️ ${formattedName}`;
  };

  const DEPARTMENT_DATA = departmentPerformance.map((d) => ({
    ...d,
    dept: getDeptDisplay(d.department),
  }));

  return (
    <Box sx={{ p: { xs: 2, md: '19px' }, bgcolor: "#F0F4FF", minHeight: "100%" }}>
      {/* Header Bar */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h5" fontWeight={700} color="#1E293B">
          Managing Director Dashboard
        </Typography>
        <Select
          size="small"
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          sx={{
            minWidth: 150,
            bgcolor: "white",
            borderRadius: 2,
            boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
            "& .MuiOutlinedInput-notchedOutline": { borderColor: "#E2E8F0" },
          }}
        >
          {Object.keys(timeFrameMap).map((key) => (
            <MenuItem key={key} value={key}>
              {key}
            </MenuItem>
          ))}
        </Select>
      </Box>

      {isLoading ? (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "60vh",
          }}
        >
          <Loader text="Loading dashboard data..." size="lg" />
        </Box>
      ) : (
        <>
          {/* KPI Cards Row */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {/* Card 1: Total Vehicles */}
            <Grid item xs={12} sm={6} md={6} lg={3}>
              <KpiCard
                label="Total Vehicles"
                value={kpis.totalVehicles?.value || 0}
                subtitle={kpis.totalVehicles?.comparison || "+3 vs yesterday"}
                icon={Car}
                theme="blue"
              />
            </Grid>

            {/* Card 2: Total Job Cards */}
            <Grid item xs={12} sm={6} md={6} lg={3}>
              <KpiCard
                label="Total Job Cards"
                value={kpis.totalJobCards?.value || 0}
                subtitle={kpis.totalJobCards?.comparison || "Active in system"}
                icon={ClipboardList}
                theme="green"
              />
            </Grid>

            {/* Card 3: Total Revenue */}
            <Grid item xs={12} sm={6} md={6} lg={3}>
              <KpiCard
                label="Total Revenue"
                value={`₹${kpis.totalRevenue?.value > 100000
                  ? (kpis.totalRevenue.value / 100000).toFixed(1) + "L"
                  : (kpis.totalRevenue?.value || 0).toLocaleString("en-IN")
                  }`}
                subtitle={kpis.totalRevenue?.comparison || "+12% vs avg"}
                icon={IndianRupee}
                theme="amber"
              />
            </Grid>

            {/* Card 4: Total Users */}
            <Grid item xs={12} sm={6} md={6} lg={3}>
              <KpiCard
                label="Total Users"
                value={kpis.totalUsers?.value || 0}
                subtitle={kpis.totalUsers?.comparison || "Manage platform users"}
                icon={Users}
                theme="red"
                onClick={() => navigate(ROUTES.ADMIN_USERS)}
              />
            </Grid>
          </Grid>

          {pipeline && pipeline.length > 0 && (
            <Card
              sx={{
                borderRadius: 3,
                border: "1px solid #D8E2F3",
                boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
                mb: 3,
              }}
            >
              <Box sx={{ p: 2.5 }}>
                <Typography
                  variant="caption"
                  sx={{
                    color: "#8A9AB5",
                    fontWeight: 900,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                  }}
                >
                  Operational Pipeline (Overall Work & Waiting)
                </Typography>
                <Box
                  sx={{
                    borderTop: "1px solid #E2E8F0",
                    mt: 1.5,
                    pt: 2,
                    display: "flex",
                    flexDirection: { xs: "column", sm: "row" },
                    gap: { xs: 2, lg: 3 },
                    pb: 0.5,
                  }}
                >
                  {pipeline.map((stage) => (
                    <Box
                      key={stage.label}
                      sx={{
                        flex: 1,
                        width: "100%",
                        minHeight: 96,
                        borderRadius: 2,
                        border: "1px solid",
                        borderColor: stage.color,
                        bgcolor: stage.bg,
                        p: 2,
                        transition: "box-shadow 0.2s",
                        "&:hover": {
                          boxShadow: "0 10px 20px -15px rgba(15,23,42,0.5)",
                        },
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          display: "block",
                          color: stage.color,
                          fontWeight: 900,
                          textTransform: "uppercase",
                          fontSize: 11,
                        }}
                      >
                        {stage.label}
                      </Typography>
                      <Typography
                        variant="h5"
                        sx={{ color: stage.color, fontWeight: 900, my: 0.5 }}
                      >
                        {stage.value}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ color: "#64748B", fontSize: 11, fontWeight: 500 }}
                      >
                        {stage.meta}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Card>
          )}

          {/* Middle Row */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={7}>
              <Card
                sx={{
                  borderRadius: 3,
                  boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
                  height: "100%",
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Typography
                    variant="caption"
                    fontWeight={800}
                    color="text.secondary"
                    sx={{
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      mb: 3,
                      display: "block",
                    }}
                  >
                    Daily Vehicle Entries — Last 7 Days
                  </Typography>
                  <Box sx={{ height: 200, width: "100%" }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={BAR_CHART_DATA}
                        margin={{ top: 0, right: 0, bottom: 0, left: -40 }}
                      >
                        <XAxis
                          dataKey="name"
                          tick={{
                            fontSize: 11,
                            fill: "#94A3B8",
                            fontWeight: 600,
                          }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis hide />
                        <RechartsTooltip
                          cursor={{ fill: "rgba(241, 245, 249, 0.5)" }}
                          contentStyle={{
                            borderRadius: "8px",
                            border: "1px solid #E2E8F0",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                          }}
                        />
                        <Bar dataKey="Vehicles" radius={[4, 4, 0, 0]}>
                          {BAR_CHART_DATA.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={
                                entry.name === "Today" ? "#2563EB" : "#BFDBFE"
                              }
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={5}>
              <Card
                sx={{
                  borderRadius: 3,
                  boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
                  height: "100%",
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Typography
                    variant="caption"
                    fontWeight={800}
                    color="text.secondary"
                    sx={{
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      mb: 2,
                      display: "block",
                    }}
                  >
                    Status Mix
                  </Typography>
                  {PIE_CHART_DATA.length === 0 ? (
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        height: { xs: 150, sm: 200 },
                        width: "100%",
                      }}
                    >
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        fontWeight={500}
                      >
                        No Job Cards found for this timeframe.
                      </Typography>
                    </Box>
                  ) : (
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: { xs: "column", sm: "row" },
                        alignItems: "center",
                        height: { xs: "auto", sm: 200 },
                        gap: { xs: 2, sm: 0 },
                      }}
                    >
                      <Box
                        sx={{ width: { xs: "100%", sm: "45%" }, height: 200 }}
                      >
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={PIE_CHART_DATA}
                              innerRadius={45}
                              outerRadius={70}
                              paddingAngle={2}
                              dataKey="value"
                              stroke="none"
                            >
                              {PIE_CHART_DATA.map((entry, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={entry.color}
                                />
                              ))}
                            </Pie>
                            <RechartsTooltip
                              contentStyle={{
                                borderRadius: "8px",
                                border: "none",
                                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </Box>
                      <Box
                        sx={{
                          width: { xs: "100%", sm: "55%" },
                          display: "flex",
                          flexDirection: "column",
                          gap: 1,
                          pl: { xs: 0, sm: 2 },
                        }}
                      >
                        {PIE_CHART_DATA.map((item, i) => (
                          <Box
                            key={i}
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1.5,
                            }}
                          >
                            <Box
                              sx={{
                                width: 10,
                                height: 10,
                                borderRadius: "2px",
                                bgcolor: item.color,
                              }}
                            />
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              fontWeight={500}
                              sx={{ fontSize: "0.8rem" }}
                            >
                              {item.name} ({item.value})
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Bottom Row */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={7}>
              <Card
                sx={{
                  borderRadius: 3,
                  boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
                  height: "100%",
                }}
              >
                <CardContent sx={{ p: 3, pb: "16px !important" }}>
                  <Typography
                    variant="caption"
                    fontWeight={800}
                    color="text.secondary"
                    sx={{
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      mb: 2,
                      display: "block",
                    }}
                  >
                    Department Performance
                  </Typography>
                  {DEPARTMENT_DATA.length === 0 ? (
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        height: 150,
                        width: "100%",
                      }}
                    >
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        fontWeight={500}
                      >
                        No work assignments found for this timeframe.
                      </Typography>
                    </Box>
                  ) : (
                    <TableContainer sx={{ overflowX: "auto" }}>
                      <Table size="small" sx={{ minWidth: 400 }}>
                        <TableHead sx={{ bgcolor: "transparent" }}>
                          <TableRow>
                            <TableCell
                              sx={{
                                color: "#94A3B8",
                                fontSize: "0.7rem",
                                fontWeight: 700,
                                px: 0,
                                py: 1.5,
                                borderBottom: "1px solid #E2E8F0",
                                bgcolor: "transparent",
                              }}
                            >
                              DEPARTMENT
                            </TableCell>
                            <TableCell
                              sx={{
                                color: "#94A3B8",
                                fontSize: "0.7rem",
                                fontWeight: 700,
                                py: 1.5,
                                borderBottom: "1px solid #E2E8F0",
                                bgcolor: "transparent",
                              }}
                            >
                              ACTIVE
                            </TableCell>
                            <TableCell
                              sx={{
                                color: "#94A3B8",
                                fontSize: "0.7rem",
                                fontWeight: 700,
                                py: 1.5,
                                borderBottom: "1px solid #E2E8F0",
                                bgcolor: "transparent",
                              }}
                            >
                              QUEUE
                            </TableCell>
                            <TableCell
                              sx={{
                                color: "#94A3B8",
                                fontSize: "0.7rem",
                                fontWeight: 700,
                                py: 1.5,
                                borderBottom: "1px solid #E2E8F0",
                                bgcolor: "transparent",
                              }}
                            >
                              DONE
                            </TableCell>
                            <TableCell
                              sx={{
                                color: "#94A3B8",
                                fontSize: "0.7rem",
                                fontWeight: 700,
                                py: 1.5,
                                borderBottom: "1px solid #E2E8F0",
                                bgcolor: "transparent",
                              }}
                            >
                              AVG TIME
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {DEPARTMENT_DATA.map((row, i) => (
                            <TableRow
                              key={i}
                              sx={{
                                "& td": {
                                  borderBottom: "1px solid #F1F5F9",
                                  py: 1.5,
                                },
                              }}
                            >
                              <TableCell
                                sx={{
                                  px: 0,
                                  color: "#2563EB",
                                  fontWeight: 600,
                                  fontSize: "0.8rem",
                                  bgcolor: "transparent",
                                }}
                              >
                                {row.dept}
                              </TableCell>
                              <TableCell
                                sx={{
                                  fontWeight: 600,
                                  color: "#475569",
                                  fontSize: "0.8rem",
                                  bgcolor: "transparent",
                                }}
                              >
                                {row.active}
                              </TableCell>
                              <TableCell
                                sx={{
                                  fontWeight: 600,
                                  color: "#475569",
                                  fontSize: "0.8rem",
                                  bgcolor: "transparent",
                                }}
                              >
                                {row.queue}
                              </TableCell>
                              <TableCell
                                sx={{
                                  fontWeight: 600,
                                  color: "#475569",
                                  fontSize: "0.8rem",
                                  bgcolor: "transparent",
                                }}
                              >
                                {row.done}
                              </TableCell>
                              <TableCell
                                sx={{
                                  fontWeight: 600,
                                  color: "#475569",
                                  fontSize: "0.8rem",
                                  bgcolor: "transparent",
                                }}
                              >
                                {row.avgTime}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={5}>
              <Card
                sx={{
                  borderRadius: 3,
                  boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
                  height: "100%",
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Typography
                    variant="caption"
                    fontWeight={800}
                    color="text.secondary"
                    sx={{
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      mb: 3,
                      display: "block",
                    }}
                  >
                    Revenue Breakdown
                  </Typography>

                  {revenueBreakdown.items.length === 0 ? (
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        height: 150,
                        width: "100%",
                      }}
                    >
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        fontWeight={500}
                      >
                        No revenue data found for this timeframe.
                      </Typography>
                    </Box>
                  ) : (
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 2,
                        mb: 3,
                      }}
                    >
                      {revenueBreakdown.items.map((item, i) => (
                        <Box
                          key={i}
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <Typography
                            variant="body2"
                            color="#475569"
                            fontWeight={500}
                          >
                            {getDeptDisplay(item.category)}
                          </Typography>
                          <Typography
                            variant="body2"
                            color="#10B981"
                            fontWeight={700}
                          >
                            ₹{item.amount.toLocaleString()}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  )}

                  <Divider sx={{ my: 2 }} />

                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Typography
                      variant="body2"
                      fontWeight={800}
                      color="#1E293B"
                    >
                      Total Revenue
                    </Typography>
                    <Typography variant="h6" fontWeight={800} color="#2563EB">
                      ₹{revenueBreakdown.todaysTotal.toLocaleString()}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Advisor Performance Breakdown Section */}
          <Card
            sx={{
              borderRadius: 3,
              boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
              mt: 3,
            }}
          >
            <CardContent sx={{ p: 3, pb: "16px !important" }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 2,
                }}
              >
                <Typography
                  variant="caption"
                  fontWeight={800}
                  color="text.secondary"
                  sx={{
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Advisor Performance Breakdown ({timeRange})
                </Typography>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                  {advisorPerformance.length} Advisors
                </Typography>
              </Box>

              {advisorPerformance.length === 0 ? (
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    height: 120,
                    width: "100%",
                  }}
                >
                  <Typography variant="body2" color="text.secondary" fontWeight={500}>
                    No advisor activity found for this timeframe.
                  </Typography>
                </Box>
              ) : (
                <TableContainer sx={{ overflowX: "auto" }}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: "transparent" }}>
                      <TableRow>
                        <TableCell
                          sx={{
                            color: "#94A3B8",
                            fontSize: "0.72rem",
                            fontWeight: 700,
                            py: 1.5,
                            borderBottom: "1px solid #E2E8F0",
                            bgcolor: "transparent",
                          }}
                        >
                          ADVISOR
                        </TableCell>
                        <TableCell
                          align="center"
                          sx={{
                            color: "#94A3B8",
                            fontSize: "0.72rem",
                            fontWeight: 700,
                            py: 1.5,
                            borderBottom: "1px solid #E2E8F0",
                            bgcolor: "transparent",
                          }}
                        >
                          TOTAL JOB CARDS
                        </TableCell>
                        <TableCell
                          align="center"
                          sx={{
                            color: "#94A3B8",
                            fontSize: "0.72rem",
                            fontWeight: 700,
                            py: 1.5,
                            borderBottom: "1px solid #E2E8F0",
                            bgcolor: "transparent",
                          }}
                        >
                          IN PROGRESS
                        </TableCell>
                        <TableCell
                          align="center"
                          sx={{
                            color: "#94A3B8",
                            fontSize: "0.72rem",
                            fontWeight: 700,
                            py: 1.5,
                            borderBottom: "1px solid #E2E8F0",
                            bgcolor: "transparent",
                          }}
                        >
                          WAITING / QUEUE
                        </TableCell>
                        <TableCell
                          align="center"
                          sx={{
                            color: "#94A3B8",
                            fontSize: "0.72rem",
                            fontWeight: 700,
                            py: 1.5,
                            borderBottom: "1px solid #E2E8F0",
                            bgcolor: "transparent",
                          }}
                        >
                          COMPLETED
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{
                            color: "#94A3B8",
                            fontSize: "0.72rem",
                            fontWeight: 700,
                            py: 1.5,
                            borderBottom: "1px solid #E2E8F0",
                            bgcolor: "transparent",
                          }}
                        >
                          EST. / BILLED REVENUE
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {advisorPerformance.map((advisor) => (
                        <TableRow
                          key={advisor.advisorId}
                          hover
                          sx={{ "&:last-child td": { borderBottom: 0 } }}
                        >
                          <TableCell sx={{ py: 1.5 }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                              <Avatar
                                sx={{
                                  width: 32,
                                  height: 32,
                                  bgcolor: "#EEF2FF",
                                  color: "#4F46E5",
                                  fontSize: "0.8rem",
                                  fontWeight: 700,
                                }}
                              >
                                {advisor.advisorName.charAt(0).toUpperCase()}
                              </Avatar>
                              <Box>
                                <Typography
                                  variant="body2"
                                  fontWeight={600}
                                  color="#1E293B"
                                >
                                  {advisor.advisorName}
                                </Typography>
                                {advisor.employeeCode && advisor.employeeCode !== "-" && (
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{ fontSize: "0.7rem" }}
                                  >
                                    {advisor.employeeCode}
                                  </Typography>
                                )}
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell align="center" sx={{ py: 1.5 }}>
                            <Chip
                              label={advisor.totalJobCards}
                              size="small"
                              sx={{
                                fontWeight: 700,
                                bgcolor: "#F1F5F9",
                                color: "#334155",
                              }}
                            />
                          </TableCell>
                          <TableCell align="center" sx={{ py: 1.5 }}>
                            <Typography variant="body2" fontWeight={700} color="#2563EB">
                              {advisor.inProgress}
                            </Typography>
                          </TableCell>
                          <TableCell align="center" sx={{ py: 1.5 }}>
                            <Typography variant="body2" fontWeight={700} color="#D97706">
                              {advisor.waiting}
                            </Typography>
                          </TableCell>
                          <TableCell align="center" sx={{ py: 1.5 }}>
                            <Typography variant="body2" fontWeight={700} color="#059669">
                              {advisor.completed}
                            </Typography>
                          </TableCell>
                          <TableCell align="right" sx={{ py: 1.5 }}>
                            <Typography variant="body2" fontWeight={700} color="#1E293B">
                              ₹{Number(advisor.totalRevenue || 0).toLocaleString("en-IN")}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </Box>
  );
}
