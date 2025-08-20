import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Chip,
  IconButton,
} from "@mui/material";
import {
  ArrowBack,
  DirectionsBus,
  LocationOn,
  ChevronLeft,
  ChevronRight,
} from "@mui/icons-material";
import { justRideClient, type TapHistoryRecord } from "../client/justride";
import type { AppSession } from "../session";

interface DayDetailProps {
  session: AppSession;
  year: number;
  month: number;
  day: number;
}

export function DayDetail({ session, year, month, day }: DayDetailProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dayHistory, setDayHistory] = useState<TapHistoryRecord[]>([]);

  useEffect(() => {
    async function loadDayData() {
      if (!session?.user?.id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const data = await justRideClient.getTapHistoryForDay(
          session.user.id,
          year,
          month,
          day,
        );
        // Sort by timestamp (earliest first)
        const sortedData = data.sort(
          (a, b) => a.doc.serverTimestamp - b.doc.serverTimestamp,
        );
        setDayHistory(sortedData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setLoading(false);
      }
    }

    loadDayData();
  }, [session?.user?.id, year, month, day]);

  const handleBack = () => {
    const monthStr = month.toString().padStart(2, "0");
    navigate(`/history/${year}-${monthStr}`);
  };

  const handlePrevDay = () => {
    const currentDate = new Date(year, month - 1, day);
    const prevDate = new Date(currentDate);
    prevDate.setDate(currentDate.getDate() - 1);

    const prevYear = prevDate.getFullYear();
    const prevMonth = prevDate.getMonth() + 1;
    const prevDay = prevDate.getDate();

    const yearStr = prevYear.toString();
    const monthStr = prevMonth.toString().padStart(2, "0");
    const dayStr = prevDay.toString().padStart(2, "0");

    navigate(`/history/${yearStr}-${monthStr}-${dayStr}`);
  };

  const handleNextDay = () => {
    const currentDate = new Date(year, month - 1, day);
    const nextDate = new Date(currentDate);
    nextDate.setDate(currentDate.getDate() + 1);

    const nextYear = nextDate.getFullYear();
    const nextMonth = nextDate.getMonth() + 1;
    const nextDay = nextDate.getDate();

    const yearStr = nextYear.toString();
    const monthStr = nextMonth.toString().padStart(2, "0");
    const dayStr = nextDay.toString().padStart(2, "0");

    navigate(`/history/${yearStr}-${monthStr}-${dayStr}`);
  };

  const isToday = () => {
    const today = new Date();
    const currentDate = new Date(year, month - 1, day);
    return (
      today.getFullYear() === currentDate.getFullYear() &&
      today.getMonth() === currentDate.getMonth() &&
      today.getDate() === currentDate.getDate()
    );
  };

  const formatDate = () => {
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

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

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
        <IconButton onClick={handleBack} sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>
        <Box sx={{ display: "flex", alignItems: "center", flex: 1 }}>
          <IconButton onClick={handlePrevDay}>
            <ChevronLeft />
          </IconButton>
          <Typography variant="h4" sx={{ flex: 1, textAlign: "center" }}>
            {formatDate()}
          </Typography>
          <IconButton onClick={handleNextDay} disabled={isToday()}>
            <ChevronRight />
          </IconButton>
        </Box>
      </Box>

      <Typography variant="h6" gutterBottom>
        {dayHistory.length} boarding{dayHistory.length !== 1 ? "s" : ""} on this
        day
      </Typography>

      {dayHistory.length === 0 ? (
        <Typography variant="body1" color="text.secondary">
          No boardings recorded for this day.
        </Typography>
      ) : (
        dayHistory.map((record) => (
          <Card key={record.doc.scanId} sx={{ mb: 2 }}>
            <CardContent>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}
              >
                <DirectionsBus color="primary" />
                <Typography variant="h6">Route {record.doc.routeId}</Typography>
                <Chip label={record.doc.outcome} size="small" />
              </Box>

              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}
              >
                <LocationOn fontSize="small" />
                <Typography variant="body2">
                  Vehicle {record.doc.vehicleId} • {record.doc.tokenName}
                </Typography>
              </Box>

              <Typography variant="body2" color="text.secondary" gutterBottom>
                {new Date(record.doc.serverTimestamp).toLocaleTimeString()}
              </Typography>

              <Box sx={{ mt: 2 }}>
                {record.doc.displayContext.map((context, idx) => (
                  <Chip
                    key={idx}
                    label={`${context.label}: ${context.data}`}
                    variant="outlined"
                    size="small"
                    sx={{ mr: 1 }}
                  />
                ))}
              </Box>

              <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                Product: {record.doc.productName} • Media:{" "}
                {record.doc.mediaFormat}
              </Typography>
            </CardContent>
          </Card>
        ))
      )}
    </Box>
  );
}
