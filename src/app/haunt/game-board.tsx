"use client";

import { useState } from "react";

import { Ascii } from "~/app/_components/ascii";
import { ArrowRight, ArrowUpRight, Plus } from "~/app/_components/icons";
import { api, type RouterOutputs } from "~/trpc/react";

type Game = RouterOutputs["game"]["mine"][number];

const text = (f: FormData, key: string) => {
  const v = f.get(key);
  return typeof v === "string" ? v : "";
};

function fieldErrors(error: unknown) {
  const e = error as { data?: { zodError?: { fieldErrors?: Record<string, string[]> } } };
  return e?.data?.zodError?.fieldErrors ?? {};
}

export function GameBoard() {
  const [games] = api.game.mine.useSuspenseQuery();
  const [adding, setAdding] = useState(games.length === 0);

  return (
    <section className="board" aria-labelledby="board-title">
      <div className="board-head">
        <h2 id="board-title" className="board-title">
          Your games <span className="board-count">{games.length}</span>
        </h2>
        {!adding && (
          <button type="button" className="btn btn-ghost" onClick={() => setAdding(true)}>
            <Plus className="btn-icon" />
            <span>Register a game</span>
          </button>
        )}
      </div>

      {adding && <NewGame onDone={() => setAdding(false)} canCancel={games.length > 0} />}

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

      <p className="board-note">
        Marking a game shipped is self-reported for now. How games get
        reviewed is still being decided.
      </p>
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

function NewGame({ onDone, canCancel }: { onDone: () => void; canCancel: boolean }) {
  const utils = api.useUtils();
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
          playUrl: text(f, "playUrl"),
        });
      }}
      noValidate
    >
      <h3 className="panel-title">Register a game</h3>

      <Field label="Name" name="title" placeholder="The Thing in the Vents" error={errs.title} required maxLength={80} />
      <Field
        label="One-line pitch"
        name="pitch"
        placeholder="You're alone on a night shift and the cameras keep moving."
        error={errs.pitch}
        required
        maxLength={280}
        multiline
      />
      <div className="form-row">
        <Field label="Engine" name="engine" placeholder="Godot" hint="Optional" maxLength={40} />
        <Field
          label="Source code"
          name="sourceUrl"
          placeholder="https://github.com/…"
          hint="Optional"
          type="url"
          error={errs.sourceUrl}
        />
      </div>
      <Field
        label="Play link"
        name="playUrl"
        placeholder="https://you.itch.io/…"
        hint="Optional until you ship"
        type="url"
        error={errs.playUrl}
      />

      {create.error && !Object.keys(errs).length && (
        <p className="form-error" role="alert">
          That didn&rsquo;t save: {create.error.message}. Try again in a moment.
        </p>
      )}

      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={create.isPending}>
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
  hint,
  error,
  multiline,
  ...rest
}: {
  label: string;
  name: string;
  hint?: string;
  error?: string[];
  multiline?: boolean;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  const id = `f-${name}`;
  const describedBy = error?.length ? `${id}-err` : undefined;
  return (
    <div className="field">
      <label htmlFor={id} className="field-label">
        {label}
        {hint && <span className="field-hint">{hint}</span>}
      </label>
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
          <p className="game-status">
            <span className="status-dot" aria-hidden="true" />
            {shipped ? "Shipped" : "Brewing"}
          </p>
        </div>
        <p className="game-pitch">{game.pitch}</p>
        <p className="game-links">
          {game.engine && <span className="game-engine">{game.engine}</span>}
          {game.playUrl && (
            <a href={game.playUrl} className="link" target="_blank" rel="noreferrer">
              Play <ArrowUpRight className="link-icon" />
            </a>
          )}
          {game.sourceUrl && (
            <a href={game.sourceUrl} className="link" target="_blank" rel="noreferrer">
              Source <ArrowUpRight className="link-icon" />
            </a>
          )}
        </p>
      </div>

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
                <button type="submit" className="btn btn-primary" disabled={ship.isPending}>
                  <span>{ship.isPending ? "Shipping…" : "Ship it"}</span>
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => setShipping(false)}>
                  Not yet
                </button>
              </div>
            </form>
          ) : (
            <>
              <button type="button" className="btn btn-primary" onClick={() => setShipping(true)}>
                <span>Mark as shipped</span>
              </button>
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
                  <button type="button" className="link" onClick={() => setConfirmRemove(false)}>
                    Keep it
                  </button>
                </span>
              ) : (
                <button type="button" className="link link-quiet" onClick={() => setConfirmRemove(true)}>
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
