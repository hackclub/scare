"use client";

import { useEffect, useRef, useState } from "react";

import { Ascii } from "~/app/_components/ascii";
import { ArrowRight, ArrowUpRight, Plus } from "~/app/_components/icons";
import { safeHref } from "~/lib/safe-url";
import { pumpkinsForSeconds } from "~/lib/program";
import { formatDuration, toHours } from "~/lib/time";
import { api, type RouterOutputs } from "~/trpc/react";
import { type Draft } from "./ideas";
import { ScreenshotField } from "./screenshot";
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

export function GameBoard({
  startAdding = false,
  draft = null,
}: {
  startAdding?: boolean;
  /** An idea picked from the side panel: opens the form with it filled in. */
  draft?: Draft | null;
}) {
  const [games] = api.game.mine.useSuspenseQuery();
  const [adding, setAdding] = useState(startAdding || games.length === 0);
  const shipped = games.filter((g) => g.status === "SHIPPED").length;
  const board = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!draft) return;
    setAdding(true);
    requestAnimationFrame(() => {
      board.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      board.current?.querySelector<HTMLInputElement>("#f-title")?.focus({ preventScroll: true });
    });
  }, [draft]);

  return (
    <section className="board" aria-labelledby="board-title" ref={board}>
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
        <NewGame
          // A new idea remounts the form so its fields pick up the new defaults.
          key={draft?.n ?? 0}
          draft={draft}
          onDone={() => setAdding(false)}
          canCancel={games.length > 0}
        />
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
      <p>You don&rsquo;t have any projects yet... make one- it doesn&rsquo;t matter how rough it is!</p>
    </div>
  );
}

function NewGame({
  onDone,
  canCancel,
  draft,
}: {
  onDone: () => void;
  canCancel: boolean;
  draft: Draft | null;
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
        defaultValue={draft?.title}
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
        defaultValue={draft?.pitch}
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
        {!shipped && game.reviewStatus === "REJECTED" && (
          <p className="game-review-note" role="note">
            <strong>Sent back.</strong> {game.reviewNote ?? "Check it over and ship it again."}
          </p>
        )}
        {!shipping && (
          <ScreenshotField
            gameId={game.id}
            current={game.screenshot}
            compact={!game.screenshot}
            readOnly={shipped}
          />
        )}
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
            {game.reviewStatus === "APPROVED"
              ? `Approved · +${game.awardedPumpkins ?? 0} Pumpkins`
              : "Shipped · in review"}
          </p>
          <button
            type="button"
            className="link"
            aria-expanded={showDetails}
            aria-controls={`ship-details-${game.id}`}
            onClick={() => setShowDetails((v) => !v)}
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
          <ShipDetails game={game} />
          <p className="pf-muted">
            Shipped projects can&rsquo;t be edited. Something wrong? Email support.
          </p>
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
              <p className="field-label">Screenshot</p>
              <ScreenshotField gameId={game.id} current={game.screenshot} required />
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
              {ship.error && !shipErr && (
                <p className="form-error" role="alert">
                  {ship.error.message}
                </p>
              )}
              <div className="form-actions">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={ship.isPending || !game.screenshot}
                  title={game.screenshot ? undefined : "Add a screenshot first"}
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
