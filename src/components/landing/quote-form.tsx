"use client";

import * as React from "react";
import { LockKeyhole, SendHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  buildWhatsappHref,
  quotePassengerOptions,
  quoteServiceOptions,
} from "@/components/landing/landing-data";

type QuoteState = {
  serviceType: (typeof quoteServiceOptions)[number];
  date: string;
  time: string;
  route: string;
  passengers: (typeof quotePassengerOptions)[number];
  name: string;
};

const initialState: QuoteState = {
  serviceType: quoteServiceOptions[0],
  date: "",
  time: "",
  route: "",
  passengers: quotePassengerOptions[0],
  name: "",
};

export function QuoteForm() {
  const [form, setForm] = React.useState<QuoteState>(initialState);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const message = [
      "Hi Siargao Rides, I'd like a quote for a private van service in Siargao.",
      "",
      `Service Type: ${form.serviceType}`,
      `Date: ${form.date || "Not specified"}`,
      `Time / Flight Arrival: ${form.time || "Not specified"}`,
      `Pickup and Destination: ${form.route.trim() || "Not specified"}`,
      `Passengers: ${form.passengers}`,
      `Name: ${form.name.trim() || "Not specified"}`,
    ].join("\n");

    window.open(buildWhatsappHref(message), "_blank", "noopener,noreferrer");
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/50 md:p-10">
      <div className="mb-8 text-center">
        <h3 className="mb-2 text-2xl font-semibold tracking-tight text-slate-900">
          Quick WhatsApp Quote
        </h3>
        <p className="text-sm text-slate-500">
          Fill in details to prefill your message in WhatsApp.
        </p>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-5">
          <div className="col-span-2 space-y-1.5">
            <Label
              htmlFor="serviceType"
              className="text-xs font-semibold uppercase tracking-wide text-slate-700"
            >
              Service Type
            </Label>
            <Select
              value={form.serviceType}
              onValueChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  serviceType: value as QuoteState["serviceType"],
                }))
              }
            >
              <SelectTrigger
                id="serviceType"
                className="h-12 w-full rounded-xl border-slate-200 bg-slate-50 text-sm text-slate-900 shadow-none"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {quoteServiceOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="col-span-2 space-y-1.5 sm:col-span-1">
            <Label
              htmlFor="date"
              className="text-xs font-semibold uppercase tracking-wide text-slate-700"
            >
              Date
            </Label>
            <Input
              id="date"
              type="date"
              value={form.date}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, date: event.target.value }))
              }
              className="h-12 rounded-xl border-slate-200 bg-slate-50 text-sm text-slate-900 shadow-none"
            />
          </div>

          <div className="col-span-2 space-y-1.5 sm:col-span-1">
            <Label
              htmlFor="time"
              className="text-xs font-semibold uppercase tracking-wide text-slate-700"
            >
              Time / Flight Arrival
            </Label>
            <Input
              id="time"
              type="time"
              value={form.time}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, time: event.target.value }))
              }
              className="h-12 rounded-xl border-slate-200 bg-slate-50 text-sm text-slate-900 shadow-none"
            />
          </div>

          <div className="col-span-2 space-y-1.5">
            <Label
              htmlFor="route"
              className="text-xs font-semibold uppercase tracking-wide text-slate-700"
            >
              Pickup and Destination
            </Label>
            <Input
              id="route"
              type="text"
              placeholder="e.g. IAO Airport to General Luna"
              value={form.route}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, route: event.target.value }))
              }
              className="h-12 rounded-xl border-slate-200 bg-slate-50 text-sm text-slate-900 placeholder:text-slate-400 shadow-none"
            />
          </div>

          <div className="col-span-2 space-y-1.5 sm:col-span-1">
            <Label
              htmlFor="passengers"
              className="text-xs font-semibold uppercase tracking-wide text-slate-700"
            >
              Passengers
            </Label>
            <Select
              value={form.passengers}
              onValueChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  passengers: value as QuoteState["passengers"],
                }))
              }
            >
              <SelectTrigger
                id="passengers"
                className="h-12 w-full rounded-xl border-slate-200 bg-slate-50 text-sm text-slate-900 shadow-none"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {quotePassengerOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="col-span-2 space-y-1.5 sm:col-span-1">
            <Label
              htmlFor="name"
              className="text-xs font-semibold uppercase tracking-wide text-slate-700"
            >
              Name
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="Your name"
              value={form.name}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, name: event.target.value }))
              }
              className="h-12 rounded-xl border-slate-200 bg-slate-50 text-sm text-slate-900 placeholder:text-slate-400 shadow-none"
            />
          </div>
        </div>

        <Button
          type="submit"
          className="mt-6 h-14 w-full rounded-xl bg-emerald-600 text-base font-medium text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700"
        >
          <SendHorizontal className="h-5 w-5" />
          Send Request via WhatsApp
        </Button>

        <p className="mt-4 flex items-center justify-center gap-1 text-center text-xs text-slate-400">
          <LockKeyhole className="h-3.5 w-3.5" />
          No payment required to get a quote.
        </p>
      </form>
    </div>
  );
}
