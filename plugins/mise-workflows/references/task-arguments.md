# Task Arguments

## 기본 원칙

- 새로운 task 인자는 `usage` 기반 정의를 우선 사용한다.
- deprecated helper(`arg()`, `flag()`, `option()`)는 새 코드에서 쓰지 않는다.
- 인자 정의와 실제 스크립트 접근 방식이 일치해야 한다.

## 예시

```toml
[tasks.deploy]
description = "환경과 버전을 받아 배포한다."
usage = """
arg "environment" help="배포 환경" choices=["dev", "staging", "prod"]
option "--version <version>" help="명시적 버전"
flag "--dry-run" help="실제 배포 없이 검증만 수행"
"""
run = "./scripts/deploy.sh"
```

스크립트에서는 usage에서 노출한 환경 변수를 읽는다.

```bash
#!/usr/bin/env bash
set -euo pipefail

environment="${usage_environment}"
version="${usage_version:-}"
dry_run="${usage_dry_run:-false}"
```

## 권장 패턴

- 선택지가 명확하면 `choices`를 사용한다.
- 긴 usage는 multiline 문자열로 유지한다.
- 설명문은 사용자가 아니라 에이전트도 읽는 문맥이라는 점을 고려한다.

## 회피 패턴

- 위치 인자 해석을 shell 내부에서 수작업으로 다시 구현하기
- required/optional 규칙을 usage와 script에서 다르게 두기
- 인자 계약을 숨긴 채 `run = "bash -c '...'"` 안에 파묻기
