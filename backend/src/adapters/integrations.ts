/**
 * External integration adapters — DEMO / Not configured by default.
 * Never claim Connected without real credentials and an end-to-end test.
 */

export type IntegrationStatus = {
  id: string;
  name: string;
  status: "DEMO" | "NOT_CONFIGURED" | "CONNECTED";
  detail: string;
};

export class MockPaymentProvider {
  readonly mode = "DEMO" as const;
  async charge() {
    return {
      ok: true,
      mode: "DEMO",
      message: "Simulated payment — no real money charged",
      reference: `demo_${Date.now()}`,
    };
  }
}

export class MockLprAdapter {
  readonly mode = "DEMO" as const;
  async recognize(input: { plateOverride?: string }) {
    if (!input.plateOverride) {
      return {
        ok: false,
        mode: "DEMO",
        message: "AI-LPR not configured — provide manual plateOverride for simulation",
      };
    }
    return {
      ok: true,
      mode: "DEMO",
      plateNumber: input.plateOverride,
      confidence: 0,
      labelledSimulated: true,
    };
  }
}

export class MockLmsProvider {
  readonly mode = "DEMO" as const;
  async getTimetable() {
    return {
      mode: "DEMO",
      source: "DEMO",
      items: [],
      note: "Real LMS needs institutional API approval",
    };
  }
}

export class MockZaloNotificationProvider {
  readonly mode = "DEMO" as const;
  async send() {
    return {
      ok: true,
      mode: "DEMO",
      message: "Zalo OA/ZNS not configured — logged locally only",
    };
  }
}

export function getIntegrationStatuses(): IntegrationStatus[] {
  return [
    {
      id: "mqtt",
      name: "MQTT / RFID bridge",
      status: process.env.MQTT_ENABLED === "true" ? "CONNECTED" : "DEMO",
      detail:
        process.env.MQTT_ENABLED === "true"
          ? "MQTT client enabled (verify broker separately)"
          : "Using in-process DEMO scan / mock MQTT (no physical reader)",
    },
    {
      id: "zalo",
      name: "Zalo Mini App / OA / ZNS",
      status: process.env.ZALO_ZNS_CONFIGURED === "true" ? "NOT_CONFIGURED" : "NOT_CONFIGURED",
      detail: "Requires Zalo app credentials, OA templates, and policy approval",
    },
    {
      id: "payment",
      name: "Payment gateway",
      status: "DEMO",
      detail: "MockPaymentProvider — sample ledger only",
    },
    {
      id: "lpr",
      name: "AI license-plate recognition",
      status: "DEMO",
      detail: "MockLprAdapter — manual/simulated plate only",
    },
    {
      id: "lms",
      name: "LMS / timetable",
      status: "DEMO",
      detail: "Admin CSV / demo timetable only — no real LMS connection",
    },
  ];
}

export const mockPayment = new MockPaymentProvider();
export const mockLpr = new MockLprAdapter();
export const mockLms = new MockLmsProvider();
export const mockZalo = new MockZaloNotificationProvider();
