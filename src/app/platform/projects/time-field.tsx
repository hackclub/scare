"use client";

import { useId } from "react";

import { ArrowUpRight } from "~/app/_components/icons";
import { formatDuration, toHours } from "~/lib/time";
import { api } from "~/trpc/react";

export interface TimeValue {
  project: string | null;
  /** The hours box as typed; "" means "use whatever Hackatime tracked". */
  hours: string;
}

/** What to send to the server: claimedHours only when the participant typed their own figure. */
export function timePayload(v: TimeValue) {
  const n = v.hours.trim() === "" ? null : Number(v.hours);
  return {
    hackatimeProject: v.project,
    claimedHours: n === null || Number.isNaN(n) ? null : n,
  };
}

/**
 * Pick a Hackatime project and use its time, or override it. Without a Hackatime
 * link, it offers the link and a plain hours box.
 */
export function TimeField({
  value,
  onChange,
  error,
  next = "/platform/projects",
  frozen,
}: {
  value: TimeValue;
  onChange: (v: TimeValue) => void;
  error?: string;
  next?: string;
  /** A shipped game's total, frozen at shipping. Shown instead of the live total for that project. */
  frozen?: { project: string; seconds: number };
}) {
  const id = useId();
  const status = api.hackatime.status.useQuery(undefined, {
    staleTime: 60_000,
  });
  const linked = status.data?.linked ?? false;
  const projects = api.hackatime.projects.useQuery(undefined, {
    enabled: linked,
    staleTime: 60_000,
    retry: 1,
  });

  const found = projects.data?.find((p) => p.name === value.project);
  const isFrozen = !!found && frozen?.project === found.name;
  const selected = found && isFrozen ? { ...found, seconds: frozen.seconds } : found;
  const tracked = selected ? toHours(selected.seconds) : null;
  const edited =
    value.hours.trim() !== "" &&
    tracked !== null &&
    Number(value.hours) !== tracked;
  const connectHref = `/api/hackatime/connect?next=${encodeURIComponent(next)}`;

  return (
    <fieldset className="time">
      <legend className="field-label">
        Time spent
        <span className="field-hint">
          {linked ? "From Hackatime, or your own figure" : "Optional"}
        </span>
      </legend>

      {status.isPending ? (
        <p className="time-note">Checking Hackatime…</p>
      ) : !linked ? (
        status.data?.configured !== false && (
          <p className="time-note">
            <a href={connectHref} className="link">
              Link Hackatime
            </a>{" "}
            to pull your coding time straight from a project.
          </p>
        )
      ) : projects.isPending ? (
        <p className="time-note">Reading your Hackatime projects…</p>
      ) : projects.error ? (
        <p className="time-note time-error" role="alert">
          {projects.error.message}{" "}
          {projects.error.data?.code === "UNAUTHORIZED" ? (
            <a href={connectHref} className="link">
              Link it again
            </a>
          ) : (
            <button
              type="button"
              className="link"
              onClick={() => void projects.refetch()}
            >
              Retry
            </button>
          )}
        </p>
      ) : projects.data.length === 0 ? (
        <p className="time-note">
          No projects on Hackatime yet. Set up the{" "}
          <a href="https://hackatime.hackclub.com" className="link">
            Hackatime extension <ArrowUpRight className="link-icon" />
          </a>{" "}
          in your editor and your time shows up here.
        </p>
      ) : (
        <div className="field">
          <label htmlFor={`${id}-project`} className="time-sub">
            Hackatime project
          </label>
          <select
            id={`${id}-project`}
            className="input select"
            value={value.project ?? ""}
            onChange={(e) =>
              onChange({ project: e.target.value || null, hours: "" })
            }
          >
            <option value="">No Hackatime project</option>
            {projects.data.map((p) => (
              <option key={p.name} value={p.name}>
                {p.name} · {formatDuration(p.seconds)}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="field">
        <label htmlFor={`${id}-hours`} className="time-sub">
          Hours
        </label>
        <div className="time-row">
          <input
            id={`${id}-hours`}
            className="input time-hours"
            type="number"
            inputMode="decimal"
            min={0}
            max={2000}
            step={0.1}
            placeholder={tracked !== null ? String(tracked) : "0"}
            value={
              value.hours === "" && tracked !== null
                ? String(tracked)
                : value.hours
            }
            onChange={(e) => onChange({ ...value, hours: e.target.value })}
            aria-invalid={!!error}
            aria-describedby={`${id}-help${error ? ` ${id}-err` : ""}`}
          />
          {edited && (
            <button
              type="button"
              className="link"
              onClick={() => onChange({ ...value, hours: "" })}
            >
              Use Hackatime&rsquo;s {formatDuration(selected!.seconds)}
            </button>
          )}
        </div>
        <p id={`${id}-help`} className="time-note">
          {selected
            ? edited
              ? `Edited. Hackatime tracked ${formatDuration(selected.seconds)} on ${selected.name}${isFrozen ? " by the time you shipped" : ""}.`
              : isFrozen
                ? `Frozen at ${formatDuration(selected.seconds)} from ${selected.name} when you shipped.`
                : `Pulled from ${selected.name}. Change it if Hackatime missed time.`
            : "Roughly how long you've spent on it."}
        </p>
        {error && (
          <p id={`${id}-err`} className="field-error">
            {error}
          </p>
        )}
      </div>
    </fieldset>
  );
}
