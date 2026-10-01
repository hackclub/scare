"use client";

import { useState } from "react";

import { Ascii } from "~/app/_components/ascii";
import { ArrowRight, ArrowUpRight, Plus } from "~/app/_components/icons";
import { safeHref } from "~/lib/safe-url";
import { pumpkinsForSeconds } from "~/lib/program";
import { formatDuration, toHours } from "~/lib/time";
import { api, type RouterOutputs } from "~/trpc/react";
import { TimeField, timePayload, type TimeValue } from "./time-field";

type Game = RouterOutputs["game"]["mine"][number];

const text = (f: FormData, key: string) => {
  const v = f.get(key);
  return typeof v === "string" ? v : "";
};

function fieldErrors(error: unknown) {
  const e = error as {
    data?: { zodError?: { fieldErrors?: Record<string, string[]> } };
  };
  return e?.data?.zodError?.fieldErrors ?? {};
}

export function GameBoard({ startAdding = false }: { startAdding?: boolean }) {
  const [games] = api.game.mine.useSuspenseQuery();
  const [adding, setAdding] = useState(startAdding || games.length === 0);
  const shipped = games.filter((g) => g.status === "SHIPPED").length;

  return (
    <section className="board" aria-labelledby="board-title">
      <div className="board-head">
        <h2 id="board-title" className="board-title">
          {games.length} {games.length === 1 ? "game" : "games"}
          <span className="board-sub">{shipped} shipped</span>
        </h2>
        {!adding && (
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => setAdding(true)}
          >
            <Plus className="btn-icon" />
            <span>Register a game</span>
          </button>
        )}
      </div>

      {adding && (
        <NewGame onDone={() => setAdding(false)} canCancel={games.length > 0} />
      )}

      {games.length === 0 && !adding ? (
        <Empty />
      ) : (
        <ul className="games">
          {games.map((g) => (
            <GameRow key={g.id} game={g} />
          ))}
        </ul>
      )}
      {games.length === 0 && adding && <Empty quiet />}
    </section>
  );
}

function Empty({ quiet = false }: { quiet?: boolean }) {
  return (
    <div className={`empty ${quiet ? "empty-quiet" : ""}`}>
      <Ascii name="tomb" className="empty-art" />
      <p>No games here yet. Every haunt starts empty.</p>
    </div>
  );
}

