import type { User } from "./client/justride";

export interface AppSession {
  user?: User;
  signOut?: () => void;
}
