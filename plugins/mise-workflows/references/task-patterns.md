# Task Patterns

## Hidden Helper Tasks

반복 검증이나 destructive guard는 hidden helper task로 분리하는 편이 좋다.

```toml
[tasks._check-env]
hide = true
description = "필수 env를 검증한다."
run = '[ -n "$API_KEY" ] || { echo "Missing API_KEY"; exit 1; }'
```

## CI / Quality Pipeline

- `lint`와 `typecheck`는 병렬 후보가 될 수 있다.
- `test`는 quality gate 이후에 두는 편이 읽기 쉽다.
- artifact가 필요한 `build`는 그 이후에 둔다.

## Development Server

- 프레임워크 자체 watch가 있으면 framework 명령을 그대로 감싼다.
- 공통 wrapper가 필요할 때만 `mise` task가 dev server 진입점이 된다.

## Long-Running Remote Workflow

SSH, batch queue, remote GPU job처럼 오래 걸리는 흐름은 `mise depends`만으로 orchestration하지 않는다.

- 지속성이 필요하면 외부 queue 또는 job runner를 사용
- `mise` task는 submit/status/cancel entrypoint로 두기

## Review 질문

- hidden helper와 user-facing task가 분리되어 있는가
- CI, build, release 흐름이 artifact 기준으로 읽히는가
- long-running workflow가 shell session 생명주기에 묶여 있지 않은가
