#!/usr/bin/env python3
"""Validate mise configuration files with a small, self-contained rule set."""

from __future__ import annotations

import argparse
import fnmatch
import json
import re
import tomllib
from dataclasses import asdict, dataclass
from pathlib import Path

# Works from both layouts: <plugin>/scripts/ and <skill>/scripts/.
BUNDLE_ROOT = Path(__file__).resolve().parents[1]
REFERENCES = BUNDLE_ROOT / "references"

# Rule families:
# - PARSE*: TOML parsing failures
# - MWC*: generic tools/backend/config rules
# - MWE*: env and local override rules
# - MWT*: task rules
# - MWV*: version policy rules
# - MWL*: lockfile rules
# - MWJ*: Java selector/vendor policy rules
# - MWP*: profile inference rules

CONFIG_CANDIDATES = (
    ".config/mise/config.toml",
    ".config/mise.toml",
    "mise/config.toml",
    ".mise/config.toml",
    ".mise.toml",
)
CONF_D_DIRS = (".config/mise/conf.d", "mise/conf.d", ".mise/conf.d")
LOCAL_FILE_GLOBS = ("mise.local.toml", "mise.*.local.toml", "mise.local.lock", "mise.*.local.lock")
PRERELEASE_PATTERN = re.compile(r"(?:^|[-.])(alpha|beta|rc|pre|dev|snapshot)\d*(?:$|[-.+])", re.IGNORECASE)
NPM_RANGE_PATTERN = re.compile(r"^\s*(?:\^|~(?!/)|[<>]=?|=)|\s\|\|\s|\s-\s")
TERA_ARG_HELPER_PATTERN = re.compile(r"\{\{[^}]*?\b(arg|option|flag)\s*\(")
USAGE_ABOUT_PATTERN = re.compile(r"^\s*about\s+\S", re.MULTILINE)
JAVA_SHORTHAND_PATTERN = re.compile(r"(?:\d+(?:\.\d+)*|lts)")
SEVERITY_ORDER = {"error": 0, "policy-error": 1, "warning": 2, "info": 3}


def ref(path: str) -> str:
    return str(REFERENCES / path)


@dataclass
class Location:
    path: str
    line: int | None = None
    column: int | None = None
    key_path: str | None = None


@dataclass
class Diagnostic:
    rule_id: str
    severity: str
    source_type: str
    owner_skill: str
    message: str
    why: str
    fix_hint: str
    autofix_available: bool
    locations: list[Location]
    docs: list[str]
    evidence: dict[str, object]


@dataclass
class ParsedConfig:
    path: Path
    data: dict[str, object]


