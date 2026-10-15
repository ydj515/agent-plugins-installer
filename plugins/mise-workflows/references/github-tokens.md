# GitHub Tokens

## 목적

이 문서는 두 가지 token 문제를 구분해서 다룬다.

1. 프로젝트 도구(`gh`, release script)가 쓰는 token을 디렉터리별로 주입하는 방법
2. mise 자신이 도구를 설치할 때 GitHub API rate limit을 피하기 위해 쓰는 token

## 기본 원칙

- `GH_TOKEN`과 `GITHUB_TOKEN`은 가능하면 같은 토큰 소스를 가리키게 맞춘다.
- tracked `mise.toml`에는 토큰 원문을 넣지 않는다.
- 토큰 파일, secret manager, 로컬 `.env` 중 하나를 명확히 선택한다.

## 프로젝트 도구용: 디렉터리별 토큰 패턴

같은 저장소 안에서 계정을 분리해야 한다면 `config_root` 또는 `env.HOME`를 기준으로 토큰 파일 경로를 계산한다.

```toml
[env]
GH_TOKEN = { value = "{{ read_file(path=(config_root ~ \"/.secrets/gh-token\")) | trim }}", redact = true }
GITHUB_TOKEN = { value = "{{ env.GH_TOKEN }}", redact = true }
```

토큰 파일이 공용 홈 디렉터리에 있다면:

```toml
[env]
GH_TOKEN = { value = "{{ read_file(path=(env.HOME ~ \"/.config/tokens/work-gh-token\")) | trim }}", redact = true }
GITHUB_TOKEN = { value = "{{ env.GH_TOKEN }}", redact = true }
```

- `.secrets/`는 `.gitignore`에 넣는다.
- Tera v2는 정의되지 않은 변수에서 실패한다. 토큰 파일이 없을 수 있는 환경에서는 이 패턴을 `mise.local.toml`에 둔다.

## mise 자신이 쓰는 token

mise는 `github:`, `aqua:` 도구를 설치할 때 GitHub API를 호출한다. 이 token은 위 프로젝트 token과 별개다.

- 환경 변수: `MISE_GITHUB_TOKEN`이 우선이고, 없으면 `GITHUB_TOKEN`을 읽는다. mise는 `GH_TOKEN`을 직접 읽지 않는다.
- token 파일: `~/.config/mise/github_tokens.toml`에 host별 token을 둔다. 권한은 `600`으로 둔다.
- CLI login: `gh`의 `hosts.yml`에 저장된 token을 읽는다. keyring에 저장했다면 global config에 `credential_command = 'gh auth token --hostname "$MISE_CREDENTIAL_HOST"'`를 둔다.
- `credential_command`는 global-only다. 프로젝트 config가 임의 명령을 지정할 수 없다.
- CI에서는 workflow token을 `MISE_GITHUB_TOKEN`으로 넘긴다. `jdx/mise-action`은 설치 단계에만 token을 넘기고 이후 step에는 내보내지 않는다.

## 왜 둘 다 필요한가

- `GH_TOKEN`: `gh` CLI, 검증 task, 일부 shell script
- `GITHUB_TOKEN`: npm script, release tooling, GitHub-oriented build 도구, mise 설치(대체 경로)

하나만 설정하면 특정 도구 체인에서 인증이 끊길 수 있다.

## 검증

- `gh auth status`
- release task에서 현재 계정과 repository owner가 맞는지 확인
- 프로젝트별 README나 ADR에 어떤 계정이 필요한지 남기기

## 주의점

- SSH ControlMaster나 세션 캐시 때문에 계정 전환이 즉시 반영되지 않을 수 있다.
- 토큰이 바뀌었는데 shell이 오래 살아 있으면 예전 값을 계속 쓸 수 있다.
- 비대화형 job은 shell activation을 거치지 않을 수 있으므로 `.env` 또는 secret manager 연동이 더 적합할 수 있다.
