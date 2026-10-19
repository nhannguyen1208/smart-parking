export enum UserRole {
  STUDENT = "STUDENT",
  GUARD = "GUARD",
  ADMIN = "ADMIN",
}

export enum UserStatus {
  ACTIVE = "ACTIVE",
  SUSPENDED = "SUSPENDED",
}

export enum MembershipStatus {
  ACTIVE = "ACTIVE",
  EXPIRED = "EXPIRED",
  PENDING = "PENDING",
  CANCELLED = "CANCELLED",
}

export enum ParkingLotStatus {
  AVAILABLE = "AVAILABLE",
  NEARLY_FULL = "NEARLY_FULL",
  FULL = "FULL",
  CLOSED = "CLOSED",
  UNKNOWN = "UNKNOWN",
}

/** @deprecated use ParkingLotStatus */
export const ParkingZoneStatus = ParkingLotStatus;

export enum ParkingSessionStatus {
  ACTIVE = "ACTIVE",
  CLOSED = "CLOSED",
  REVIEW = "REVIEW",
  COMPLETED = "CLOSED",
}

export enum GateEventType {
  ENTRY = "ENTRY",
  EXIT = "EXIT",
  HEARTBEAT = "HEARTBEAT",
  DENIED = "DENIED",
  MANUAL_REVIEW = "MANUAL_REVIEW",
}

export enum GateEventSource {
  REAL_DEVICE = "REAL_DEVICE",
  MQTT = "MQTT",
  DEMO = "DEMO",
  MANUAL = "MANUAL",
}

export enum RfidCredentialType {
  UHF_STICKER = "UHF_STICKER",
  STUDENT_CARD = "STUDENT_CARD",
  OTHER = "OTHER",
}

export enum RfidCredentialStatus {
  ACTIVE = "ACTIVE",
  SUSPENDED = "SUSPENDED",
  REVOKED = "REVOKED",
}

export enum VehicleStatus {
  ACTIVE = "ACTIVE",
  DISABLED = "DISABLED",
}

export enum GateDeviceMode {
  MOCK = "MOCK",
  CONNECTED = "CONNECTED",
  OFFLINE = "OFFLINE",
}

export enum FeeRecordStatus {
  PENDING = "PENDING",
  PAID = "PAID",
  WAIVED = "WAIVED",
  VOID = "VOID",
  DEMO = "DEMO",
}

export enum GuestPassStatus {
  ACTIVE = "ACTIVE",
  USED = "USED",
  EXPIRED = "EXPIRED",
  REVOKED = "REVOKED",
}

export enum SosStatus {
  OPEN = "OPEN",
  ACCEPTED = "ACCEPTED",
  IN_PROGRESS = "IN_PROGRESS",
  RESOLVED = "RESOLVED",
  CANCELLED = "CANCELLED",
}

export enum NotificationStatus {
  QUEUED = "QUEUED",
  SENT = "SENT",
  FAILED = "FAILED",
  DEMO = "DEMO",
}

export enum ParkingEventType {
  ENTRY = "ENTRY",
  EXIT = "EXIT",
}

export enum IoTDeviceStatus {
  ONLINE = "ONLINE",
  OFFLINE = "OFFLINE",
  MAINTENANCE = "MAINTENANCE",
}
