# Task Advanced

## Watch Mode

- runtime-native watch가 있으면 그것을 우선 사용한다.
- polyglot이거나 공통 watcher가 필요할 때만 `mise watch`를 고려한다. `mise watch`는 task의 `sources`를 감시 대상으로 쓴다.
- 실행 중 변경 처리(`--on-busy-update`)는 `do-nothing`(기본), `queue`, `restart`, `signal` 중에서 고른다. dev server는 보통 `restart`(`-r`)다.
- `.gitignore`된 생성 파일을 감시해야 하면 task에 `watch = { no_vcs_ignore = true }`를 둔다.

## Monorepo Tasks

monorepo 기능은 더 이상 experimental이 아니다. root config에 다음을 둔다.

```toml
monorepo_root = true

[monorepo]
config_roots = ["packages/api", "packages/web", "services/*"]
```

- `experimental_monorepo_root`는 deprecated이며 2027.12.0에서 제거된다. `monorepo_root`로 바꾼다.
- `config_roots` 없이 자동 탐색에 의존하면 deprecation 경고가 난다. 목록을 명시한다. glob은 한 단계(`services/*`)만 허용된다.
- task 이름은 `//packages/api:build`처럼 root 기준 경로를 갖는다. `:build`는 현재 디렉터리를 감싸는 가장 가까운 config root를 뜻한다.
- 새 설정에서는 bare 이름 대신 `:build`를 쓴다. bare 이름도 같은 config root로 해석되지만 의도가 덜 드러난다.
- `...`와 `*` wildcard로 여러 프로젝트를 한 번에 실행할 수 있다: `mise run '//...:test'`. shell 확장을 막기 위해 따옴표를 쓴다.
- 없는 프로젝트를 허용하려면 `depends = [{ task = "//...:test", optional = true }]`.
- root를 trust하면 하위 config도 trust된다.

## Parallel / Sequential

- 여러 독립 task를 함께 돌릴 때는 `mise run a ::: b`
- 순서와 artifact 의존이 있으면 `depends`
- 이미 예약된 task가 끝나길 기다리기만 하려면 `wait_for`
- 동시 실행 수는 `-j/--jobs` 또는 `jobs` setting으로 제한
- `raw = true`는 출력 캡처와 redaction을 끄고 실행 중 다른 명령을 막으므로 꼭 필요한 task에만 사용
- task 전체를 다른 task 없이 실행해야 하면 `interactive = true`

## Timeout

- task별: `timeout = "10m"`. `run`의 각 명령마다 따로 적용된다.
- 실행 전체: `mise run --timeout` 또는 `task.timeout` setting. 둘 다 있으면 짧은 쪽이 이긴다.

## Shell / Env / Tools

- task별 `shell` override는 Windows 대응이나 특수 shell이 필요할 때만 사용
- task별 `env`와 `tools`는 해당 task에만 적용되고 dependency로 전파되지 않는다
- 특정 dependency에만 변수를 줄 때: `depends = ["NODE_ENV=test setup"]` 또는 `{ task = "build", env = { ... } }`
- 전역 env는 `[env]`에서, task-local 값은 `[tasks.<name>.env]`에서 관리한다
- `mise install --include-task-tools`로 task 도구를 미리 설치할 수 있다(CI cache, image 준비)

## Artifact Cache (experimental)

- `experimental = true`일 때 `cache = { enabled = true }`로 성공한 실행의 outputs와 로그를 저장하고 같은 입력이면 복원한다.
- cache key에 영향을 주는 환경 변수는 `cache.env`, 명령 출력은 `cache.command_inputs`에 적는다.
- remote cache로 머신 간 공유도 가능하다. 팀 표준으로 쓰기 전에 experimental 상태와 보안 경계를 확인한다.

## Templates

반복되는 task는 `[task_templates]`에 정의하고 `extends`로 상속한다. flag와 file task도 template을 상속할 수 있다.

## Debugging

- `mise tasks validate`: 순환 의존, 없는 task 참조, `usage` parse 오류, 잘못된 `timeout`, glob 오류를 검사한다. 오류가 있으면 exit 1이므로 CI에 넣을 수 있다
- `mise tasks` / `mise tasks --all`
- `mise tasks deps`: `depends`, `depends_post`, `wait_for` 그래프
- `mise run -n <task>`: dry run
- `mise tasks info <task>`
- task를 shell script로 분리한 경우 직접 스크립트도 실행해 본다
