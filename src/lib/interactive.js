import readline from "node:readline";
import { TARGETS } from "./constants.js";
import { getIntegrationsForTarget } from "./catalog.js";
import { usageError } from "./errors.js";

const RESET = "\u001b[0m";
const INVERT = "\u001b[7m";

export async function runInteractiveWizard(catalog, io) {
  const promptIo = resolvePromptIo(io);
  const selectedTargets = await targetCheckboxPrompt(promptIo);

  const scope = await selectPrompt({
    message: "Step 2 Select an install scope",
    items: [
      { label: "user", value: "user" },
      { label: "project", value: "project" }
    ],
    io: promptIo
  });

  const requests = [];
  const summarySelections = [];

  for (const [index, target] of selectedTargets.entries()) {
    const choices = buildInteractiveIntegrationChoices(catalog, target);
    const selectedIntegrationIds = await checkboxPrompt({
      message: `Step ${index + 3} Select integrations for ${target}`,
      records: choices.records,
      initialValues: choices.initialValues,
      groups: choices.groups,
      tags: choices.tags,
      io: promptIo
    });

    requests.push({ target, selectedIntegrationIds });
    summarySelections.push({
      target,
      label: formatInlineList(
        choices.records
          .filter((record) => selectedIntegrationIds.includes(record.id))
          .map((record) => record.title)
      )
    });
  }

  const summaryLines = [`scope: ${scope}`];
  for (const selection of summarySelections) {
    summaryLines.push(`${selection.target}: ${selection.label}`);
  }

  const confirmed = await confirmPrompt(
    {
      message: `Step ${selectedTargets.length + 3} Confirm installation\n${summaryLines
        .map((line) => `  ${line}`)
        .join("\n")}`
    },
    promptIo
  );

  if (!confirmed) {
    return null;
  }

  return { scope, requests };
}

