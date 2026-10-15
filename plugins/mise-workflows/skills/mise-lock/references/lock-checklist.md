# Lock Execution Checklist

## 먼저 읽을 문서

- `../../../references/lockfile.md`
- `../../../references/version-policy.md`
- monorepo면 `../../../references/monorepo-workspace.md`

## 점검 순서

1. lock 대상 도구가 `mise.toml`에 선언되어 있는가(`.tool-versions`만 있으면 옮긴다).
2. `[settings] lockfile = true`가 필요한가, 아니면 `mise lock`으로 한 번 만들면 충분한가.
3. `mise lock --platform`으로 개발자, CI, image 플랫폼 entry가 모두 있는가.
4. `mise.lock`과 `.mise/locks` 디렉터리(있다면)를 커밋하는가.
5. `mise.local.lock`, `mise.*.local.lock`, `.mise/locks/mise.local` 디렉터리가 ignore되어 있는가.
6. CI가 `mise install --locked`로 설치하는가.
7. monorepo라면 `[monorepo] lockfile` 정책을 명시했는가.
8. bump 자동화가 있다면 `MISE_SAFE=1`로 실행하고 diff를 리뷰하는가.
9. `mise-review` validator의 `MWL*` 진단이 없는가.