function NewGame({
  onDone,
  canCancel,
}: {
  onDone: () => void;
  canCancel: boolean;
}) {
  const utils = api.useUtils();
  const [time, setTime] = useState<TimeValue>({ project: null, hours: "" });
  const create = api.game.create.useMutation({
    onSuccess: async () => {
      await utils.game.mine.invalidate();
      onDone();
    },
  });
  const errs = fieldErrors(create.error);

  return (
    <form
      className="form panel"
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        create.mutate({
          title: text(f, "title"),
          pitch: text(f, "pitch"),
          engine: text(f, "engine") || undefined,
          sourceUrl: text(f, "sourceUrl"),
          ...timePayload(time),
        });
      }}
      noValidate
    >
      <h3 className="panel-title">Register a game</h3>

      <Field
        label="Name"
        name="title"
        placeholder="The Thing in the Vents"
        error={errs.title}
        required
        maxLength={80}
      />
      <Field
        label="Description"
        name="pitch"
        note="A quick description of your project."
        placeholder="You're alone on a night shift and the cameras keep moving."
        error={errs.pitch}
        required
        maxLength={280}
        multiline
      />
      <div className="form-row">
        <Field
          label="Engine"
          name="engine"
          placeholder="Godot"
          hint="Optional"
          maxLength={40}
        />
        <Field
          label="Source code"
          name="sourceUrl"
          placeholder="https://github.com/…"
          type="url"
          error={errs.sourceUrl}
          required
        />
      </div>
      <TimeField
        value={time}
        onChange={setTime}
        error={errs.claimedHours?.[0] ?? errs.hackatimeProject?.[0]}
      />

      {create.error && !Object.keys(errs).length && (
        <p className="form-error" role="alert">
          That didn&rsquo;t save: {create.error.message}. Try again in a moment.
        </p>
      )}

      <div className="form-actions">
        <button
          type="submit"
          className="btn btn-primary"
          disabled={create.isPending}
        >
          <span>{create.isPending ? "Saving…" : "Register game"}</span>
          <ArrowRight className="btn-icon" />
        </button>
        {canCancel && (
          <button type="button" className="btn btn-ghost" onClick={onDone}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  idPrefix = "f",
  hint,
  note,
  error,
  multiline,
  ...rest
}: {
  label: string;
  name: string;
  /** Keeps ids unique when several forms are on the page. */
  idPrefix?: string;
  hint?: string;
  /** A line of guidance under the label. */
  note?: string;
  error?: string[];
  multiline?: boolean;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  const id = `${idPrefix}-${name}`;
  const describedBy =
    [note && `${id}-note`, error?.length && `${id}-err`].filter(Boolean).join(" ") || undefined;
  return (
    <div className="field">
      <label htmlFor={id} className="field-label">
        {label}
        {hint && <span className="field-hint">{hint}</span>}
      </label>
      {note && (
        <p id={`${id}-note`} className="field-note">
          {note}
        </p>
      )}
      {multiline ? (
        <textarea
          id={id}
          name={name}
          rows={2}
          className="input"
          aria-invalid={!!error?.length}
          aria-describedby={describedBy}
          placeholder={rest.placeholder}
          required={rest.required}
          maxLength={rest.maxLength}
          defaultValue={rest.defaultValue}
        />
      ) : (
        <input
          id={id}
          name={name}
          className="input"
          aria-invalid={!!error?.length}
          aria-describedby={describedBy}
          {...rest}
        />
      )}
      {error?.length ? (
        <p id={`${id}-err`} className="field-error">
          {error[0]}
        </p>
      ) : null}
    </div>
  );
}

function GameRow({ game }: { game: Game }) {
  const utils = api.useUtils();
  const [shipping, setShipping] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [editingTime, setEditingTime] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [editingShip, setEditingShip] = useState(false);
  const ship = api.game.ship.useMutation({
    onSuccess: async () => {
      await utils.game.mine.invalidate();
      setShipping(false);
    },
  });
  const remove = api.game.remove.useMutation({
    onSuccess: () => utils.game.mine.invalidate(),
  });
  const shipped = game.status === "SHIPPED";
  const shipErr = fieldErrors(ship.error).playUrl?.[0];

  return (
    <li className={`game ${shipped ? "game-shipped" : ""}`}>
      <div className="game-main">
        <div className="game-top">
          <h3 className="game-title">{game.title}</h3>
          {!shipped && (
            <p className="game-status">
              <span className="status-dot" aria-hidden="true" />
              Brewing
            </p>
          )}
        </div>
        <p className="game-pitch">{game.pitch}</p>
        <GameTime game={game} />
        {editingTime && !shipped && (
          <EditTime game={game} onDone={() => setEditingTime(false)} />
        )}
        <p className="game-links">
          {game.engine && <span className="game-engine">{game.engine}</span>}
          {game.playUrl && (
            <a
              href={safeHref(game.playUrl)}
              className="link"
              target="_blank"
              rel="noreferrer"
            >
              Play <ArrowUpRight className="link-icon" />
            </a>
          )}
          {game.sourceUrl && (
            <a
              href={safeHref(game.sourceUrl)}
              className="link"
              target="_blank"
              rel="noreferrer"
            >
              Source <ArrowUpRight className="link-icon" />
            </a>
          )}
        </p>
      </div>

      {shipped && (
        <div className="game-actions">
          <p className="game-status">
            <span className="status-dot" aria-hidden="true" />
            Shipped
          </p>
          <button
            type="button"
            className="link"
            aria-expanded={showDetails}
            aria-controls={`ship-details-${game.id}`}
            onClick={() => {
              setShowDetails((v) => !v);
              setEditingShip(false);
            }}
          >
            {showDetails ? "Hide details" : "View details"}
          </button>
          <a
            href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(`Scare: ${game.title}`)}`}
            className="link link-quiet"
          >
            Support
          </a>
        </div>
      )}

      {shipped && showDetails && (
        <div id={`ship-details-${game.id}`} className="ship-pane">
          {editingShip ? (
            <EditShipped game={game} onDone={() => setEditingShip(false)} />
          ) : (
            <>
              <ShipDetails game={game} />
              <button
                type="button"
                className="link"
                onClick={() => setEditingShip(true)}
              >
                Edit details
              </button>
            </>
          )}
        </div>
      )}

      {!shipped && (
        <div className="game-actions">
          {shipping ? (
            <form
              className="ship-form"
              onSubmit={(e) => {
                e.preventDefault();
                const url = text(new FormData(e.currentTarget), "playUrl");
                ship.mutate({ id: game.id, playUrl: url });
              }}
              noValidate
            >
              <label htmlFor={`ship-${game.id}`} className="field-label">
                Where can people play it?
              </label>
              <input
                id={`ship-${game.id}`}
                name="playUrl"
                type="url"
                className="input"
                defaultValue={game.playUrl ?? ""}
                placeholder="https://you.itch.io/…"
                aria-invalid={!!shipErr}
                aria-describedby={shipErr ? `ship-${game.id}-err` : undefined}
                autoFocus
              />
              {shipErr && (
                <p id={`ship-${game.id}-err`} className="field-error">
                  {shipErr}
                </p>
              )}
              <div className="form-actions">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={ship.isPending}
                >
                  <span>{ship.isPending ? "Shipping…" : "Ship it"}</span>
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setShipping(false)}
                >
                  Not yet
                </button>
              </div>
            </form>
          ) : (
            <>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setShipping(true)}
              >
                <span>Mark as shipped</span>
              </button>
              {!editingTime && (
                <button
                  type="button"
                  className="link"
                  onClick={() => setEditingTime(true)}
                >
                  Edit time
                </button>
              )}
              {confirmRemove ? (
                <span className="confirm">
                  Delete for good?{" "}
                  <button
                    type="button"
                    className="link link-danger"
                    onClick={() => remove.mutate({ id: game.id })}
                    disabled={remove.isPending}
                  >
                    Yes, delete
                  </button>{" "}
                  <button
                    type="button"
                    className="link"
                    onClick={() => setConfirmRemove(false)}
                  >
                    Keep it
                  </button>
                </span>
              ) : (
                <button
                  type="button"
                  className="link link-quiet"
                  onClick={() => setConfirmRemove(true)}
                >
                  Delete
                </button>
              )}
            </>
          )}
        </div>
      )}
    </li>
  );
}

const SUPPORT_EMAIL = "barnav@hackclub.com";

const formatDate = (d: Date | string | null) =>
  d
    ? new Date(d).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

/** What was shipped, at a glance. */
function ShipDetails({ game }: { game: Game }) {
  const { tracked, counted } = useGameSeconds(game);
  const none = <span className="pf-muted">None</span>;
  const url = (href: string | null) =>
    href ? (
      <a href={safeHref(href)} className="link" target="_blank" rel="noreferrer">
        {href.replace(/^https?:\/\//, "")}
      </a>
    ) : (
      none
    );

  return (
    <dl className="ledger ship-details">
      <div>
        <dt>Shipped</dt>
        <dd>{formatDate(game.shippedAt) ?? none}</dd>
      </div>
      <div>
        <dt>Play</dt>
        <dd>{url(game.playUrl)}</dd>
      </div>
      <div>
        <dt>Source</dt>
        <dd>{url(game.sourceUrl)}</dd>
      </div>
      <div>
        <dt>Engine</dt>
        <dd>{game.engine ?? none}</dd>
      </div>
      <div>
        <dt>Time</dt>
        <dd>
          {counted !== null ? formatDuration(counted) : none}
          {game.claimedSeconds !== null && tracked !== null && (
            <span className="pf-muted"> (edited from {formatDuration(tracked)})</span>
          )}
        </dd>
      </div>
      <div>
        <dt>Hackatime project</dt>
        <dd>{game.hackatimeProject ?? none}</dd>
      </div>
      <div>
        <dt>Registered</dt>
        <dd>{formatDate(game.createdAt)}</dd>
      </div>
    </dl>
  );
}

/** The details pane in edit mode: everything about a shipped game, including its Hackatime project. */
function EditShipped({ game, onDone }: { game: Game; onDone: () => void }) {
  const utils = api.useUtils();
  const [time, setTime] = useState<TimeValue>({
    project: game.hackatimeProject,
    hours:
      game.claimedSeconds !== null ? String(toHours(game.claimedSeconds)) : "",
  });
  const save = api.game.updateShipped.useMutation({
    onSuccess: async () => {
      await utils.game.mine.invalidate();
      onDone();
    },
  });
  const errs = fieldErrors(save.error);
  const p = `edit-${game.id}`;

  return (
    <form
      className="form ship-edit"
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        save.mutate({
          id: game.id,
          title: text(f, "title"),
          pitch: text(f, "pitch"),
          engine: text(f, "engine") || undefined,
          sourceUrl: text(f, "sourceUrl"),
          playUrl: text(f, "playUrl"),
          ...timePayload(time),
        });
      }}
      noValidate
    >
      <Field
        idPrefix={p}
        label="Name"
        name="title"
        defaultValue={game.title}
        error={errs.title}
        required
        maxLength={80}
      />
      <Field
        idPrefix={p}
        label="Description"
        name="pitch"
        note="A quick description of your project."
        defaultValue={game.pitch}
        error={errs.pitch}
        required
        maxLength={280}
        multiline
      />
      <div className="form-row">
        <Field
          idPrefix={p}
          label="Engine"
          name="engine"
          hint="Optional"
          defaultValue={game.engine ?? ""}
          maxLength={40}
        />
        <Field
          idPrefix={p}
          label="Source code"
          name="sourceUrl"
          type="url"
          defaultValue={game.sourceUrl ?? ""}
          error={errs.sourceUrl}
          required
        />
      </div>
      <Field
        idPrefix={p}
        label="Play link"
        name="playUrl"
        type="url"
        defaultValue={game.playUrl ?? ""}
        error={errs.playUrl}
        required
      />
      <TimeField
        value={time}
        onChange={setTime}
        frozen={
          game.hackatimeProject && game.trackedSeconds !== null
            ? { project: game.hackatimeProject, seconds: game.trackedSeconds }
            : undefined
        }
        error={errs.claimedHours?.[0] ?? errs.hackatimeProject?.[0]}
      />

      {save.error && !Object.keys(errs).length && (
        <p className="form-error" role="alert">
          That didn&rsquo;t save: {save.error.message}
        </p>
      )}

      <div className="form-actions">
        <button
          type="submit"
          className="btn btn-primary"
          disabled={save.isPending}
        >
          <span>{save.isPending ? "Saving…" : "Save changes"}</span>
        </button>
        <button type="button" className="btn btn-ghost" onClick={onDone}>
          Cancel
        </button>
      </div>
    </form>
  );
}

/** Seconds that count for a game: the participant's own figure if they edited it, else Hackatime's. */
function useGameSeconds(game: Game) {
  const status = api.hackatime.status.useQuery(undefined, {
    staleTime: 60_000,
  });
  const live = api.hackatime.projects.useQuery(undefined, {
    // Brewing games follow Hackatime live; shipped games keep the total frozen at shipping.
    enabled: Boolean(
      status.data?.linked && game.hackatimeProject && game.status === "BREWING",
    ),
    staleTime: 60_000,
    retry: false,
  });
  const tracked =
    live.data?.find((p) => p.name === game.hackatimeProject)?.seconds ??
    game.trackedSeconds;
  return { tracked, counted: game.claimedSeconds ?? tracked };
}

function GameTime({ game }: { game: Game }) {
  const { tracked, counted } = useGameSeconds(game);
  if (counted === null && !game.hackatimeProject) return null;
  return (
    <p className="game-time">
      <span className="game-time-value">{formatDuration(counted)}</span>
      {counted !== null && counted > 0 && (
        <span className="game-time-pumpkins">≈ {pumpkinsForSeconds(counted)} Pumpkins</span>
      )}
      {game.hackatimeProject && (
        <span className="game-time-src">
          Hackatime · {game.hackatimeProject}
          {game.claimedSeconds !== null && tracked !== null && (
            <> · edited from {formatDuration(tracked)}</>
          )}
        </span>
      )}
      {!game.hackatimeProject && (
        <span className="game-time-src">Entered by you</span>
      )}
    </p>
  );
}

function EditTime({ game, onDone }: { game: Game; onDone: () => void }) {
  const utils = api.useUtils();
  const [time, setTime] = useState<TimeValue>({
    project: game.hackatimeProject,
    hours:
      game.claimedSeconds !== null ? String(toHours(game.claimedSeconds)) : "",
  });
  const save = api.game.setTime.useMutation({
    onSuccess: async () => {
      await utils.game.mine.invalidate();
      onDone();
    },
  });
  const errs = fieldErrors(save.error);

  return (
    <form
      className="game-time-form"
      onSubmit={(e) => {
        e.preventDefault();
        save.mutate({ id: game.id, ...timePayload(time) });
      }}
      noValidate
    >
      <TimeField
        value={time}
        onChange={setTime}
        error={
          errs.claimedHours?.[0] ??
          (save.error && !Object.keys(errs).length
            ? save.error.message
            : undefined)
        }
      />
      <div className="form-actions">
        <button
          type="submit"
          className="btn btn-primary"
          disabled={save.isPending}
        >
          <span>{save.isPending ? "Saving…" : "Save time"}</span>
        </button>
        <button type="button" className="btn btn-ghost" onClick={onDone}>
          Cancel
        </button>
      </div>
    </form>
  );
}
