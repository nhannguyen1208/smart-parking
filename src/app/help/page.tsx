import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { faqItems } from "@/lib/mock-data";

export default function HelpPage() {
  return (
    <DashboardShell>
      <div className="space-y-6">
        <header>
          <h1 className="text-[30px] font-semibold text-navy">Help & Support</h1>
          <p className="mt-2 text-sm text-muted">
            FAQs and contact options for ParkEase campus parking.
          </p>
        </header>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-navy">Frequently asked questions</h2>
          <div className="mt-4 space-y-4">
            {faqItems.map((item) => (
              <div
                key={item.question}
                className="rounded-[10px] bg-background p-4"
              >
                <h3 className="font-semibold text-navy">{item.question}</h3>
                <p className="mt-2 text-sm text-muted">{item.answer}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-navy">Contact support</h2>
          <p className="mt-2 text-sm text-muted">
            Need help with payments, access, or RFID card issues?
          </p>
          <form className="mt-5 space-y-4">
            <Field label="Category" value="Parking access issue" />
            <Field label="Subject" value="Gate did not open with QR pass" />
            <Field label="Message" value="I tried scanning at 7:40 AM today..." />
          </form>
          <Button className="mt-5">Submit request</Button>
        </Card>
      </div>
    </DashboardShell>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className="text-xs font-semibold uppercase tracking-wide text-muted">
        {label}
      </label>
      <div className="mt-2 rounded-[10px] border border-border bg-background px-4 py-3 text-sm text-navy">
        {value}
      </div>
    </div>
  );
}
