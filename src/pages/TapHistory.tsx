import { useParams, useNavigate } from "react-router-dom";
import { HistoryCalendar } from "../components/HistoryCalendar";
import { DayDetail } from "../components/DayDetail";
import type { AppSession } from "../session";

export function TapHistory({ session }: { session: AppSession }) {
  const params = useParams<{ date?: string }>();
  const navigate = useNavigate();

  // Parse the date parameter
  const parseDate = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    if (!params.date) {
      // Default to current month
      return { year: currentYear, month: currentMonth, day: null };
    }

    const parts = params.date.split("-");

    if (parts.length === 2) {
      // YYYY-MM format
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      return { year, month, day: null };
    } else if (parts.length === 3) {
      // YYYY-MM-DD format
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      const day = parseInt(parts[2], 10);
      return { year, month, day };
    }

    // Invalid format, redirect to current month
    navigate(
      `/history/${currentYear}-${currentMonth.toString().padStart(2, "0")}`,
    );
    return { year: currentYear, month: currentMonth, day: null };
  };

  const { year, month, day } = parseDate();

  if (day) {
    // Show day detail view
    return <DayDetail session={session} year={year} month={month} day={day} />;
  } else {
    // Show calendar view
    return <HistoryCalendar session={session} year={year} month={month} />;
  }
}
