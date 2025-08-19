import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Chip,
} from "@mui/material";
import { DirectionsBus, LocationOn } from "@mui/icons-material";
import { justRideClient, type TapHistoryRecord } from "../client/justride";
import type { AppSession } from "../session";

export function TapHistory({ session }: { session: AppSession }) {
  const [history, setHistory] = useState<TapHistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadHistory() {
      if (!session?.user?.id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      const historyData = await justRideClient.getTapHistory(session.user.id);
      setHistory(historyData);
      setLoading(false);
    }

    loadHistory().catch((err) => {
      console.error("Error loading history:", err);
      setError(err.message);
      setLoading(false);
    });
  }, [session]);

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
      <Typography variant="h4" gutterBottom>
        Tap History
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Showing {history.length} recent tap records
      </Typography>

      {history.map((record) => (
        <Card key={record.doc.scanId} sx={{ mb: 2 }}>
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
              <DirectionsBus color="primary" />
              <Typography variant="h6">Route {record.doc.routeId}</Typography>
              <Chip label={record.doc.outcome} size="small" />
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <LocationOn fontSize="small" />
              <Typography variant="body2">
                Vehicle {record.doc.vehicleId} • {record.doc.tokenName}
              </Typography>
            </Box>

            <Typography variant="body2" color="text.secondary" gutterBottom>
              {new Date(record.doc.serverTimestamp).toLocaleString()}
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
      ))}
    </Box>
  );
}
