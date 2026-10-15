# Env Anti-Patterns

- tracked config에 secret이나 사용자 로컬 경로를 직접 넣는 패턴
- `.gitignore` 없이 `mise.local.toml`이나 `mise.local.lock`을 추가하는 패턴
- `redactions`를 `[env]` 안에 넣는 패턴
- `redact = true`인데 raw output task와 함께 쓰는 패턴
- `python.uv_venv_auto = true`(deprecated)나 `_.python.venv`와의 중복 선언
- Tera v1 helper(`trim_start_matches`, `as_str`)를 새 template에 쓰는 패턴
- `MISE_*` 변수를 `[env]`에 넣고 mise 동작이 바뀔 거라고 기대하는 패턴
- `mise exec -- script.py`처럼 실행 진입점을 `mise`에 강결합하는 패턴
- non-interactive job에서 shell activation만 믿는 패턴
- 토큰 파일 읽기처럼 정적인 값에 `exec()`를 남용하는 패턴
