# Task Advanced

## Watch Mode

- runtime-native watch가 있으면 그것을 우선 사용한다.
- polyglot이거나 공통 watcher가 필요할 때만 `mise watch` 계열을 고려한다.
- `on_busy` 동작은 queue, restart, ignore 중 프로젝트 특성에 맞게 고른다.

## Monorepo Support

experimental monorepo task를 쓰려면 다음 전제가 필요하다.

```toml
[settings]
experimental = true
experimental_monorepo_root = true
```

그리고 실행 환경에는 `MISE_EXPERIMENTAL=1`이 필요할 수 있다.

## Parallel / Sequential

- 여러 독립 task를 함께 돌릴 때는 `:::`
- 순서와 artifact 의존이 있으면 `depends`
- `raw = true`는 병렬성과 출력 제어를 제한하므로 꼭 필요한 task에만 사용

## Shell / Env

- task별 `shell` override는 Windows 대응이나 특수 shell이 필요할 때만 사용
- task별 `env`는 해당 task에만 적용되고 dependency로 전파되지 않는다고 가정한다
- 전역 env는 `[env]`에서, task-local 값은 `[tasks.<name>.env]`에서 관리한다

## Debugging

- `mise tasks`
- `mise run -n <task>`
- `mise task info <task>` 또는 유사 정보 확인 흐름
- task를 shell script로 분리한 경우 직접 스크립트도 실행해 본다
