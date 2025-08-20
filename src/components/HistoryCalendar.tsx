import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Paper,
  IconButton,
  CircularProgress,
  Alert,
} from "@mui/material";
import { useColorScheme } from "@mui/material/styles";
import { ChevronLeft, ChevronRight } from "@mui/icons-material";
import { justRideClient, type TapHistoryRecord } from "../client/justride";
import type { AppSession } from "../session";

interface DayData {
  date: number;
  boardingCount: number;
  isCurrentMonth: boolean;
}

interface HistoryCalendarProps {
  session: AppSession;
  year: number;
  month: number;
}

export function HistoryCalendar({
  session,
  year,
  month,
}: HistoryCalendarProps) {
  const navigate = useNavigate();
  const { mode } = useColorScheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [historyData, setHistoryData] = useState<TapHistoryRecord[]>([]);

  const boardingCountColors = {
    light: {
      0: "#ffffff",
      1: "#dbeafe",
      2: "#93c5fd",
      3: "#6ee7b7",
      4: "#34d399",
      5: "#fde047",
      6: "#fbbf24",
      7: "#fb923c",
      8: "#f87171",
    },
    dark: {
      0: "#1a1a1a",
      1: "#1e3a8a",
      2: "#1e40af",
      3: "#047857",
      4: "#059669",
      5: "#ca8a04",
      6: "#d97706",
      7: "#c2410c",
      8: "#b91c1c",
    },
  };

  const getBoardingCountColor = (count: number) => {
    const resolvedMode: "light" | "dark" =
      mode === "system" ? "light" : (mode as "light" | "dark");
    const colorIndex = count >= 8 ? 8 : count;

    return boardingCountColors[resolvedMode][
      colorIndex as keyof typeof boardingCountColors.light
    ];
  };

  useEffect(() => {
    async function loadMonthData() {
      if (!session?.user?.id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const data = await justRideClient.getTapHistoryForMonth(
          session.user.id,
          year,
          month,
        );
        setHistoryData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setLoading(false);
      }
    }

    loadMonthData();
  }, [session?.user?.id, year, month]);

  const getDaysInMonth = (): DayData[] => {
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const firstDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const days: DayData[] = [];

    // Add days from previous month
    const prevMonth = new Date(year, month - 2, 0);
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: prevMonth.getDate() - i,
        boardingCount: 0,
        isCurrentMonth: false,
      });
    }

    // Add days from current month
    for (let date = 1; date <= daysInMonth; date++) {
      const dayData = historyData.filter((record) => {
        const recordDate = new Date(record.doc.serverTimestamp);
        return (
          recordDate.getFullYear() === year &&
          recordDate.getMonth() === month - 1 &&
          recordDate.getDate() === date
        );
      });

      days.push({
        date,
        boardingCount: dayData.length,
        isCurrentMonth: true,
      });
    }

    // Add days from next month
    const totalCells = Math.ceil(days.length / 7) * 7;
    let nextMonthDate = 1;
    for (let i = days.length; i < totalCells; i++) {
      days.push({
        date: nextMonthDate++,
        boardingCount: 0,
        isCurrentMonth: false,
      });
    }

    return days;
  };

  const handlePrevMonth = () => {
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    navigate(`/history/${prevYear}-${prevMonth.toString().padStart(2, "0")}`);
  };

  const isCurrentOrFutureMonth = () => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;

    return (
      year > currentYear || (year === currentYear && month >= currentMonth)
    );
  };

  const handleNextMonth = () => {
    if (isCurrentOrFutureMonth()) return; // Prevent going to future months

    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    navigate(`/history/${nextYear}-${nextMonth.toString().padStart(2, "0")}`);
  };

  const isFutureDate = (day: DayData) => {
    if (!day.isCurrentMonth) return false;

    const today = new Date();
    const dayDate = new Date(year, month - 1, day.date);
    return dayDate > today;
  };

  const handleDayClick = (day: DayData) => {
    if (!day.isCurrentMonth || isFutureDate(day)) return;
    const dayStr = day.date.toString().padStart(2, "0");
    const monthStr = month.toString().padStart(2, "0");
    navigate(`/history/${year}-${monthStr}-${dayStr}`);
  };

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  const days = getDaysInMonth();

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
        <IconButton onClick={handlePrevMonth}>
          <ChevronLeft />
        </IconButton>
        <Typography variant="h4" sx={{ flex: 1, textAlign: "center" }}>
          {monthNames[month - 1]} {year}
        </Typography>
        <IconButton
          onClick={handleNextMonth}
          disabled={isCurrentOrFutureMonth()}
        >
          <ChevronRight />
        </IconButton>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: 1,
          mb: 2,
        }}
      >
        {weekDays.map((day) => (
          <Box key={day}>
            <Typography variant="subtitle2" align="center" fontWeight="bold">
              {day}
            </Typography>
          </Box>
        ))}
      </Box>

      <Box
        sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 1 }}
      >
        {days.map((day, index) => (
          <Paper
            key={index}
            sx={{
              aspectRatio: "1",
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor:
                day.isCurrentMonth && !isFutureDate(day)
                  ? "pointer"
                  : "default",
              opacity: day.isCurrentMonth ? (isFutureDate(day) ? 0.5 : 1) : 0.3,
              bgcolor: getBoardingCountColor(day.boardingCount),
              "&:hover":
                day.isCurrentMonth && !isFutureDate(day)
                  ? {
                      filter: "brightness(0.9)",
                      transform: "scale(0.98)",
                    }
                  : {},
              transition: "all 0.2s ease-in-out",
            }}
            onClick={() => handleDayClick(day)}
          >
            <Typography
              variant="caption"
              sx={{
                position: "absolute",
                top: 4,
                right: 6,
                fontSize: "0.75rem",
                fontWeight: "bold",
              }}
            >
              {day.date}
            </Typography>
            {day.boardingCount > 0 && (
              <Typography
                variant="h4"
                fontWeight="bold"
                sx={{
                  fontSize: { xs: "1.5rem", sm: "2rem" },
                  position: { xs: "absolute", sm: "static" },
                  bottom: { xs: 4, sm: "auto" },
                  left: { xs: 6, sm: "auto" },
                }}
              >
                {day.boardingCount}
              </Typography>
            )}
          </Paper>
        ))}
      </Box>
    </Box>
  );
}
