import { Box, Typography } from "@mui/material";
import { useSession } from "@toolpad/core/useSession";
import type { AppSession } from "../types";

export function HomePage() {
  const session = useSession() as AppSession;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Welcome, {session?.user?.name}!
      </Typography>
      <Typography variant="body1" gutterBottom>
        Account: {session?.user?.id}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Use the navigation menu to explore your MyRide data.
      </Typography>
    </Box>
  );
}
