# Tasks Execution Checklist

## 먼저 읽을 문서

- `../../references/tasks-core.md`
- `../../references/anti-patterns.md`
- `../../references/task-arguments.md`
- 필요 시 `../../references/task-advanced.md`
- release 흐름이면 `../../references/release-workflow-patterns.md`

## 작성 순서

1. task 책임을 짧게 자른다.
2. `description`을 충분히 써서 목적과 산출물을 드러낸다.
3. 인자 체계를 `usage` 기준으로 통일한다.
4. file task comment가 formatter-safe한지 확인한다.
5. monorepo dependency를 명시적으로 적는다.
6. long-running workflow는 외부 orchestrator가 필요한지 판단한다.
