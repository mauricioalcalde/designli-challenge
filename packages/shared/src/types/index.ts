// Shared type definitions for the Designli Challenge monorepo.
// Add domain types, DTOs, and API contracts here.

export type { RegisterDTO, LoginDTO, AuthResponse, JwtPayload } from './auth';
export type { StockListing, StockChartPoint, ChartRange, StockProviderConfig } from './stock';
export type { CreateAlertDTO, AlertResponse, AlertDirection, AlertStatus } from './alert';
export type { DeviceTokenDTO, AlertNotificationPayload, NotificationResult } from './notification';
