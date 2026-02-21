import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  User, ClipboardList, Camera, MapPin, Table2, Clock,
  Package, Truck, Eye, Smartphone, CheckCircle2, ArrowDown,
  ArrowRight, Building2, AlertCircle
} from "lucide-react";

interface ProcessStep {
  id: string;
  number: string;
  title: string;
  description: string;
  icon: React.ElementType;
  department: "sales" | "operations" | "stores" | "delivery" | "finance";
  subSteps?: { id: string; text: string }[];
  deadline?: string;
}

const departmentColors: Record<string, string> = {
  sales: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  operations: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  stores: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  delivery: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  finance: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

const departmentBorders: Record<string, string> = {
  sales: "border-l-blue-500",
  operations: "border-l-purple-500",
  stores: "border-l-amber-500",
  delivery: "border-l-green-500",
  finance: "border-l-red-500",
};

const processSteps: ProcessStep[] = [
  {
    id: "step-1",
    number: "1",
    title: "Salesperson Approaches Customer",
    description: "Salesperson visits customer premises to take orders.",
    icon: User,
    department: "sales",
    subSteps: [
      { id: "1a", text: "Kiosk" },
      { id: "1b", text: "Retail" },
      { id: "1c", text: "Wholesale" },
      { id: "1d", text: "Wines & Spirits" },
      { id: "1e", text: "Bar & Restaurant" },
      { id: "1f", text: "Hotel" },
      { id: "1g", text: "School" },
      { id: "1h", text: "Supplier" },
    ],
  },
  {
    id: "step-2",
    number: "2",
    title: "Order Recording",
    description: "Salesperson takes the order and records it in the Order Book.",
    icon: ClipboardList,
    department: "sales",
  },
  {
    id: "step-3",
    number: "3",
    title: "Order Snapshot via WhatsApp",
    description: "Salesperson takes a snapshot of the order in the order book and sends it via WhatsApp to the Operations Department.",
    icon: Camera,
    department: "sales",
  },
  {
    id: "step-4",
    number: "4",
    title: "Location PIN & Contact Details",
    description: "Salesperson sends the customer shop Location PIN alongside contact details to the Operations department.",
    icon: MapPin,
    department: "sales",
  },
  {
    id: "step-5",
    number: "5",
    title: "Data Entry into Dashboard",
    description: "The Operations department enters data into the system dashboard (replacing Excel sheet).",
    icon: Table2,
    department: "operations",
  },
  {
    id: "step-6",
    number: "6",
    title: "Order Cutoff — 4:00 PM",
    description: "All valid orders for the day must be received by 4 PM for next day delivery.",
    icon: Clock,
    department: "operations",
    deadline: "4:00 PM",
  },
  {
    id: "step-7",
    number: "7",
    title: "Store Processing & Packing",
    description: "Starting at 4 PM, Store department processes orders by packing goods into trucks until 8 AM the next morning.",
    icon: Package,
    department: "stores",
    deadline: "4:00 PM → 8:00 AM",
    subSteps: [
      { id: "7a", text: "Each order is packed as a distinct parcel with unique parcel number" },
    ],
  },
  {
    id: "step-8",
    number: "8",
    title: "Flag Off — 8:00 AM",
    description: "Driver leaves with a dispatch form including coordinates, contacts, parcel numbers, particulars and value.",
    icon: Truck,
    department: "delivery",
    deadline: "8:00 AM",
    subSteps: [
      { id: "8a", text: "On arrival, driver shows parcel to customer for approval" },
      { id: "8b", text: "Customer sends funds to Finance via MPESA" },
      { id: "8c", text: "Finance confirms payment, signals driver to release parcel" },
    ],
  },
];

const customerTypes = [
  { label: "Kiosk", color: "bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200" },
  { label: "Retail", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200" },
  { label: "Wholesale", color: "bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200" },
  { label: "Wines & Spirits", color: "bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200" },
  { label: "Bar & Restaurant", color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200" },
  { label: "Hotel", color: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200" },
  { label: "School", color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200" },
  { label: "Supplier", color: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200" },
];

export default function ProcessMapPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Distribution Process Map</h1>
        <p className="text-muted-foreground">
          Veew Distributors — end-to-end order-to-delivery workflow
        </p>
      </div>

      {/* Department Legend */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(departmentColors).map(([dept, cls]) => (
          <Badge key={dept} className={cls + " capitalize"}>
            {dept}
          </Badge>
        ))}
      </div>

      {/* Customer Types */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Customer Categories
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {customerTypes.map((ct) => (
              <Badge key={ct.label} variant="outline" className={ct.color}>
                {ct.label}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Process Flow */}
      <div className="flex flex-col gap-4">
        {processSteps.map((step, idx) => (
          <div key={step.id} className="flex flex-col items-center gap-2">
            <Card className={`w-full border-l-4 ${departmentBorders[step.department]}`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {/* Step Number Circle */}
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-sm">
                    {step.number}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <step.icon className="h-4 w-4 text-muted-foreground shrink-0" />
                      <h3 className="font-semibold">{step.title}</h3>
                      <Badge className={departmentColors[step.department] + " text-xs"}>
                        {step.department}
                      </Badge>
                      {step.deadline && (
                        <Badge variant="destructive" className="text-xs flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {step.deadline}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{step.description}</p>

                    {step.subSteps && (
                      <div className="mt-3 flex flex-col gap-1.5">
                        {step.subSteps.map((sub) => (
                          <div key={sub.id} className="flex items-center gap-2 text-sm">
                            <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                            <span className="text-muted-foreground font-medium">{sub.id}.</span>
                            <span>{sub.text}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Arrow between steps */}
            {idx < processSteps.length - 1 && (
              <ArrowDown className="h-6 w-6 text-muted-foreground" />
            )}
          </div>
        ))}
      </div>

      {/* Daily Reports Summary */}
      <div className="mt-4">
        <h2 className="text-xl font-bold mb-4">Daily Reports Required</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ReportCard
            title="1. Stores Report"
            items={[
              "Stock position (opening stock, closing stock)",
              "Stock movement (received stock, issued stock)",
            ]}
            color="border-l-amber-500"
          />
          <ReportCard
            title="2. Procurement Report"
            items={[
              "What was procured (SKU)",
              "From who was it procured",
              "Quantity Procured",
              "Re-Order position (stock at time of order)",
            ]}
            color="border-l-purple-500"
          />
          <ReportCard
            title="3. Sales Report"
            items={[
              "Daily Sales Report",
              "Actual Sales vs Sales Target",
              "Value of sales",
              "Sales per salesperson",
            ]}
            color="border-l-blue-500"
          />
          <ReportCard
            title="4. Finance Report"
            items={[
              "Gross Profit Report",
              "Route Profitability",
              "Suppliers account reconciliation",
              "Creditors account reconciliation",
              "Sales: per agent, per route, per SKU, per category",
            ]}
            color="border-l-red-500"
          />
        </div>
      </div>
    </div>
  );
}

function ReportCard({ title, items, color }: { title: string; items: string[]; color: string }) {
  return (
    <Card className={`border-l-4 ${color}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-1">
          {items.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0 text-green-500" />
              {item}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
