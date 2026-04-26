export interface AuthUser {
  id: string;
  displayName: string;
  email: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}
