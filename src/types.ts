export interface User {
  id: string;
  name: string;
  email: string;
}

export interface AppSession {
  user?: User;
  signOut?: () => void;
}

export interface TapHistoryRecord {
  type: string;
  doc: {
    displayContext: Array<{ data: string; label: string }>;
    scannedAt?: { externalId: string };
    routeId: string;
    serverTimestamp: number;
    scanId: string;
    location: { lon: number; lat: number };
    vehicleId: string;
    brand: string;
    tokenName: string;
    outcome: string;
    productName: string;
    tripStart: number;
    productEnd: number;
    mediaFormat: string;
    fareBlocks: {
      outcome: string;
      trip: Array<{ name: string }>;
    };
  };
}
