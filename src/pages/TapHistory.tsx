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
import type { AppSession, TapHistoryRecord } from "../types";

async function getJWTToken(service: string): Promise<string> {
  const response = await fetch(
    "/api/justride/broker/web-api/v1/RTDDENVER/tokens",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ service }),
    },
  );

  if (!response.ok) {
    throw new Error("Failed to get JWT token");
  }

  const data = await response.json();
  return data.jwtToken;
}

async function fetchTapHistory(
  accountId: string,
  jwtToken: string,
  size = 10,
): Promise<TapHistoryRecord[]> {
  const endTime = Date.now();
  const startTime = 1; // minimum startTime as per docs

  const response = await fetch(
    `/api/justride/edge/data/v2/RTDDENVER/account/${accountId}/history?size=${size}&startTime=${startTime}&endTime=${endTime}`,
    {
      headers: {
        Authorization: `Bearer ${jwtToken}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error("Failed to fetch tap history");
  }

  const data = await response.json();
  return data.hits || [];
}

export function TapHistory({ session }: { session: AppSession }) {
  const [history, setHistory] = useState<TapHistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadHistory() {
      console.log("TapHistory useEffect - session:", session);
      console.log("TapHistory useEffect - user:", session?.user);
      console.log("TapHistory useEffect - user.id:", session?.user?.id);

      if (!session?.user?.id) {
        console.log("No user ID found, not loading history");
        setLoading(false);
        return;
      }

      console.log("Starting to load history for user:", session.user.id);
      setLoading(true);
      setError(null);

      console.log("Getting JWT token...");
      const jwtToken = await getJWTToken("data");
      console.log("Got JWT token, fetching history...");
      const historyData = await fetchTapHistory(session.user.id, jwtToken);
      console.log("History data received:", historyData);
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
