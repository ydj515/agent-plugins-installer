# Env Anti-Patterns

- tracked config에 secret이나 사용자 로컬 경로를 직접 넣는 패턴
- `.gitignore` 없이 `mise.local.toml`을 추가하는 패턴
- `redact = true`인데 raw output task와 함께 쓰는 패턴
- `mise exec -- script.py`처럼 실행 진입점을 `mise`에 강결합하는 패턴
- non-interactive job에서 shell activation만 믿는 패턴
- 토큰 파일 읽기처럼 정적인 값에 `exec()`를 남용하는 패턴
