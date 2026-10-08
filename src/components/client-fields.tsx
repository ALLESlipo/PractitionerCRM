import type { ClientDetails } from "@/lib/clients";
import { Field, Input, Select, Textarea } from "@/components/ui";

export function ClientFields({ client }: { client?: ClientDetails }) {
  return (
    <>
      <Field label="Full name *">
        <Input name="fullName" required defaultValue={client?.fullName} />
      </Field>
      <Field label="Email *" hint="Used to send the report and food guide.">
        <Input name="email" type="email" required defaultValue={client?.email} />
      </Field>
      <Field label="Phone">
        <Input name="phone" type="tel" defaultValue={client?.phone ?? ""} />
      </Field>
      <Field label="Date of birth">
        <Input name="dateOfBirth" type="date" defaultValue={client?.dateOfBirth ?? ""} />
      </Field>
      <Field label="Sex">
        <Select name="sex" defaultValue={client?.sex ?? ""}>
          <option value="">Not specified</option>
          <option value="F">Female</option>
          <option value="M">Male</option>
          <option value="other">Other</option>
        </Select>
      </Field>
      <div className="sm:col-span-2">
        <Field label="Notes">
          <Textarea name="notes" defaultValue={client?.notes ?? ""} />
        </Field>
      </div>
    </>
  );
}

export function KitFields({ kitCode, editing }: { kitCode?: string; editing?: boolean }) {
  return (
    <>
      <Field label="Kit ID *" hint="Printed in the Mimatest box, e.g. DBUQEK822449.">
        <Input name="kitCode" required defaultValue={kitCode} autoComplete="off" className="font-mono" />
      </Field>
      <Field label={editing ? "Access code" : "Access code *"} hint={editing ? "Leave blank to keep the current code." : "Printed in the box next to the kit ID."}>
        <Input name="accessCode" required={!editing} autoComplete="off" />
      </Field>
    </>
  );
}
