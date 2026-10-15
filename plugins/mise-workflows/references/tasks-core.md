# Tasks Core

## 목적

이 문서는 `mise` task 설계, file task, monorepo task composition에 대한 공통 기준을 정의한다.

## 기본 원칙

- task 이름은 목적이 바로 드러나게 짓는다. `:`가 들어간 이름은 TOML에서 따옴표로 감싼다: `[tasks."release:build"]`.
- `description`은 사람뿐 아니라 에이전트가 읽는 문맥이므로 비워두지 않는다.
- 인자 처리는 `usage` spec을 사용한다. Tera `arg()`, `option()`, `flag()`는 deprecated이며 2027.5.0에서 제거된다.
- file task는 formatter-safe header(`#MISE`, `# MISE`, `# [MISE]`)를 사용한다.
- monorepo dependency는 `//path:task` 또는 `:task`로 명시한다.
- long-running workflow는 shell session에 매이지 않게 설계한다.

## Task 정의 규칙 (필수)

모든 task는 `description`, `usage`, `run` 세 가지를 반드시 지정한다. 인자가 없는 task도 `usage`에 `about`을 둔다.

```toml
[tasks.test]
description = "Run the unit test suite."
usage = '''
about "mise run test: run unit tests, optionally filtered by name"
flag "--filter <pattern>" help="Only run tests matching the pattern"
'''
run = 'uv run pytest ${usage_filter:+-k "$usage_filter"}'
```

- `description`: `mise tasks` 목록에 보이는 한 줄 목적
- `usage`의 `about`: `mise run <task> --help` 첫 줄에 보이는 실행 방법. `"mise run <task>: <동작>"` 형식으로 쓴다
- `usage`의 `arg`, `flag`: 인자가 있을 때만 추가한다
- `run`: 실제 명령. 다른 task만 묶는 orchestrator도 `depends`와 함께 `run`을 둔다(예: 완료 메시지 출력)
- 스크립트 파일을 실행하는 task는 `run = "./scripts/x.sh"`처럼 `run`으로 연결한다. `file` 속성을 쓴 경우 `run` 대신 `file`을 허용한다
- file task는 같은 규칙을 header로 지킨다: `#MISE description="..."`, `#USAGE about "mise run <task>: ..."`, 그리고 script 본문
- hidden helper task(`hide = true`)도 같은 규칙을 따른다
- `usage`는 TOML literal string(`'''`)으로 감싸 KDL 안의 따옴표를 escape하지 않게 한다

`mise-review` validator는 이 규칙을 `MWT002`(policy-error)로 검사한다.

## 도구 실행 규칙 (필수)

`mise run`은 task를 실행할 때 `[tools]`의 도구를 PATH에 활성화한다. 따라서 `[tools]`와 같은 버전으로 실행하는 명령에는 `mise exec`를 쓰지 않는다.

```toml
[tools]
node = "24.19.0"

[tasks.test]
description = "Run the automated test suite."
usage = '''
about "mise run test: run the automated test suite with the configured Node version"
'''
run = "npm test"

[tasks.test-node22]
description = "Run the automated test suite on Node 22."
usage = '''
about "mise run test-node22: run the automated test suite on Node 22"
'''
run = "mise exec node@22 -- npm test"
```

- `[tools]`와 같은 버전이면 `npm test`, `node src/cli.js`처럼 명령만 쓴다.
- `mise exec <tool>@<version> --`는 `[tools]`와 다른 버전이 필요할 때만 쓴다(예: 버전 매트릭스 task).
- 같은 버전을 prefix로 다시 적는 `mise exec node@24 --`는 `[tools]`에 고정한 `24.19.0` 대신 설치된 다른 24.x로 해석될 수 있다. 버전 고정이 무시되므로 쓰지 않는다.
- task 하나에만 다른 버전이 필요하고 매트릭스가 아니라면 task의 `tools` 속성(`tools.node = "22"`)도 검토한다. `tools`로 선언하면 `mise lock`이 그 버전을 lockfile에 기록한다.

## Task 속성 요약

| 묶음 | 속성 |
| --- | --- |
| 실행 | `run`, `run_windows`, `file`, `shell`, `dir`, `usage`, `extends` |
| 설명과 노출 | `description`, `alias`, `hide`, `confirm` |
| 순서 | `depends`, `depends_post`, `wait_for` |
| 환경과 도구 | `env`, `vars`, `tools`, `secrets`(experimental) |
| 작업 생략 | `skip_if`, `sources`, `outputs`, `cache`(experimental) |
| 실행 제어 | `timeout`, `raw`, `interactive` |
| 출력 | `output`, `quiet`, `silent` |

## 권장 패턴

- 짧은 실행 흐름은 `[tasks]`에 유지
- 반복적이거나 긴 shell은 별도 스크립트나 file task로 분리
- 입력 파일이 명확한 build는 `sources`, `outputs`로 불필요한 재실행을 줄인다
- 파일로 표현되지 않는 상태(외부 도구 초기화 여부)는 `skip_if`로 판단한다
- 정리 작업은 `depends_post`로 성공/실패와 관계없이 실행한다
- task 전용 도구는 `tools`로 선언하고 `mise lock`으로 lockfile에 포함한다
- hidden helper task로 검증/guard를 분리
- 오래 걸릴 수 있는 원격 호출이나 통합 테스트에는 `timeout`을 둔다
- release는 DAG를 명시적으로 적고 build artifact를 publish 전에 보장
- 반복되는 task 정의는 `[task_templates]`와 `extends`로 공유

## 자주 같이 읽을 문서

- `task-arguments.md`
- `task-advanced.md`
- `task-patterns.md`
- `release-workflow-patterns.md`

## 회피 패턴

- deprecated Tera argument helper(`arg()`, `option()`, `flag()`)
- monorepo에서 bare dependency 이름 남발
- formatter가 깨뜨리는 file task comment
- 너무 많은 책임이 섞인 단일 task
- long-running remote workflow를 `depends`로만 연결
- `sources`에 지나치게 넓은 glob을 넣어 매 실행마다 파일 검사 비용을 키우기

## 검토 체크리스트

- 모든 task에 `description`, `usage`(`about` 포함), `run`이 있는가
- `[tools]`와 같은 버전을 쓰는 명령에 불필요한 `mise exec`가 붙어 있지 않은가
- task가 profile 관례와 맞는가
- 인자 정의 방식이 `usage` 하나로 통일되어 있는가
- long-running shell이 재사용 가능한 스크립트로 분리되어 있는가
- release/publish task가 build dependency와 artifact 검증을 보장하는가
- `sources`, `outputs`가 실제 입력과 산출물을 반영하는가
- 외부 호출이 있는 task에 `timeout`이 있는가
