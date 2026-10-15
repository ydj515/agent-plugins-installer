# Tasks Execution Checklist

## 먼저 읽을 문서

- `../../../references/tasks-core.md`
- `../../../references/anti-patterns.md`
- `../../../references/task-arguments.md`
- 필요 시 `../../../references/task-advanced.md`
- release 흐름이면 `../../../references/release-workflow-patterns.md`

## 작성 순서

1. task 책임을 짧게 자른다.
2. 모든 task에 `description`, `usage`(`about "mise run <task>: <동작>"` 포함), `run`을 지정한다.
3. `[tools]`와 같은 버전을 쓰는 명령에서 `mise exec <tool>@<version> --`를 제거한다. 다른 버전이 필요한 task에만 남긴다.
4. 인자가 있으면 `usage`에 `arg`, `flag`를 추가하고 script는 `usage_*` 변수로 읽는다.
5. 입력과 산출물이 파일이면 `sources`, `outputs`, 외부 상태면 `skip_if`를 검토한다.
6. 외부 호출이나 통합 테스트에는 `timeout`을 둔다.
7. file task header가 formatter-safe한지 확인한다(`#MISE`, `#USAGE`).
8. monorepo dependency를 `//path:task` 또는 `:task`로 명시한다.
9. long-running workflow는 외부 orchestrator가 필요한지 판단한다.
10. `mise tasks validate`와 `mise-review` validator로 확인한다.
