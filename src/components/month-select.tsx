"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDict } from "@/components/i18n-provider";

export function MonthSelect({
  value,
  options,
}: {
  value: string;
  options: { value: string; label: string }[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dict = useDict();

  function onChange(v: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("month", v);
    router.replace(`?${params.toString()}`);
  }

  return (
    <Select value={value} onValueChange={(v) => onChange(v as string)} items={options}>
      <SelectTrigger className="w-44">
        <SelectValue placeholder={dict.transactions.month} />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
