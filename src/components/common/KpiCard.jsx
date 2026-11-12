import { Box, Card, CardContent, Typography } from "@mui/material";

const THEME_CONFIGS = {
  darkTeal: {
    accent: "#0D3B43",
    valueColor: "#0D3B43",
    iconBg: "#E8F1F2",
    iconColor: "#0D3B43",
  },
  teal: {
    accent: "#00BBA6",
    valueColor: "#00BBA6",
    iconBg: "#E6FBF7",
    iconColor: "#00BBA6",
  },
  green: {
    accent: "#10B981",
    valueColor: "#10B981",
    iconBg: "#ECFDF5",
    iconColor: "#059669",
  },
  sky: {
    accent: "#0284C7",
    valueColor: "#0284C7",
    iconBg: "#E0F2FE",
    iconColor: "#0284C7",
  },
  blue: {
    accent: "#2563EB",
    valueColor: "#2563EB",
    iconBg: "#EFF6FF",
    iconColor: "#2563EB",
  },
  navy: {
    accent: "#0F172A",
    valueColor: "#0F172A",
    iconBg: "#F1F5F9",
    iconColor: "#0F172A",
  },
  amber: {
    accent: "#D97706",
    valueColor: "#D97706",
    iconBg: "#FEF3C7",
    iconColor: "#D97706",
  },
  red: {
    accent: "#E11D48",
    valueColor: "#E11D48",
    iconBg: "#FFE4E6",
    iconColor: "#E11D48",
  },
  purple: {
    accent: "#7C3AED",
    valueColor: "#7C3AED",
    iconBg: "#F3E8FF",
    iconColor: "#7C3AED",
  },
};

export default function KpiCard({
  label,
  value,
  subtitle,
  icon: Icon,
  theme = "blue",
  accentColor,
  valueColor,
  iconBg,
  iconColor,
  onClick,
  sx = {},
}) {
  const currentTheme = THEME_CONFIGS[theme] || THEME_CONFIGS.blue;
  const topAccent = accentColor || currentTheme.accent;
  const numColor = valueColor || currentTheme.valueColor;
  const badgeBg = iconBg || currentTheme.iconBg;
  const badgeColor = iconColor || currentTheme.iconColor;

  return (
    <Card
      sx={{
        borderRadius: "12px",
        bgcolor: "#FFFFFF",
        border: "1px solid #E8EEF5",
        boxShadow: "0 2px 8px rgba(15, 23, 42, 0.04)",
        position: "relative",
        overflow: "hidden",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        cursor: onClick ? "pointer" : "default",
        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "3.5px",
          backgroundColor: topAccent,
        },
        "&:hover": {
          transform: onClick ? "translateY(-2px)" : "translateY(-1px)",
          boxShadow: "0 6px 18px rgba(15, 23, 42, 0.08)",
          borderColor: "#D5E2EE",
        },
        ...sx,
      }}
      onClick={onClick}
    >
      <CardContent sx={{ p: "14px 18px !important", flexGrow: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            mb: 1,
          }}
        >
          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              fontSize: { xs: "1.35rem", sm: "1.5rem", md: "1.65rem", lg: "1.75rem" },
              lineHeight: 1.15,
              color: numColor,
              letterSpacing: "-0.02em",
            }}
          >
            {value}
          </Typography>

          {Icon && (
            <Box
              sx={{
                width: 34,
                height: 34,
                borderRadius: "8px",
                bgcolor: badgeBg,
                color: badgeColor,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                transition: "transform 0.2s ease",
              }}
            >
              <Icon size={18} strokeWidth={2.2} />
            </Box>
          )}
        </Box>

        <Box>
          {label && (
            <Typography
              sx={{
                fontSize: "0.8rem",
                fontWeight: 600,
                color: "#475569",
                lineHeight: 1.3,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {label}
            </Typography>
          )}

          {subtitle && (
            <Typography
              component="div"
              sx={{
                fontSize: "0.72rem",
                color: "#94A3B8",
                fontWeight: 500,
                mt: 0.25,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                display: "flex",
                alignItems: "center",
                gap: 0.5,
              }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
