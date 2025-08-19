import { History as HistoryIcon, Home as HomeIcon } from "@mui/icons-material";
import type { Navigation } from "@toolpad/core";

export const NAVIGATION: Navigation = [
  {
    segment: "",
    title: "Home",
    icon: <HomeIcon />,
  },
  {
    segment: "history",
    title: "Tap History",
    icon: <HistoryIcon />,
  },
];