RULE_META = {
    "MWC001": {
        "severity": "warning",
        "source_type": "official",
        "owner_skill": "mise-tools",
        "message": "Deprecated `ubi:` backend usage detected.",
        "why": "The `ubi:` backend is deprecated, mise warns when it is used, and mise 2027.1.0 removes it.",
        "fix_hint": "Migrate to `github:` (or `gitlab:` / `http:` for other hosts), or use the registry short name.",
        "docs": ["https://mise.jdx.dev/dev-tools/backends/ubi.html", ref("tools-core.md")],
    },
    "MWC002": {
        "severity": "warning",
        "source_type": "official",
        "owner_skill": "mise-tools",
        "message": "Legacy `asdf:` backend usage detected.",
        "why": "asdf plugins are legacy shell-script plugins, unavailable on Windows, and record only the version in mise.lock.",
        "fix_hint": "Prefer the registry short name, `aqua:`, or `github:` before falling back to `asdf:`.",
        "docs": ["https://mise.jdx.dev/dev-tools/backends/", ref("tools-core.md")],
    },
    "MWC003": {
        "severity": "warning",
        "source_type": "official",
        "owner_skill": "mise-tools",
        "message": "Deprecated top-level config key detected.",
        "why": "`[alias]` was replaced by `[tool_alias]`, and `experimental_monorepo_root` by `monorepo_root` (removed in 2027.12.0).",
        "fix_hint": "Rename the key to its replacement shown in the evidence.",
        "docs": ["https://mise.jdx.dev/configuration.html#top-level-keys"],
    },
    "MWE001": {
        "severity": "error",
        "source_type": "official",
        "owner_skill": "mise-env",
        "message": "Deprecated top-level env setting detected.",
        "why": "Top-level `env_file`, `dotenv`, and `env_path` are deprecated and removed in mise 2027.4.0.",
        "fix_hint": "Move `env_file`/`dotenv` to `env._.file` and `env_path` to `env._.path`.",
        "docs": ["https://mise.jdx.dev/environments/#deprecated-syntax", ref("env-core.md")],
    },
    "MWE002": {
        "severity": "warning",
        "source_type": "official",
        "owner_skill": "mise-env",
        "message": "Local mise config or lockfile is not ignored by .gitignore.",
        "why": "Local config can leak secrets and machine-specific paths, and local lockfiles describe one machine only.",
        "fix_hint": "Add `mise.local.toml`, `mise.*.local.toml`, `mise.local.lock`, and `mise.*.local.lock` to `.gitignore`.",
        "docs": ["https://mise.jdx.dev/dev-tools/mise-lock.html#local-lockfiles", ref("env-core.md")],
    },
    "MWE003": {
        "severity": "warning",
        "source_type": "official",
        "owner_skill": "mise-env",
        "message": "Deprecated `env.mise.*` directive detected.",
        "why": "`env.mise.*` was replaced by `env._.*` and is removed in mise 2026.12.0.",
        "fix_hint": "Rename `[env.mise]` entries to `env._.*` directives such as `_.file` or `_.path`.",
        "docs": ["https://mise.jdx.dev/environments/#deprecated-syntax"],
    },
    "MWE004": {
        "severity": "error",
        "source_type": "official",
        "owner_skill": "mise-env",
        "message": "`redactions` is declared inside `[env]`.",
        "why": "`redactions` is a top-level key. Inside `[env]` it is treated as an environment variable and redacts nothing.",
        "fix_hint": "Move `redactions = [...]` above the first table so it is a top-level key.",
        "docs": ["https://mise.jdx.dev/environments/secrets/#redaction", ref("secrets.md")],
    },
    "MWE005": {
        "severity": "warning",
        "source_type": "official",
        "owner_skill": "mise-env",
        "message": "`python.uv_venv_auto = true` is deprecated.",
        "why": "The boolean form warns since mise 2026.7.0 and is removed in 2027.7.0.",
        "fix_hint": "Use `python.uv_venv_auto = \"create|source\"` or `\"source\"`, and set `UV_PYTHON` with `tools = true` if uv must use mise's interpreter.",
        "docs": ["https://mise.jdx.dev/lang/python.html#uv-projects", ref("ecosystems/python-uv.md")],
    },
    "MWE006": {
        "severity": "warning",
        "source_type": "official",
        "owner_skill": "mise-env",
        "message": "Both `_.python.venv` and `python.uv_venv_auto` manage the virtualenv.",
        "why": "mise documents these as alternatives: `_.python.venv` for non-uv projects, `python.uv_venv_auto` for uv projects.",
        "fix_hint": "Keep `python.uv_venv_auto` for uv projects with a `uv.lock`, otherwise keep `_.python.venv`.",
        "docs": ["https://mise.jdx.dev/lang/python.html#automatic-virtualenv-activation", ref("env-patterns.md")],
    },
    "MWE007": {
        "severity": "warning",
        "source_type": "official",
        "owner_skill": "mise-env",
        "message": "Deprecated Python `virtualenv` tool option detected.",
        "why": "The `virtualenv` tool option warns since mise 2026.7.0 and is removed in 2027.7.0.",
        "fix_hint": "Replace it with `[env] _.python.venv = { path = \".venv\", create = true }`.",
        "docs": ["https://mise.jdx.dev/lang/python.html#deprecated-forms"],
    },
    "MWT001": {
        "severity": "warning",
        "source_type": "official",
        "owner_skill": "mise-tasks",
        "message": "Task uses deprecated Tera argument helpers.",
        "why": "`arg()`, `option()`, and `flag()` in run scripts are deprecated and removed in mise 2027.5.0.",
        "fix_hint": "Define arguments in the task's `usage` spec and read them as `usage_*` variables or `{{ usage.name }}`.",
        "docs": ["https://mise.jdx.dev/tasks/task-arguments.html", ref("task-arguments.md")],
    },
    "MWT002": {
        "severity": "policy-error",
        "source_type": "policy",
        "owner_skill": "mise-tasks",
        "message": "Task does not define `description`, `usage` with `about`, and `run`.",
        "why": "Team policy requires every task to state its purpose (`description`), its `mise run` help text (`usage` with `about`), and its command (`run`, or `file` for script tasks).",
        "fix_hint": "Add the missing fields listed in the evidence, for example `usage = '''\\nabout \"mise run <task>: <what it does>\"\\n'''`.",
        "docs": [ref("tasks-core.md"), ref("task-arguments.md")],
    },
    "MWV002": {
        "severity": "policy-error",
        "source_type": "policy",
        "owner_skill": "mise-policy",
        "message": "Tracked config stores `latest` directly.",
        "why": "Direct `latest` usage reduces reproducibility and bypasses the intended request-plus-lock workflow.",
        "fix_hint": "Store a stable prefix such as `24` in `mise.toml` and rely on `mise.lock` for the exact version.",
        "docs": ["https://mise.jdx.dev/dev-tools/versions.html", ref("version-policy.md")],
    },
    "MWV003": {
        "severity": "warning",
        "source_type": "policy",
        "owner_skill": "mise-policy",
        "message": "Version request looks like a prerelease.",
        "why": "Shared policy bans prereleases unless the repository documents an explicit exception.",
        "fix_hint": "Use the newest stable release, or document why this prerelease is required.",
        "docs": [ref("version-policy.md")],
    },
    "MWV004": {
        "severity": "error",
        "source_type": "official",
        "owner_skill": "mise-tools",
        "message": "npm-style version range is not a valid mise request.",
        "why": "mise does not accept ranges such as `^24` or `>=20`; it warns and treats the value as a literal version, which fails to install.",
        "fix_hint": "Use a prefix such as `24`, or `prefix:1.20` when the tool publishes a release named like the prefix.",
        "docs": ["https://mise.jdx.dev/dev-tools/versions.html#request-syntax", ref("tools-core.md")],
    },
    "MWV005": {
        "severity": "warning",
        "source_type": "official",
        "owner_skill": "mise-policy",
        "message": "Deprecated `install_before` setting detected.",
        "why": "`install_before` was replaced by `minimum_release_age`, which also supports per-tool overrides and exclusions.",
        "fix_hint": "Replace it with `minimum_release_age` (a duration such as `7d` or a cutoff date).",
        "docs": ["https://mise.jdx.dev/security.html#minimum-release-age", ref("version-policy.md")],
    },
    "MWL001": {
        "severity": "info",
        "source_type": "policy",
        "owner_skill": "mise-lock",
        "message": "Tools are declared but no `mise.lock` was found.",
        "why": "Without a lockfile, prefix requests can resolve to different builds on each machine and CI cannot install with `--locked`.",
        "fix_hint": "Run `mise lock` (or set `[settings] lockfile = true`) and commit `mise.lock`.",
        "docs": ["https://mise.jdx.dev/dev-tools/mise-lock.html", ref("lockfile.md")],
    },
    "MWL002": {
        "severity": "error",
        "source_type": "official",
        "owner_skill": "mise-lock",
        "message": "`lockfile = false` is combined with `locked = true`.",
        "why": "Locked mode reads the lockfile, so mise reports an error when lockfiles are turned off.",
        "fix_hint": "Remove `lockfile = false`, or drop `locked = true` if the project intentionally has no lockfile.",
        "docs": ["https://mise.jdx.dev/dev-tools/mise-lock.html#strict-lockfile-mode", ref("lockfile.md")],
    },
    "MWJ001": {
        "severity": "policy-error",
        "source_type": "policy",
        "owner_skill": "mise-tools",
        "message": "Java selector is missing an explicit vendor.",
        "why": "A Java request without a vendor follows `java.shorthand_vendor`, whose default changed from `openjdk` to `temurin` in mise 2026.10.5, so the same request can resolve to a different build.",
        "fix_hint": "Use a vendor-qualified request such as `zulu-25` or `zulu-21`.",
        "docs": ["https://mise.jdx.dev/lang/java.html", ref("ecosystems/java-runtime.md")],
    },
    "MWP001": {
        "severity": "error",
        "source_type": "policy",
        "owner_skill": "mise-profiles",
        "message": "Inferred `python-uv-app` profile is missing required tools.",
        "why": "The repository looks like a python-uv profile (`pyproject.toml` with `uv.lock`), so `[tools]` should declare both `python` and `uv`.",
        "fix_hint": "Add both `python` and `uv` to `[tools]`, then align requests with the shared version policy.",
        "docs": [ref("profile-catalog.md"), ref("examples/python-uv-app.md")],
    },
    "MWP002": {
        "severity": "error",
        "source_type": "policy",
        "owner_skill": "mise-profiles",
        "message": "Inferred `java-gradle-app` profile is missing required tools.",
        "why": "The repository looks like a java-gradle-app profile, so `[tools]` should declare both `java` and `gradle`.",
        "fix_hint": "Add both `java` and `gradle` to `[tools]`, then apply the Java and Gradle ecosystem references.",
        "docs": [ref("profile-catalog.md"), ref("examples/java-gradle-app.md")],
    },
    "MWP003": {
        "severity": "error",
        "source_type": "policy",
        "owner_skill": "mise-profiles",
        "message": "Inferred `java-spring-service` profile is missing required tools.",
        "why": "The repository looks like a java-spring-service profile, so `[tools]` should declare both `java` and `gradle`.",
        "fix_hint": "Add both `java` and `gradle` to `[tools]`, then keep Spring-specific env and task rules separate.",
        "docs": [ref("profile-catalog.md"), ref("examples/java-spring-service.md")],
    },
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Validate mise configuration files.")
    parser.add_argument("target", nargs="?", default=".", help="Directory or mise TOML file to inspect")
    parser.add_argument("--format", choices=("text", "json"), default="text", help="Output format")
    return parser.parse_args()


def discover_target_files(target: Path) -> tuple[list[Path], Path]:
    if target.is_file():
        return [target], target.parent

    candidates = sorted(target.glob("mise*.toml"))
    candidates.extend(sorted(target.glob(".mise.*.toml")))
    for relative in CONFIG_CANDIDATES:
        path = target / relative
        if path.is_file():
            candidates.append(path)
    for relative in CONF_D_DIRS:
        conf_d = target / relative
        if conf_d.is_dir():
            candidates.extend(sorted(p for p in conf_d.glob("*.toml") if not p.name.startswith(".")))

    unique: list[Path] = []
    for candidate in candidates:
        if candidate.is_file() and candidate not in unique:
            unique.append(candidate)
    return unique, target


def line_for_pattern(path: Path, pattern: str, section: str | None = None) -> tuple[int | None, int | None]:
    lines = path.read_text(encoding="utf-8").splitlines()
    start = 0
    if section:
        header = re.compile(rf"^\s*\[{re.escape(section)}[\].]")
        start = next((idx for idx, line in enumerate(lines) if header.match(line)), 0)
    for idx in range(start, len(lines)):
        match = re.search(pattern, lines[idx])
        if match:
            return idx + 1, match.start() + 1
    return None, None


def locate(path: Path, pattern: str, key_path: str, section: str | None = None) -> Location:
    line, col = line_for_pattern(path, pattern, section)
    return Location(path=str(path), line=line, column=col, key_path=key_path)


def make_diag(rule_id: str, location: Location, evidence: dict[str, object]) -> Diagnostic:
    meta = RULE_META[rule_id]
    return Diagnostic(
        rule_id=rule_id,
        severity=meta["severity"],
        source_type=meta["source_type"],
        owner_skill=meta["owner_skill"],
        message=meta["message"],
        why=meta["why"],
        fix_hint=meta["fix_hint"],
        autofix_available=False,
        locations=[location],
        docs=meta["docs"],
        evidence=evidence,
    )


def is_local_config(path: Path) -> bool:
    return path.name.endswith(".local.toml")


def tool_request(raw_value: object) -> list[str]:
    if isinstance(raw_value, str):
        return [raw_value]
    if isinstance(raw_value, list):
        return [item for item in raw_value if isinstance(item, str)]
    if isinstance(raw_value, dict):
        for key in ("version", "prefix", "ref", "path"):
            candidate = raw_value.get(key)
            if isinstance(candidate, str):
                return [candidate]
    return []


def validate_top_level(config_path: Path, data: dict[str, object]) -> list[Diagnostic]:
    diagnostics: list[Diagnostic] = []
    for key in ("env_file", "dotenv", "env_path"):
        if key in data:
            location = locate(config_path, rf"^\s*{re.escape(key)}\s*=", key)
            diagnostics.append(make_diag("MWE001", location, {"deprecated_key": key}))

    replacements = {"alias": "tool_alias", "experimental_monorepo_root": "monorepo_root"}
    for key, replacement in replacements.items():
        if key in data:
            location = locate(config_path, rf"^\s*\[?{re.escape(key)}\b", key)
            diagnostics.append(make_diag("MWC003", location, {"deprecated_key": key, "replacement": replacement}))
    return diagnostics


def validate_env(config_path: Path, data: dict[str, object]) -> list[Diagnostic]:
    diagnostics: list[Diagnostic] = []
    env = data.get("env")
    if not isinstance(env, dict):
        return diagnostics

    if "mise" in env:
        location = locate(config_path, r"^\s*(\[env\.mise\]|mise\s*=|mise\.)", "env.mise")
        diagnostics.append(make_diag("MWE003", location, {"found": "env.mise"}))
    if "redactions" in env:
        location = locate(config_path, r"^\s*redactions\s*=", "env.redactions", "env")
        diagnostics.append(make_diag("MWE004", location, {"found": "env.redactions"}))
    return diagnostics


def has_python_venv_directive(data: dict[str, object]) -> bool:
    env = data.get("env")
    if not isinstance(env, dict):
        return False
    directives = env.get("_")
    if not isinstance(directives, dict):
        return False
    python = directives.get("python")
    return isinstance(python, dict) and "venv" in python


def uv_venv_auto_value(data: dict[str, object]) -> object:
    settings = data.get("settings")
    if not isinstance(settings, dict):
        return None
    python = settings.get("python")
    if isinstance(python, dict) and "uv_venv_auto" in python:
        return python["uv_venv_auto"]
    return settings.get("python.uv_venv_auto")


def validate_settings(config_path: Path, data: dict[str, object]) -> list[Diagnostic]:
    diagnostics: list[Diagnostic] = []
    settings = data.get("settings")
    settings = settings if isinstance(settings, dict) else {}

    uv_auto = uv_venv_auto_value(data)
    if uv_auto is True:
        location = locate(config_path, r"uv_venv_auto\s*=", "settings.python.uv_venv_auto")
        diagnostics.append(make_diag("MWE005", location, {"found": True}))
    if uv_auto not in (None, False) and has_python_venv_directive(data):
        location = locate(config_path, r"_\.python\.venv|python\.venv", "env._.python.venv")
        diagnostics.append(make_diag("MWE006", location, {"uv_venv_auto": uv_auto}))

    if "install_before" in settings:
        location = locate(config_path, r"^\s*install_before\s*=", "settings.install_before")
        diagnostics.append(make_diag("MWV005", location, {"found": settings["install_before"]}))

    if settings.get("lockfile") is False and settings.get("locked") is True:
        location = locate(config_path, r"^\s*locked\s*=", "settings.locked")
        diagnostics.append(make_diag("MWL002", location, {"lockfile": False, "locked": True}))
    return diagnostics


def validate_tools(config_path: Path, data: dict[str, object]) -> list[Diagnostic]:
    diagnostics: list[Diagnostic] = []
    tools = data.get("tools")
    if not isinstance(tools, dict):
        return diagnostics

    for tool_name, raw_value in tools.items():
        location = locate(config_path, rf"^\s*\[?(?:tools\.)?\"?{re.escape(tool_name)}\"?\s*[=\]]", f"tools.{tool_name}", "tools")
        name = str(tool_name)

        if name.startswith("ubi:"):
            diagnostics.append(make_diag("MWC001", location, {"tool": name}))
        if name.startswith("asdf:"):
            diagnostics.append(make_diag("MWC002", location, {"tool": name}))
        if name == "python" and isinstance(raw_value, dict) and "virtualenv" in raw_value:
            diagnostics.append(make_diag("MWE007", location, {"tool": name, "virtualenv": raw_value["virtualenv"]}))

        for request in tool_request(raw_value):
            normalized = request.strip()
            if normalized == "latest":
                diagnostics.append(make_diag("MWV002", location, {"tool": name, "found": normalized}))
                continue
            if normalized.startswith(("path:", "ref:", "tag:", "branch:", "rev:", "sub-")):
                continue
            if NPM_RANGE_PATTERN.search(normalized):
                diagnostics.append(make_diag("MWV004", location, {"tool": name, "found": normalized}))
                continue
            if PRERELEASE_PATTERN.search(normalized):
                diagnostics.append(make_diag("MWV003", location, {"tool": name, "found": normalized}))
            if name in ("java", "core:java") and JAVA_SHORTHAND_PATTERN.fullmatch(normalized):
                diagnostics.append(make_diag("MWJ001", location, {"tool": name, "found": normalized}))

    return diagnostics


def task_scripts(task: object) -> list[str]:
    if isinstance(task, str):
        return [task]
    if isinstance(task, list):
        return [item for item in task if isinstance(item, str)]
    if isinstance(task, dict):
        scripts: list[str] = []
        for key in ("run", "run_windows"):
            value = task.get(key)
            if isinstance(value, str):
                scripts.append(value)
            elif isinstance(value, list):
                scripts.extend(item for item in value if isinstance(item, str))
        return scripts
    return []


def validate_tasks(config_path: Path, data: dict[str, object]) -> list[Diagnostic]:
    diagnostics: list[Diagnostic] = []
    tasks = data.get("tasks")
    if not isinstance(tasks, dict):
        return diagnostics

    for task_name, task in tasks.items():
        escaped = re.escape(task_name)
        location = locate(config_path, rf"^\s*\[?(?:tasks\.)?\"?{escaped}\"?\s*[=\]]", f"tasks.{task_name}", "tasks")

        helpers = sorted(
            {match.group(1) for script in task_scripts(task) for match in TERA_ARG_HELPER_PATTERN.finditer(script)}
        )
        if helpers:
            diagnostics.append(make_diag("MWT001", location, {"task": task_name, "helpers": helpers}))

        missing = missing_task_fields(task)
        if missing:
            diagnostics.append(make_diag("MWT002", location, {"task": task_name, "missing": missing}))
    return diagnostics


def missing_task_fields(task: object) -> list[str]:
    if not isinstance(task, dict):
        return ["description", "usage"]

    missing: list[str] = []
    if not str(task.get("description", "")).strip():
        missing.append("description")

    usage = task.get("usage")
    if not isinstance(usage, str) or not usage.strip():
        missing.append("usage")
    elif not USAGE_ABOUT_PATTERN.search(usage):
        missing.append("usage.about")

    # `run` may hold scripts or task steps such as `[{ task = "start" }]`.
    if not task.get("run") and not task.get("run_windows") and not task.get("file"):
        missing.append("run")
    return missing


def gitignore_patterns(root: Path) -> list[str]:
    gitignore = root / ".gitignore"
    if not gitignore.exists():
        return []
    patterns = []
    for line in gitignore.read_text(encoding="utf-8").splitlines():
        stripped = line.strip()
        if stripped and not stripped.startswith(("#", "!")):
            patterns.append(stripped.lstrip("/").rstrip("/"))
    return patterns


def validate_gitignore(root: Path) -> list[Diagnostic]:
    local_files = sorted({path.name for pattern in LOCAL_FILE_GLOBS for path in root.glob(pattern) if path.is_file()})
    if not local_files:
        return []

    patterns = gitignore_patterns(root)
    unignored = [name for name in local_files if not any(fnmatch.fnmatch(name, pattern) for pattern in patterns)]
    if not unignored:
        return []

    gitignore = root / ".gitignore"
    return [
        make_diag(
            "MWE002",
            Location(path=str(gitignore), key_path=".gitignore"),
            {"unignored_files": unignored},
        )
    ]


def declared_tools(parsed_configs: list[ParsedConfig]) -> set[str]:
    names: set[str] = set()
    for config in parsed_configs:
        tools = config.data.get("tools")
        if isinstance(tools, dict):
            names.update(str(name) for name in tools.keys())
    return names


def validate_lockfile(root: Path, parsed_configs: list[ParsedConfig]) -> list[Diagnostic]:
    shared = [config for config in parsed_configs if not is_local_config(config.path)]
    if not shared or not declared_tools(shared):
        return []
    for config in parsed_configs:
        settings = config.data.get("settings")
        if isinstance(settings, dict) and settings.get("lockfile") is False:
            return []
    if any(root.glob("mise.lock")) or any((root / relative).parent.joinpath("mise.lock").exists() for relative in CONFIG_CANDIDATES):
        return []

    config_path = shared[0].path
    location = locate(config_path, r"^\s*\[tools\]\s*$", "tools")
    return [make_diag("MWL001", location, {"declared_tools": sorted(declared_tools(shared))})]


def has_any_file(root: Path, candidates: list[str]) -> bool:
    return any((root / candidate).exists() for candidate in candidates)


def file_contains(path: Path, patterns: tuple[str, ...]) -> bool:
    if not path.exists() or not path.is_file():
        return False
    try:
        text = path.read_text(encoding="utf-8", errors="ignore")
    except OSError:
        return False
    return any(re.search(pattern, text, re.MULTILINE) for pattern in patterns)


def spring_signals(root: Path) -> list[str]:
    signals: list[str] = []
    if has_any_file(root, ["src/main/resources/application.yml", "src/main/resources/application.yaml"]):
        signals.append("application.yml")
    if has_any_file(root, ["src/main/resources/application.properties"]):
        signals.append("application.properties")

    for build_file in ("build.gradle", "build.gradle.kts"):
        if file_contains(root / build_file, (r"org\.springframework\.boot", r"spring-boot")):
            signals.append(build_file)
            break

    java_main = root / "src/main/java"
    if java_main.exists():
        for path in java_main.rglob("*.java"):
            if file_contains(path, (r"@SpringBootApplication",)):
                signals.append(path.name)
                break

    return list(dict.fromkeys(signals))


def infer_profile_signals(root: Path) -> dict[str, list[str]]:
    profiles: dict[str, list[str]] = {}

    python_signals = [name for name in ("pyproject.toml", "uv.lock") if (root / name).exists()]
    if len(python_signals) == 2:
        profiles["python-uv-app"] = python_signals

    gradle_signals = [name for name in ("build.gradle", "build.gradle.kts", "gradlew") if (root / name).exists()]
    if gradle_signals:
        detected_spring = spring_signals(root)
        if detected_spring:
            profiles["java-spring-service"] = list(dict.fromkeys(gradle_signals + detected_spring))
        else:
            profiles["java-gradle-app"] = gradle_signals

    return profiles


def validate_profiles(root: Path, parsed_configs: list[ParsedConfig]) -> list[Diagnostic]:
    diagnostics: list[Diagnostic] = []
    if parsed_configs:
        location = locate(parsed_configs[0].path, r"^\s*\[tools\]\s*$", "tools")
    else:
        location = Location(path=str(root / "mise.toml"), key_path="tools")
    tools = {name.split(":", 1)[-1] if name.startswith("core:") else name for name in declared_tools(parsed_configs)}
    profile_signals = infer_profile_signals(root)

    profile_rules = {
        "python-uv-app": ("MWP001", {"python", "uv"}),
        "java-gradle-app": ("MWP002", {"java", "gradle"}),
        "java-spring-service": ("MWP003", {"java", "gradle"}),
    }

    for profile_name, (rule_id, required_tools) in profile_rules.items():
        signals = profile_signals.get(profile_name)
        if not signals:
            continue
        missing_tools = sorted(required_tools - tools)
        if missing_tools:
            diagnostics.append(
                make_diag(
                    rule_id,
                    location,
                    {
                        "profile": profile_name,
                        "missing_tools": missing_tools,
                        "declared_tools": sorted(tools),
                        "signals": signals,
                    },
                )
            )
    return diagnostics


def parse_error(config_path: Path, exc: tomllib.TOMLDecodeError) -> Diagnostic:
    return Diagnostic(
        rule_id="PARSE001",
        severity="error",
        source_type="official-inferred",
        owner_skill="mise-review",
        message="Failed to parse TOML file.",
        why="The file cannot be reviewed reliably until TOML syntax errors are fixed.",
        fix_hint="Fix the TOML syntax error (for example, quote task names that contain `:`) and run the validator again.",
        autofix_available=False,
        locations=[Location(path=str(config_path), line=getattr(exc, "lineno", None), column=getattr(exc, "colno", None))],
        docs=[],
        evidence={"error": str(exc)},
    )


def validate_target(target: Path) -> tuple[list[str], list[Diagnostic]]:
    config_files, root = discover_target_files(target)
    diagnostics: list[Diagnostic] = []
    parsed_configs: list[ParsedConfig] = []

    for config_path in config_files:
        try:
            data = tomllib.loads(config_path.read_text(encoding="utf-8"))
        except tomllib.TOMLDecodeError as exc:
            diagnostics.append(parse_error(config_path, exc))
            continue

        parsed_configs.append(ParsedConfig(path=config_path, data=data))
        diagnostics.extend(validate_top_level(config_path, data))
        diagnostics.extend(validate_env(config_path, data))
        diagnostics.extend(validate_settings(config_path, data))
        diagnostics.extend(validate_tools(config_path, data))
        diagnostics.extend(validate_tasks(config_path, data))

    diagnostics.extend(validate_gitignore(root))
    diagnostics.extend(validate_lockfile(root, parsed_configs))
    diagnostics.extend(validate_profiles(root, parsed_configs))
    return [str(path) for path in config_files], diagnostics


def summary_for(diagnostics: list[Diagnostic]) -> dict[str, int]:
    summary = {"error": 0, "warning": 0, "policy_error": 0, "info": 0}
    for diag in diagnostics:
        key = diag.severity.replace("-", "_")
        if key in summary:
            summary[key] += 1
    return summary


def status_for(summary: dict[str, int]) -> str:
    if summary["error"] or summary["policy_error"]:
        return "failed"
    return "success"


def print_text(scanned_files: list[str], diagnostics: list[Diagnostic]) -> None:
    summary = summary_for(diagnostics)
    print(f"mise-review: {status_for(summary)}")
    print("errors: {error}, policy-errors: {policy_error}, warnings: {warning}, info: {info}".format(**summary))
    if scanned_files:
        print(f"scanned: {', '.join(scanned_files)}")
    if not diagnostics:
        print("No diagnostics.")
        return

    for diag in sorted(diagnostics, key=lambda item: SEVERITY_ORDER.get(item.severity, 9)):
        location = diag.locations[0]
        line = f":{location.line}" if location.line else ""
        key_path = f" {location.key_path}" if location.key_path else ""
        print()
        print(f"[{diag.severity.upper()}] {diag.rule_id} {location.path}{line}{key_path}")
        print(diag.message)
        print(f"Why: {diag.why}")
        print(f"Fix: {diag.fix_hint}")
        print(f"Owner: {diag.owner_skill}")
        if diag.docs:
            print(f"Docs: {', '.join(diag.docs)}")


def print_json(scanned_files: list[str], diagnostics: list[Diagnostic]) -> None:
    summary = summary_for(diagnostics)
    payload = {
        "tool": "mise-review",
        "version": "2",
        "status": status_for(summary),
        "summary": summary,
        "scanned_files": scanned_files,
        "diagnostics": [asdict(diag) for diag in diagnostics],
    }
    print(json.dumps(payload, ensure_ascii=False, indent=2))


def main() -> int:
    args = parse_args()
    target = Path(args.target).resolve()
    scanned_files, diagnostics = validate_target(target)
    summary = summary_for(diagnostics)

    if args.format == "json":
        print_json(scanned_files, diagnostics)
    else:
        print_text(scanned_files, diagnostics)

    return 1 if summary["error"] or summary["policy_error"] else 0


if __name__ == "__main__":
    raise SystemExit(main())
