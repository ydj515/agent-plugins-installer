#!/usr/bin/env python3
"""Validate mise configuration files with a small starter rule set."""

from __future__ import annotations

import argparse
import json
import re
import sys
import tomllib
from dataclasses import asdict, dataclass
from pathlib import Path

PLUGIN_ROOT = Path(__file__).resolve().parents[1]

# Current rule families implemented by this starter validator:
# - PARSE*: TOML parsing failures
# - MWC*: generic tools/backend/config rules
# - MWE*: env and local override rules
# - MWP*: profile inference rules
# - MWV*: version policy rules
# - MWJ*: Java selector/vendor policy rules


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
        "why": "`ubi:` backend is deprecated and should not be the default backend choice.",
        "fix_hint": "Prefer a core tool or another maintained backend such as `github:` when applicable.",
        "docs": ["https://mise.jdx.dev/dev-tools/backends/ubi.html"],
    },
    "MWC002": {
        "severity": "warning",
        "source_type": "official",
        "owner_skill": "mise-tools",
        "message": "Legacy `asdf:` backend usage detected.",
        "why": "Legacy asdf plugin usage is harder to standardize and should be a fallback, not the default path.",
        "fix_hint": "Prefer a core tool or a maintained backend before falling back to `asdf:`.",
        "docs": ["https://mise.jdx.dev/dev-tools/backends/asdf.html"],
    },
    "MWE001": {
        "severity": "error",
        "source_type": "official",
        "owner_skill": "mise-env",
        "message": "Deprecated top-level env setting detected.",
        "why": "Top-level env settings such as `env_file`, `dotenv`, and `env_path` have modern `env._.*` replacements.",
        "fix_hint": "Move the setting to the appropriate `env._.*` form.",
        "docs": ["https://mise.jdx.dev/environments/"],
    },
    "MWE002": {
        "severity": "warning",
        "source_type": "official",
        "owner_skill": "mise-env",
        "message": "Local mise config is not safely ignored.",
        "why": "Tracked local config can leak local paths, secrets, or machine-specific behavior.",
        "fix_hint": "Add `mise.local.toml` and `mise.*.local.toml` to `.gitignore`.",
        "docs": ["https://mise.jdx.dev/configuration/environments.html"],
    },
    "MWV002": {
        "severity": "policy-error",
        "source_type": "policy",
        "owner_skill": "mise-policy",
        "message": "Tracked config stores `latest` directly.",
        "why": "Direct `latest` usage reduces reproducibility and bypasses the intended selector-plus-lock workflow.",
        "fix_hint": "Store a stable selector or exact version in `mise.toml` and rely on `mise.lock` for resolution.",
        "docs": ["https://mise.jdx.dev/cli/latest.html", "https://mise.jdx.dev/dev-tools/mise-lock.html"],
    },
    "MWJ001": {
        "severity": "policy-error",
        "source_type": "policy",
        "owner_skill": "mise-tools",
        "message": "Java selector is missing an explicit vendor.",
        "why": "Java shorthand such as `21` depends on default vendor mapping and is weaker than an explicit vendor-qualified selector.",
        "fix_hint": "Prefer an explicit selector such as `zulu-21`.",
        "docs": ["https://mise.jdx.dev/lang/java.html", str(PLUGIN_ROOT / "references/ecosystems/java-runtime.md")],
    },
    "MWP001": {
        "severity": "error",
        "source_type": "policy",
        "owner_skill": "mise-profiles",
        "message": "Inferred `python-uv-app` profile is missing required tools.",
        "why": "A repository that uses `pyproject.toml` with `uv.lock` should declare both `python` and `uv` in `[tools]` to keep runtime and package workflow reproducible.",
        "fix_hint": "Add both `python` and `uv` to `[tools]`, then align selectors with the shared version policy.",
        "docs": [
            str(PLUGIN_ROOT / "references/profile-catalog.md"),
            str(PLUGIN_ROOT / "references/examples/python-uv-app.md"),
        ],
    },
    "MWP002": {
        "severity": "error",
        "source_type": "policy",
        "owner_skill": "mise-profiles",
        "message": "Inferred `java-gradle-app` profile is missing required tools.",
        "why": "A Gradle-based Java application should declare both `java` and `gradle` in `[tools]` so repository setup and local builds converge on the same toolchain contract.",
        "fix_hint": "Add both `java` and `gradle` to `[tools]`, then hand off vendor and selector details to the Java and Gradle skills.",
        "docs": [
            str(PLUGIN_ROOT / "references/profile-catalog.md"),
            str(PLUGIN_ROOT / "references/examples/java-gradle-app.md"),
        ],
    },
    "MWP003": {
        "severity": "error",
        "source_type": "policy",
        "owner_skill": "mise-profiles",
        "message": "Inferred `java-spring-service` profile is missing required tools.",
        "why": "A Spring service should declare both `java` and `gradle` in `[tools]` so service startup, tests, and packaging all run against the intended toolchain.",
        "fix_hint": "Add both `java` and `gradle` to `[tools]`, then keep Spring-specific env and task rules separate from runtime/build selection.",
        "docs": [
            str(PLUGIN_ROOT / "references/profile-catalog.md"),
            str(PLUGIN_ROOT / "references/examples/java-spring-service.md"),
        ],
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
    hidden = target / ".mise.toml"
    if hidden.exists():
        candidates.append(hidden)
    unique = []
    seen = set()
    for candidate in candidates:
        if candidate not in seen:
            seen.add(candidate)
            unique.append(candidate)
    return unique, target


def line_for_pattern(path: Path, pattern: str) -> tuple[int | None, int | None]:
    text = path.read_text(encoding="utf-8")
    for idx, line in enumerate(text.splitlines(), start=1):
        match = re.search(pattern, line)
        if match:
            return idx, match.start() + 1
    return None, None


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


def make_profile_diag(rule_id: str, location: Location, evidence: dict[str, object]) -> Diagnostic:
    return make_diag(rule_id, location, evidence)


def validate_env_keys(config_path: Path, data: dict[str, object]) -> list[Diagnostic]:
    diagnostics: list[Diagnostic] = []
    for key in ("env_file", "dotenv", "env_path"):
        if key in data:
            line, col = line_for_pattern(config_path, rf"^\s*{re.escape(key)}\s*=")
            diagnostics.append(
                make_diag(
                    "MWE001",
                    Location(path=str(config_path), line=line, column=col, key_path=key),
                    {"deprecated_key": key},
                )
            )
    return diagnostics


def tools_location(parsed_configs: list[ParsedConfig], root: Path) -> Location:
    if parsed_configs:
        config_path = parsed_configs[0].path
        line, col = line_for_pattern(config_path, r"^\s*\[tools\]\s*$")
        return Location(path=str(config_path), line=line, column=col, key_path="tools")
    return Location(path=str(root / "mise.toml"), key_path="tools")


def declared_tools(parsed_configs: list[ParsedConfig]) -> set[str]:
    names: set[str] = set()
    for config in parsed_configs:
        tools = config.data.get("tools")
        if isinstance(tools, dict):
            names.update(str(name) for name in tools.keys())
    return names


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
        path = root / build_file
        if file_contains(path, (r"org\.springframework\.boot", r"spring-boot", r"springframework")):
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

    python_signals: list[str] = []
    if (root / "pyproject.toml").exists():
        python_signals.append("pyproject.toml")
    if (root / "uv.lock").exists():
        python_signals.append("uv.lock")
    if len(python_signals) == 2:
        profiles["python-uv-app"] = python_signals

    gradle_signals: list[str] = []
    for candidate in ("build.gradle", "build.gradle.kts", "gradlew"):
        if (root / candidate).exists():
            gradle_signals.append(candidate)

    if gradle_signals:
        detected_spring = spring_signals(root)
        if detected_spring:
            profiles["java-spring-service"] = list(dict.fromkeys(gradle_signals + detected_spring))
        else:
            profiles["java-gradle-app"] = list(dict.fromkeys(gradle_signals))

    return profiles


def validate_profiles(root: Path, parsed_configs: list[ParsedConfig]) -> list[Diagnostic]:
    diagnostics: list[Diagnostic] = []
    location = tools_location(parsed_configs, root)
    tools = declared_tools(parsed_configs)
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
        if not missing_tools:
            continue
        diagnostics.append(
            make_profile_diag(
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


def validate_tools(config_path: Path, data: dict[str, object]) -> list[Diagnostic]:
    diagnostics: list[Diagnostic] = []
    tools = data.get("tools")
    if not isinstance(tools, dict):
        return diagnostics

    for tool_name, raw_value in tools.items():
        if not isinstance(raw_value, str):
            continue
        line, col = line_for_pattern(config_path, rf"^\s*{re.escape(tool_name)}\s*=")
        location = Location(path=str(config_path), line=line, column=col, key_path=f"tools.{tool_name}")
        normalized = raw_value.strip()

        if "ubi:" in normalized:
            diagnostics.append(make_diag("MWC001", location, {"tool": tool_name, "found": normalized}))
        if "asdf:" in normalized:
            diagnostics.append(make_diag("MWC002", location, {"tool": tool_name, "found": normalized}))
        if normalized == "latest":
            diagnostics.append(make_diag("MWV002", location, {"tool": tool_name, "found": normalized}))
        if tool_name == "java" and re.fullmatch(r"\d+(?:\.\d+)?", normalized):
            diagnostics.append(make_diag("MWJ001", location, {"tool": tool_name, "found": normalized}))

    return diagnostics


def validate_gitignore(root: Path) -> list[Diagnostic]:
    diagnostics: list[Diagnostic] = []
    local_configs = list(root.glob("mise.local.toml")) + list(root.glob("mise.*.local.toml"))
    if not local_configs:
        return diagnostics

    gitignore = root / ".gitignore"
    text = gitignore.read_text(encoding="utf-8") if gitignore.exists() else ""
    has_plain = "mise.local.toml" in text
    has_glob = "mise.*.local.toml" in text
    if has_plain and has_glob:
        return diagnostics

    diagnostics.append(
        make_diag(
            "MWE002",
            Location(path=str(gitignore if gitignore.exists() else root / ".gitignore"), key_path=".gitignore"),
            {
                "local_configs": [path.name for path in local_configs],
                "missing_patterns": [
                    pattern
                    for pattern, present in (("mise.local.toml", has_plain), ("mise.*.local.toml", has_glob))
                    if not present
                ],
            },
        )
    )
    return diagnostics


def validate_target(target: Path) -> tuple[list[str], list[Diagnostic]]:
    config_files, root = discover_target_files(target)
    diagnostics: list[Diagnostic] = []
    parsed_configs: list[ParsedConfig] = []

    for config_path in config_files:
        try:
            data = tomllib.loads(config_path.read_text(encoding="utf-8"))
        except tomllib.TOMLDecodeError as exc:
            line = getattr(exc, "lineno", None)
            col = getattr(exc, "colno", None)
            diagnostics.append(
                Diagnostic(
                    rule_id="PARSE001",
                    severity="error",
                    source_type="official-inferred",
                    owner_skill="mise-review",
                    message="Failed to parse TOML file.",
                    why="The file cannot be reviewed reliably until TOML syntax errors are fixed.",
                    fix_hint="Fix the TOML syntax error and run the validator again.",
                    autofix_available=False,
                    locations=[Location(path=str(config_path), line=line, column=col)],
                    docs=[],
                    evidence={"error": str(exc)},
                )
            )
            continue

        if isinstance(data, dict):
            parsed_configs.append(ParsedConfig(path=config_path, data=data))
            diagnostics.extend(validate_env_keys(config_path, data))
            diagnostics.extend(validate_tools(config_path, data))

    diagnostics.extend(validate_gitignore(root))
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
    print(
        "errors: {error}, policy-errors: {policy_error}, warnings: {warning}, info: {info}".format(
            **summary
        )
    )
    if scanned_files:
        print(f"scanned: {', '.join(scanned_files)}")
    if not diagnostics:
        print("No diagnostics.")
        return

    order = {"error": 0, "policy-error": 1, "warning": 2, "info": 3}
    diagnostics = sorted(diagnostics, key=lambda item: order.get(item.severity, 9))
    for diag in diagnostics:
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
        "version": "1",
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

    if summary["error"] or summary["policy_error"]:
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
