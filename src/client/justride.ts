export interface User {
  id: string;
  name: string;
  email: string;
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

interface LoginResponse {
  account: string;
  emailAddress: string;
  message: string;
  username: string;
}

interface TokenResponse {
  jwtToken: string;
}

interface HistoryResponse {
  total: {
    value: number;
    relation: string;
  };
  hits: TapHistoryRecord[];
  nextPageId?: string;
}

class JustRideClient {
  private baseUrl = "/api/justride";

  async login(email: string, password: string): Promise<User> {
    const authString = btoa(`${email}:${password}`);

    const response = await fetch(
      `${this.baseUrl}/broker/web-api/v1/RTDDENVER/login`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${authString}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      },
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Login failed");
    }

    const data: LoginResponse = await response.json();
    return {
      id: data.account,
      name: data.username,
      email: data.emailAddress,
    };
  }

  async getJWTToken(service: string): Promise<string> {
    const response = await fetch(
      `${this.baseUrl}/broker/web-api/v1/RTDDENVER/tokens`,
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

    const data: TokenResponse = await response.json();
    return data.jwtToken;
  }

  async fetchTapHistory(
    accountId: string,
    jwtToken: string,
    size = 10,
    startTime = 1,
    endTime = Date.now(),
  ): Promise<TapHistoryRecord[]> {
    const response = await fetch(
      `${this.baseUrl}/edge/data/v2/RTDDENVER/account/${accountId}/history?size=${size}&startTime=${startTime}&endTime=${endTime}`,
      {
        headers: {
          Authorization: `Bearer ${jwtToken}`,
        },
      },
    );

    if (!response.ok) {
      throw new Error("Failed to fetch tap history");
    }

    const data: HistoryResponse = await response.json();
    return data.hits || [];
  }

  async getTapHistory(
    accountId: string,
    size = 10,
  ): Promise<TapHistoryRecord[]> {
    const jwtToken = await this.getJWTToken("data");
    return this.fetchTapHistory(accountId, jwtToken, size);
  }

  async getTapHistoryForDateRange(
    accountId: string,
    startDate: Date,
    endDate: Date,
    size = 1000,
  ): Promise<TapHistoryRecord[]> {
    const jwtToken = await this.getJWTToken("data");
    return this.fetchTapHistory(
      accountId,
      jwtToken,
      size,
      startDate.getTime(),
      endDate.getTime(),
    );
  }

  async getTapHistoryForMonth(
    accountId: string,
    year: number,
    month: number,
  ): Promise<TapHistoryRecord[]> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);
    return this.getTapHistoryForDateRange(accountId, startDate, endDate);
  }

  async getTapHistoryForDay(
    accountId: string,
    year: number,
    month: number,
    day: number,
  ): Promise<TapHistoryRecord[]> {
    const startDate = new Date(year, month - 1, day, 0, 0, 0, 0);
    const endDate = new Date(year, month - 1, day, 23, 59, 59, 999);
    return this.getTapHistoryForDateRange(accountId, startDate, endDate);
  }
}

export const justRideClient = new JustRideClient();
