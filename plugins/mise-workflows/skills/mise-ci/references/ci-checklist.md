# CI Execution Checklist

## 먼저 읽을 문서

- `../../../references/ci-integration.md`
- `../../../references/lockfile.md`
- 필요 시 `../../../references/github-tokens.md`
- 필요 시 `../../../references/secrets.md`

## 점검 순서

1. workflow 파일에 하드코딩된 도구 버전이 없는가.
2. 설치가 `mise install --locked`(또는 `mise.lock`이 있을 때의 `jdx/mise-action`)로 이루어지는가.
3. job이 `mise run ci` 같은 task 하나를 호출하고, 단계 구성은 `[tasks]`에 있는가.
4. cache가 신뢰된 ref에서만 저장되고, lockfile이 있으면 다운로드 저장소(`~/.cache/mise/downloads-cas`)를 cache하는가.
5. fork PR이나 bot job이 `MISE_SAFE=1`로 config를 읽는가.
6. GitHub API를 쓰는 이후 step에 token이 전달되는가.
7. Dockerfile이 `mise.toml`, `mise.lock`, `.mise/locks` 디렉터리를 `mise install`보다 먼저 COPY하는가.
8. `mise tasks validate`, `mise-review` validator, 필요 시 `mise doctor project`가 초기 단계에 있는가.
