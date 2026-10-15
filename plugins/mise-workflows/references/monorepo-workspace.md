# Monorepo Workspace

## 목적

이 문서는 `uv` workspace나 다중 패키지 저장소에서 `mise`와 workspace 도구를 함께 사용할 때의 운영 기준을 정리한다.

## mise monorepo 설정

```toml
monorepo_root = true

[monorepo]
config_roots = ["packages/*"]
lockfile = true
```

- `config_roots`에 나열된 디렉터리만 로드한다. 재귀 glob(`**`), 절대 경로, `..`는 무시된다.
- `lockfile = true`면 하위 프로젝트 도구가 root lockfile에 모인다. 자세한 내용은 `lockfile.md`를 본다.
- `mise install --monorepo`, `mise ls --monorepo`는 `config_roots`가 있어야 동작한다.

## Python uv workspace

- `.venv`는 가능하면 workspace root에 한 번만 만든다. `python.uv_venv_auto`는 가장 가까운 `uv.lock`을 찾으므로 root `uv.lock` 옆의 `.venv`가 쓰인다.
- dev dependency는 root `pyproject.toml`에 hoist하는 편이 관리가 쉽다.
- 하위 패키지는 runtime 정책은 공유하되 package metadata만 개별 관리한다.

## Root 중심 배치

루트에는 보통 다음이 온다.

- 공통 `mise.toml`과 `mise.lock`
- workspace root `pyproject.toml`
- 공통 `uv.lock`
- 공통 dev dependency group

하위 패키지에는 보통 다음이 온다.

- package별 `pyproject.toml`
- package별 task 또는 추가 env

## Monorepo task와의 연결

- 루트 task는 bootstrap, lint-all, test-all, release orchestration을 담당한다. `mise run '//...:test'`처럼 wildcard로 모든 프로젝트를 돌릴 수 있다.
- 하위 task는 package-local build/test/run을 담당한다.
- 변경된 프로젝트만 돌리는 흐름이 필요하면 `--affected` 계열 옵션을 검토한다.
- 자세한 task 규칙은 `task-advanced.md`를 함께 읽는다.

## 검토 질문

- workspace root에 공통 `.venv`를 둘지 package별로 분리할지 명확한가
- dev dependency가 중복되지 않는가
- root와 package의 책임이 분리되어 있는가
- `config_roots`와 lockfile 정책이 명시되어 있는가
