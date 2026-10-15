# Task Arguments

## 기본 원칙

- task 인자는 `usage` spec으로 정의한다.
- Tera `arg()`, `option()`, `flag()`는 deprecated이며 mise 2027.5.0에서 제거된다. 새 코드에서 쓰지 않는다.
- 기존 task를 정리할 때는 `task.disable_spec_from_run_scripts = true`(또는 `MISE_TASK_DISABLE_SPEC_FROM_RUN_SCRIPTS=1`)로 `usage`만 읽게 만들어 누락을 확인한다.
- 인자 정의와 실제 스크립트 접근 방식이 일치해야 한다.

## 예시

```toml
[tasks.deploy]
description = "환경과 버전을 받아 배포한다."
usage = '''
about "mise run deploy <environment>: deploy the given version to an environment"
arg "<environment>" help="배포 환경" {
  choices "dev" "staging" "prod"
}
flag "--version <version>" help="명시적 버전"
flag "--dry-run" help="실제 배포 없이 검증만 수행"
'''
run = "./scripts/deploy.sh"
```

각 인자와 flag는 `usage_<name>` 환경 변수로 전달된다. 이름의 `-`는 `_`로 바뀐다(`--dry-run` → `usage_dry_run`).

```bash
#!/usr/bin/env bash
set -euo pipefail

environment="${usage_environment?}"
version="${usage_version:-}"
dry_run="${usage_dry_run:-false}"

if [ "$dry_run" = "true" ]; then
  echo "dry run for $environment"
fi
```

## 변수 접근 규칙

| 표현 | 용도 |
| --- | --- |
| `${usage_x?}` | 필수 인자, 또는 `default`가 있는 인자/flag |
| `${usage_x:-false}` | `default`가 없는 boolean flag |
| `${usage_x:-}` | `default`가 없는 선택 인자 |
| `${usage_x:?}` | 비어 있으면 안 되는 값 |

- boolean은 `= "true"`로 비교한다.
- mise는 호출 환경에서 상속된 `usage_*` 변수를 지운다. 상위 프로세스 값에 기대지 않는다.

## Template에서 쓰기

- `run`, `sources`, `outputs`, `depends`에서 `{{ usage.name }}`으로 인자를 참조할 수 있다.
- 의존 task에 인자를 넘길 때: `depends = [{ task = "build", args = ["{{ usage.app }}"] }]`. 두 task 모두 `usage` spec이 있어야 한다.

## 권장 패턴

- 모든 task의 `usage`는 `about "mise run <task>: <동작>"`으로 시작한다. 인자가 없어도 `about`은 둔다(`tasks-core.md`의 Task 정의 규칙).
- 선택지가 명확하면 `choices`를 사용한다.
- 긴 usage는 TOML literal multiline 문자열(`'''`)로 유지한다.
- 설명문은 사용자뿐 아니라 에이전트도 읽는 문맥이라는 점을 고려한다.

## 회피 패턴

- 위치 인자 해석을 shell 내부에서 수작업으로 다시 구현하기
- required/optional 규칙을 usage와 script에서 다르게 두기
- 인자 계약을 숨긴 채 `run = "bash -c '...'"` 안에 파묻기
- `usage` map과 deprecated Tera helper를 한 task에서 섞기
