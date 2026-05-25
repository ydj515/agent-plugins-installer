# GitHub Tokens

## 목적

이 문서는 GitHub 계정이 여러 개인 개발 환경에서 `mise` `[env]`를 이용해 디렉터리별 토큰을 안전하게 주입하는 패턴을 정리한다.

## 기본 원칙

- `GH_TOKEN`과 `GITHUB_TOKEN`은 가능하면 같은 토큰 소스를 가리키게 맞춘다.
- tracked `mise.toml`에는 토큰 원문을 넣지 않는다.
- 토큰 파일, secret manager, 로컬 `.env` 중 하나를 명확히 선택한다.

## 디렉터리별 토큰 패턴

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

## 왜 둘 다 필요한가

- `GH_TOKEN`: `gh` CLI, 검증 task, 일부 shell script
- `GITHUB_TOKEN`: npm script, release tooling, GitHub-oriented build 도구

하나만 설정하면 특정 도구 체인에서 인증이 끊길 수 있다.

## 검증

- `gh auth status`
- release task에서 현재 계정과 repository owner가 맞는지 확인
- 프로젝트별 README나 ADR에 어떤 계정이 필요한지 남기기

## 주의점

- SSH ControlMaster나 세션 캐시 때문에 계정 전환이 즉시 반영되지 않을 수 있다.
- 토큰이 바뀌었는데 shell이 오래 살아 있으면 예전 값을 계속 쓸 수 있다.
- 비대화형 job은 shell activation을 거치지 않을 수 있으므로 `.env` 또는 secret manager 연동이 더 적합할 수 있다.
