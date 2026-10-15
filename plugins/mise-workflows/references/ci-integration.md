# CI Integration

## 목적

이 문서는 CI와 container build에서 `mise`로 같은 도구 체인을 재현하는 기준을 정리한다. lockfile 자체의 운영은 `lockfile.md`를 본다.

## 기본 원칙

- 도구 버전은 workflow 파일이 아니라 저장소의 `mise.toml`과 `mise.lock`에 둔다.
- CI는 `mise install --locked`로 설치한다.
- CI는 `mise run ci` 같은 단일 task 진입점을 호출하고, 단계 구성은 `[tasks]`에 둔다.
- 신뢰하지 않는 ref의 cache를 복원하지 않는다.

## GitHub Actions

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: jdx/mise-action@v5
      - run: mise run ci
```

- 저장소에 `mise.lock`이 있으면 action이 `--locked`를 자동으로 붙인다.
- mise 버전 고정은 `version` input, 하위 프로젝트는 `working_directory` input을 쓴다.
- action은 redacted 값을 GitHub mask로 등록한다.
- action은 workflow token을 설치 단계에만 쓰고 이후 step에 내보내지 않는다. 이후 step이 GitHub API를 많이 쓰면 token을 직접 넘긴다.
- 시작용 workflow는 `mise generate github-action --write --task=ci`로 만들 수 있다. trigger와 action 버전은 리뷰 후 커밋한다.

## Cache 전략

설치본 cache는 그대로 신뢰된다. lockfile이 있으면 다운로드 저장소를 cache하는 편이 안전하다. mise가 lockfile checksum으로 각 파일을 검사한다.

```yaml
steps:
  - uses: actions/checkout@v7
  - uses: actions/cache@v6
    with:
      path: ~/.cache/mise/downloads-cas
      key: mise-downloads-${{ runner.os }}-${{ hashFiles('mise.lock') }}
  - uses: jdx/mise-action@v5
    with:
      cache: false
```

설치본 cache를 계속 쓴다면 cache 밖의 신뢰된 metadata에 manifest를 남기고 복원 후 비교한다.

## GitLab CI와 기타 CI

- GitLab은 committed wrapper 또는 공식 image를 사용하고 `cache:key:files`에 `mise.lock`을 넣는다.
- 그 밖의 CI는 `mise generate install-script --localize --write`로 만든 `bin/mise` wrapper를 커밋한다. wrapper는 고정된 mise release를 내려받아 검증하고 `.mise/` 아래에 도구와 cache를 둔다. `.mise/`는 `.gitignore`에 넣는다.
- 어떤 CI든 cache 복원 뒤에 `mise install --locked`를 다시 실행해 빠진 도구를 설치한다. job은 빈 cache로도 성공해야 한다.

## Docker

- `mise.toml`과 `mise.lock`(필요하면 `.mise/locks` 디렉터리)을 `mise install`보다 먼저 COPY한다.
- 공식 Docker image가 있으므로 base image로 쓸 수 있다.

## 신뢰하지 않는 Branch

- mise는 CI 환경을 감지하면 paranoid mode가 아닌 한 모든 config를 trust한다. checkout한 branch의 task, hook, `[env]`가 그대로 실행된다는 뜻이다.
- secret을 가진 job이 직접 작성하지 않은 branch를 읽는다면(fork PR, lockfile bump bot) `MISE_SAFE=1`로 실행한다. task, `exec()`, plugin 설치, hook, 프로젝트 env와 settings가 막힌다.
- safe mode는 `mise lock`, `mise ls`, `mise env`, `mise outdated` 같은 해석 명령용이다. `mise install`은 source build script를 실행할 수 있으므로 별도로 판단한다.

## Project Diagnostics

도구 버전만으로 확인되지 않는 조건(native library, DB 연결 등)은 `[doctor.checks]`로 선언하고 `mise doctor project`로 실행한다.

```toml
[doctor.checks.openssl]
description = "OpenSSL development files are discoverable"
run = "pkg-config --exists openssl"
hint = "Install the OpenSSL development package for this OS."
timeout = "5s"
os = ["linux", "macos"]
```

- check는 자동으로 실행되지 않는다. CI 초기 단계나 onboarding 안내에서 명시적으로 호출한다.
- 하나가 실패해도 나머지 check는 계속 실행된다.

## 검토 질문

- workflow 파일에 도구 버전이 하드코딩되어 있지 않은가
- CI가 `--locked`로 설치하는가
- cache가 신뢰된 ref에서만 저장되고, 가능하면 다운로드 저장소를 cache하는가
- fork PR이나 bot job이 safe mode로 config를 읽는가
- `mise tasks validate`와 `mise-review` validator를 CI 검증 단계에 넣었는가
