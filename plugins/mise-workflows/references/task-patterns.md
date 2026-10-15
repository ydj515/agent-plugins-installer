# Task Patterns

## Hidden Helper Tasks

반복 검증이나 destructive guard는 hidden helper task로 분리하는 편이 좋다.

```toml
[tasks._check-env]
hide = true
description = "필수 env를 검증한다."
usage = '''
about "mise run _check-env: fail when API_KEY is missing"
'''
run = '[ -n "$API_KEY" ] || { echo "Missing API_KEY"; exit 1; }'
```

값의 존재만 확인한다면 `[env] API_KEY = { required = "..." }`가 더 짧다. helper task는 여러 값의 조합이나 외부 상태를 검사할 때 쓴다.

## 증분 Build

입력과 산출물이 파일로 표현되면 `sources`와 `outputs`로 재실행을 건너뛴다.

```toml
[tasks.build]
description = "Compile the CLI when sources change."
usage = '''
about "mise run build: compile the CLI, skipped when sources are unchanged"
'''
sources = ["Cargo.toml", "src/**/*.rs", "!src/**/*_test.rs"]
outputs = ["target/debug/mycli"]
run = "cargo build"
```

- `!`로 시작하는 항목은 제외한다. 뒤의 항목이 앞의 제외를 다시 포함할 수 있다.
- task를 정의한 config 파일과 script는 항상 source로 취급된다.
- `mise run --force`로 freshness 검사를 무시한다.

## 외부 상태 기반 생략

```toml
[tasks.setup]
description = "Initialize the workspace once."
usage = '''
about "mise run setup: initialize the workspace unless it already exists"
'''
skip_if = "examplectl workspace show"
run = "examplectl workspace init"
```

- `skip_if` 명령이 0으로 끝나면 task를 성공으로 보고 건너뛴다.
- 출력은 버려지고 stdin이 없으므로 prompt를 띄우는 명령은 쓰지 않는다.
- 없으면 실패해야 하는 조건은 `skip_if`가 아니라 `run`에서 검사한다.

## 정리 작업

```toml
[tasks.integration-test]
description = "Run integration tests against local services."
usage = '''
about "mise run integration-test: start services, run integration tests, then stop services"
'''
depends = ["services:up"]
depends_post = ["services:down"]
timeout = "15m"
run = "./scripts/integration-test.sh"
```

`depends_post`는 task가 시작된 뒤 성공/실패와 관계없이 실행된다.

## CI / Quality Pipeline

- `lint`와 `typecheck`는 병렬 후보가 될 수 있다.
- `test`는 quality gate 이후에 두는 편이 읽기 쉽다.
- artifact가 필요한 `build`는 그 이후에 둔다.
- CI에서는 `mise run ci` 같은 단일 진입점을 두고, workflow 파일은 그 task만 호출한다.

## Development Server

- 프레임워크 자체 watch가 있으면 framework 명령을 그대로 감싼다.
- 공통 wrapper가 필요할 때만 `mise` task가 dev server 진입점이 된다.
- DB나 queue 같은 보조 서비스는 experimental `daemons`와 task의 `daemons` 속성으로 묶을 수 있다. 팀 표준으로 쓰기 전에 experimental 여부를 확인한다.

## Long-Running Remote Workflow

SSH, batch queue, remote GPU job처럼 오래 걸리는 흐름은 `depends`만으로 orchestration하지 않는다.

- 지속성이 필요하면 외부 queue 또는 job runner를 사용
- `mise` task는 submit/status/cancel entrypoint로 두기
- 각 entrypoint에 `timeout`을 둔다

## Review 질문

- hidden helper와 user-facing task가 분리되어 있는가
- CI, build, release 흐름이 artifact 기준으로 읽히는가
- `sources`, `outputs` 또는 `skip_if`로 불필요한 재실행을 줄였는가
- long-running workflow가 shell session 생명주기에 묶여 있지 않은가
