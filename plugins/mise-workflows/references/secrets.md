# Secrets

## 목적

이 문서는 `mise` 프로젝트에서 secret을 다루는 방식을 고르는 기준을 정리한다. 평문 secret을 tracked config에 넣지 않는다는 원칙은 `env-core.md`와 같다.

## 선택 기준

| 방식 | 언제 | 노출 범위 |
| --- | --- | --- |
| `mise.local.toml` | 개인 개발용 값, 저장소에 남기지 않음 | 활성화된 shell, task, `mise env` |
| SOPS 파일 | secret을 별도 파일로 암호화해 커밋 | config 로드 시 복호화되어 shell, task에 노출 |
| age 값 | 몇 개의 암호화된 변수를 `mise.toml`에 직접 둠 | 기본 redaction 적용 |
| fnox (experimental) | 1Password, AWS Secrets Manager 같은 secret manager | `secrets`를 선언한 task에만 전달 |

## SOPS / age

- ciphertext는 커밋하고, 복호화 identity는 저장소 밖에서 공유한다.
- SOPS로 읽은 값은 일반 `[env]` 값이므로 `redact = true`를 붙인다.
- `MISE_SOPS_AGE_KEY`, `MISE_SOPS_AGE_KEY_FILE`은 예외적으로 `[env]`에서 읽힌다. 단, 복호화 대상 파일보다 먼저 선언해야 한다.

## fnox task secrets (experimental)

```toml
min_version = "2026.10.4"

[settings]
experimental = true

[secrets.fnox]

[tasks.deploy]
description = "Deploy with credentials scoped to this task."
usage = '''
about "mise run deploy: deploy with credentials scoped to this task"
'''
secrets = ["DEPLOY_KEY", "DATABASE_URL"]
run = "./scripts/deploy.sh"
```

- 선언한 task에만 값이 전달되고 출력에서 마스킹된다. 의존 task, shell, hook, `mise env`에는 전달되지 않는다.
- task의 `env`에서 `{{ secrets.NAME }}`으로 값을 조합할 수 있다.
- `secrets`를 선언한 task는 trust가 필요하다.
- experimental 기능이므로 팀 표준으로 채택하기 전에 `min_version`을 고정하고 변경 이력을 확인한다.

## Redaction과 CI 마스킹

- 개별 값: `redact = true`
- 이름 패턴: top-level `redactions = ["*_TOKEN", "*_KEY"]`
- 패턴에서 제외: 변수에 `redact = false`
- `jdx/mise-action`은 redacted 값을 GitHub Actions mask로 등록한다. action 밖에서 secret을 읽는 step은 `mise env --redacted --json` 결과로 직접 `::add-mask::`를 등록해야 한다.
- `raw = true` task는 출력을 가로채지 않으므로 마스킹되지 않는다.

## 검토 질문

- tracked config에 평문 secret이나 토큰 원문이 없는가
- secret 노출 범위가 필요한 범위보다 넓지 않은가(전체 shell vs 특정 task)
- 복호화 key가 저장소에 함께 들어가 있지 않은가
- redaction이 필요한 값에 `redact` 또는 `redactions`가 적용되어 있는가
