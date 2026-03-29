# agent-plugins-installer

`agent-plugins-installer`는 Codex, Claude Code, Gemini CLI에서 사용할 plugin/extension 설치 흐름을 하나의 npm CLI로 묶어 주는 도구입니다.

핵심 구조는 `agent-skills-installer`와 비슷하게 공용 source를 먼저 두고, 설치 시 target별 규격으로 변환하는 방식입니다.

- 공용 source: `plugins/<plugin-id>/`
- target overlay: `plugins/<plugin-id>/targets/<codex|claude|gemini>/`
- installer 역할: 공용 integration bundle을 읽어서 각 agent 규격에 맞는 bundle을 로컬에 배치하고 설치 명령을 실행

현재 기본 번들은 다음 integration을 포함합니다.

- `github`
- `vercel`

지원 대상:

- Codex: 로컬 plugin 복사 + marketplace provisioning
- Claude Code: 로컬 plugin 복사 + 로컬 marketplace provisioning
- Gemini CLI: 로컬 extension bundle 복사 + `gemini extensions install/enable`

## 빠른 시작

대화형 설치:

```bash
npx agent-plugins-installer
```

직접 설치:

```bash
npx agent-plugins-installer install codex --scope project --plugins github
npx agent-plugins-installer install claude --scope user --plugins github,vercel
npx agent-plugins-installer install gemini --scope user --plugins vercel
```

목록 확인:

```bash
npx agent-plugins-installer list all --scope user
```

제거:

```bash
npx agent-plugins-installer remove codex --scope project --plugins github
```

업데이트:

```bash
npx agent-plugins-installer update codex --scope project --plugins github
```

## 타깃별 동작

### Codex

- plugin source를 `.codex/plugins/<plugin-id>`에 복사합니다.
- marketplace file은 `user`면 `~/.agents/plugins/marketplace.json`, `project`면 `<cwd>/.agents/plugins/marketplace.json`을 사용합니다.
- 설치 후 Codex를 재시작하고 Plugin Directory에서 plugin을 설치하거나 활성화해야 할 수 있습니다.

### Claude Code

- 공용 integration source를 `.claude/plugins/<plugin-id>`에 복사합니다.
- 로컬 marketplace manifest를 `.claude/.claude-plugin/marketplace.json`에 생성합니다.
- `claude plugin marketplace add <local-marketplace-path> --scope <scope>` 후 `claude plugin install <plugin>@agent-plugins-installer --scope <scope>`를 호출합니다.
- 설치 상태는 `.claude/.agent-plugins-installer-state.json`에 기록합니다.
- 설치 후 `/reload-plugins` 또는 재시작이 필요할 수 있습니다.

### Gemini CLI

- `user` scope는 공용 integration source를 `~/.gemini/extensions/<extension-id>`에 복사하고 `gemini extensions install <local-extension-path> --consent`를 호출합니다.
- `project` scope도 공용 integration source를 `~/.gemini/extensions/<extension-id>`에 복사하고, 현재 workspace에서 `gemini extensions enable <name> --scope workspace`를 호출합니다.
- 설치 상태는 `user`면 `~/.gemini/.agent-plugins-installer-state.json`, `project`면 `<cwd>/.gemini/.agent-plugins-installer-state.json`에 기록합니다.

## 개발

```bash
npm test
mise run verify
```