function buildInteractiveIntegrationChoices(catalog, target) {
  const records = getIntegrationsForTarget(catalog, target).map((integration) => ({
    target,
    value: integration.id,
    id: integration.id,
    title: integration.title ?? integration.id,
    description: integration.description ?? "",
    enabledByDefault: integration.enabledByDefault,
    tags: [...(integration.tags ?? [])],
    groups: [...(integration.groups ?? [])],
    hidden: Boolean(integration.hidden),
    deprecated: Boolean(integration.deprecated),
    searchText: [
      target,
      integration.id,
      integration.title,
      integration.description,
      ...(integration.tags ?? []),
      ...(integration.groups ?? [])
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
  }));

  return {
    records,
    initialValues: records
      .filter((record) => record.enabledByDefault && !record.hidden && !record.deprecated)
      .map((record) => record.id),
    groups: getDistinctMetadata(records, "groups"),
    tags: getDistinctMetadata(records, "tags")
  };
}

async function selectPrompt({ message, items, io, initialIndex = 0 }) {
  return runKeypressPrompt({
    initialState: { cursor: initialIndex },
    io,
    render(state) {
      return [
        message,
        "Use Up/Down to move, Space or Enter to confirm.",
        ...items.map((item, index) => {
          const active = index === state.cursor;
          const prefix = active ? `${INVERT}>${RESET}` : " ";
          const marker = active ? "[o]" : "[ ]";
          const label = active ? `${INVERT}${item.label}${RESET}` : item.label;
          return `${prefix} ${marker} ${label}`;
        })
      ];
    },
    onKeypress(state, key) {
      if (key.name === "up") {
        state.cursor = (state.cursor - 1 + items.length) % items.length;
        return undefined;
      }

      if (key.name === "down") {
        state.cursor = (state.cursor + 1) % items.length;
        return undefined;
      }

      if (key.name === "return" || key.name === "space") {
        return items[state.cursor].value;
      }

      return undefined;
    }
  });
}

async function targetCheckboxPrompt(io) {
  const selectedTargets = new Set(["codex"]);
  const items = TARGETS.concat("all");

  return runKeypressPrompt({
    initialState: { cursor: 0, hint: "" },
    io,
    render(state) {
      return [
        "Step 1 Select target agents",
        "Use Up/Down to move, Space to toggle, Enter to confirm.",
        ...items.map((item, index) => {
          const active = index === state.cursor;
          const selected =
            item === "all"
              ? selectedTargets.size === TARGETS.length
              : selectedTargets.has(item);
          const prefix = active ? `${INVERT}>${RESET}` : " ";
          const marker = selected ? "[o]" : "[ ]";
          const label = active ? `${INVERT}${item}${RESET}` : item;
          return `${prefix} ${marker} ${label}`;
        }),
        ...(state.hint ? [state.hint] : [])
      ];
    },
    onKeypress(state, key) {
      if (key.name === "up") {
        state.cursor = (state.cursor - 1 + items.length) % items.length;
        state.hint = "";
        return undefined;
      }

      if (key.name === "down") {
        state.cursor = (state.cursor + 1) % items.length;
        state.hint = "";
        return undefined;
      }

      if (key.name === "space") {
        const current = items[state.cursor];
        if (current === "all") {
          if (selectedTargets.size === TARGETS.length) {
            selectedTargets.clear();
          } else {
            for (const target of TARGETS) {
              selectedTargets.add(target);
            }
          }
        } else if (selectedTargets.has(current)) {
          selectedTargets.delete(current);
        } else {
          selectedTargets.add(current);
        }
        state.hint = "";
        return undefined;
      }

      if (key.name === "return") {
        if (selectedTargets.size === 0) {
          state.hint = "Select at least one target before continuing.";
          return undefined;
        }
        return TARGETS.filter((target) => selectedTargets.has(target));
      }

      return undefined;
    }
  });
}

async function checkboxPrompt({ message, records, initialValues, groups, tags, io }) {
  const selected = new Set(initialValues);

  return runKeypressPrompt({
    initialState: {
      cursor: 0,
      hint: "",
      searchQuery: "",
      searchBuffer: "",
      searchMode: false,
      groupFilter: null,
      tagFilter: null,
      includeHidden: false,
      includeDeprecated: false
    },
    io,
    render(state) {
      const visibleRecords = getVisibleRecords(records, state);
      const lines = [
        `${message} (Space to toggle, Enter to confirm)`,
        "Use Up/Down to move, Space to toggle, Enter to confirm.",
        "/: search  g: group  t: tag  h: hidden  d: deprecated  a: select visible  x: clear visible  r: reset filters",
        `filters: search="${state.searchQuery || "all"}" group=${state.groupFilter ?? "all"} tag=${state.tagFilter ?? "all"} hidden=${state.includeHidden ? "on" : "off"} deprecated=${state.includeDeprecated ? "on" : "off"} visible=${visibleRecords.length} selected=${selected.size}`,
        ""
      ];

      if (state.searchMode) {
        lines.push(`search: ${state.searchBuffer}`);
        lines.push("Type to filter, Enter to apply, Esc to cancel.");
        lines.push("");
      }

      if (visibleRecords.length === 0) {
        lines.push("No integrations match the current search or filter settings.");
      } else {
        for (const [index, record] of visibleRecords.entries()) {
          const active = index === state.cursor;
          const checked = selected.has(record.value);
          const marker = checked ? "[o]" : "[ ]";
          const prefix = active ? `${INVERT}>${RESET}` : " ";
          const label = active ? `${INVERT}${formatRecordLabel(record)}${RESET}` : formatRecordLabel(record);
          lines.push(`${prefix} ${marker} ${label}`);
        }
      }

      if (state.hint) {
        lines.push("");
        lines.push(state.hint);
      }

      return lines;
    },
    onKeypress(state, key) {
      if (state.searchMode) {
        return handleSearchModeKeypress({ state, key, records });
      }

      const visibleRecords = getVisibleRecords(records, state);

      if (key.name === "up") {
        state.cursor = moveCursor(state.cursor, visibleRecords.length, -1);
        state.hint = "";
        return undefined;
      }

      if (key.name === "down") {
        state.cursor = moveCursor(state.cursor, visibleRecords.length, 1);
        state.hint = "";
        return undefined;
      }

      if (key.sequence === "/") {
        state.searchMode = true;
        state.searchBuffer = state.searchQuery;
        return undefined;
      }

      if (key.name === "space") {
        const current = visibleRecords[state.cursor];
        if (current) {
          if (selected.has(current.value)) {
            selected.delete(current.value);
          } else {
            selected.add(current.value);
          }
        }
        state.hint = "";
        return undefined;
      }

      if (key.name === "g") {
        state.groupFilter = cycleFilterValue(groups, state.groupFilter);
        clampCursor(state, records);
        return undefined;
      }

      if (key.name === "t") {
        state.tagFilter = cycleFilterValue(tags, state.tagFilter);
        clampCursor(state, records);
        return undefined;
      }

      if (key.name === "h") {
        state.includeHidden = !state.includeHidden;
        clampCursor(state, records);
        return undefined;
      }

      if (key.name === "d") {
        state.includeDeprecated = !state.includeDeprecated;
        clampCursor(state, records);
        return undefined;
      }

      if (key.name === "a") {
        for (const record of visibleRecords) {
          selected.add(record.value);
        }
        return undefined;
      }

      if (key.name === "x") {
        for (const record of visibleRecords) {
          selected.delete(record.value);
        }
        return undefined;
      }

      if (key.name === "r") {
        state.searchQuery = "";
        state.searchBuffer = "";
        state.groupFilter = null;
        state.tagFilter = null;
        state.includeHidden = false;
        state.includeDeprecated = false;
        clampCursor(state, records);
        return undefined;
      }

      if (key.name === "return") {
        if (selected.size === 0) {
          state.hint = "Select at least one integration before continuing.";
          return undefined;
        }

        return records.filter((record) => selected.has(record.value)).map((record) => record.value);
      }

      return undefined;
    }
  });
}

async function confirmPrompt({ message }, io) {
  return selectPrompt({
    message,
    items: [
      { label: "yes", value: true },
      { label: "no", value: false }
    ],
    io
  });
}

async function runKeypressPrompt({ initialState, render, onKeypress, io }) {
  const { stdin, stdout } = resolvePromptIo(io);
  readline.emitKeypressEvents(stdin);
  const previousRawMode = stdin.isRaw;
  stdin.setRawMode(true);
  stdin.resume();
  stdin.setEncoding("utf8");
  const state = structuredClone(initialState);

  const repaint = () => {
    stdout.write("\u001b[2J\u001b[H");
    stdout.write(`${render(state).join("\n")}\n`);
  };

  return new Promise((resolve, reject) => {
    const cleanup = () => {
      stdin.removeListener("keypress", onPress);
      stdin.pause();
      stdin.setRawMode(Boolean(previousRawMode));
      stdout.write("\u001b[2J\u001b[H");
    };

    const onPress = (_value, key) => {
      if (key.sequence === "\u0003") {
        cleanup();
        reject(usageError("Interactive prompt cancelled by user."));
        return;
      }

      const result = onKeypress(state, key);
      repaint();

      if (result !== undefined) {
        cleanup();
        resolve(result);
      }
    };

    stdin.on("keypress", onPress);
    repaint();
  });
}

function resolvePromptIo(io) {
  return {
    stdin: io?.stdin ?? process.stdin,
    stdout: io?.stdout ?? process.stdout
  };
}

function getDistinctMetadata(records, field) {
  const values = new Set();
  for (const record of records) {
    for (const value of record[field]) {
      values.add(value);
    }
  }
  return [...values].sort((left, right) => left.localeCompare(right));
}

function getVisibleRecords(records, state) {
  const query = state.searchQuery.trim().toLowerCase();

  return records.filter((record) => {
    if (!state.includeHidden && record.hidden) {
      return false;
    }

    if (!state.includeDeprecated && record.deprecated) {
      return false;
    }

    if (state.groupFilter && !record.groups.includes(state.groupFilter)) {
      return false;
    }

    if (state.tagFilter && !record.tags.includes(state.tagFilter)) {
      return false;
    }

    if (query && !record.searchText.includes(query)) {
      return false;
    }

    return true;
  });
}

function formatRecordLabel(record) {
  const parts = [record.title];
  if (record.description) {
    parts.push(record.description);
  }
  if (record.hidden) {
    parts.push("hidden");
  }
  if (record.deprecated) {
    parts.push("deprecated");
  }
  return parts.join(" | ");
}

function moveCursor(currentIndex, total, direction) {
  if (total <= 0) {
    return 0;
  }
  return (currentIndex + direction + total) % total;
}

function cycleFilterValue(values, currentValue) {
  if (values.length === 0) {
    return null;
  }

  if (currentValue == null) {
    return values[0];
  }

  const index = values.indexOf(currentValue);
  if (index === -1 || index === values.length - 1) {
    return null;
  }

  return values[index + 1];
}

function clampCursor(state, records) {
  const visibleRecords = getVisibleRecords(records, state);
  if (visibleRecords.length === 0) {
    state.cursor = 0;
    return;
  }

  if (state.cursor >= visibleRecords.length) {
    state.cursor = visibleRecords.length - 1;
  }
}

function handleSearchModeKeypress({ state, key, records }) {
  if (key.name === "escape") {
    state.searchMode = false;
    state.searchBuffer = state.searchQuery;
    return undefined;
  }

  if (key.name === "return") {
    state.searchQuery = state.searchBuffer.trim();
    state.searchMode = false;
    clampCursor(state, records);
    return undefined;
  }

  if (key.name === "backspace") {
    state.searchBuffer = state.searchBuffer.slice(0, -1);
    return undefined;
  }

  if (typeof key.sequence === "string" && key.sequence.length === 1 && !key.ctrl && !key.meta) {
    state.searchBuffer += key.sequence;
  }

  return undefined;
}

function formatInlineList(values) {
  return values.length === 0 ? "none" : values.join(", ");
}
