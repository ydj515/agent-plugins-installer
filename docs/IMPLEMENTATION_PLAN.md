# 멀티 에이전트 플러그인 설치 패키지 구현 계획

> 구현 반영 메모:
> - 현재 실제 구현은 `plugins/github`, `plugins/vercel` 같은 공용 source + `targets/<agent>/` overlay 구조로 전환되었다.
> - Claude도 공식 marketplace 의존 전략이 아니라, 공용 integration에서 로컬 Claude plugin과 로컬 marketplace를 생성해 설치하는 방식으로 변경되었다.

## 0. 결정 요약

| 항목 | 결정 |
| --- | --- |
| 공개 패키지명 | `agent-plugins-installer` |
| 공개 배포 방식 | npm 공개 배포 |
| 권장 기본 진입점 | `npx agent-plugins-installer` |
| v1 공식 지원 에이전트 | `codex`, `claude`, `gemini` |
| v1 기본 지원 플러그인 | `github`, `vercel` |
| Gemini 상태 | 2026-03-29 확인 기준, `plugin`이 아니라 `extensions` 체계를 공식 지원 |
| Gemini v1 정책 | `plugin installer` 안에서 `gemini extension`도 함께 지원 |
| Codex 설치 방식 | 번들 plugin 복사 + 로컬 marketplace 생성/갱신 + 사용자가 Codex UI에서 설치/활성화 |
| Claude 설치 방식 | 공식 marketplace plugin을 `claude plugin ...` CLI로 설치/제거 자동화 |
| Gemini 설치 방식 | `user`는 `gemini extensions install <local-path>`, `project`는 home extension bundle + workspace 활성화 |
| v1 목표 | 설치 경험 통일, 안전한 재설치, 최소 2개 integration 안정 지원 |
| v2 후보 | `update`, `doctor`, Gemini workspace-scope 고도화, 더 많은 plugin/extension 카탈로그 |

## 1. 문제 이해 / 요구사항 정리

### 조건
- 이 저장소는 현재 구현보다 원본 plugin 자산과 참고 문서가 먼저 들어 있는 상태다.
- 현재 번들로 확보된 Codex plugin 원본은 `github`, `vercel` 두 개다.
- npm 패키지로 배포해 사용자가 저장소를 직접 clone 하지 않고도 설치할 수 있어야 한다.
- `/Users/dongjin/dev/study/agent-skills-installer`와 비슷한 사용성을 가져가야 한다.
- 사용자 관점에서 “어떤 agent를 쓰든 비슷한 명령으로 plugin을 설치”하는 경험이 중요하다.
- 하지만 실제 설치 메커니즘은 agent별로 다르다.
  - Codex는 로컬 marketplace와 plugin directory 기반이다.
  - Claude는 공식 marketplace와 CLI 설치 명령이 있다.
  - Gemini는 공식적으로 `extensions` 체계를 제공하며, Codex/Claude의 plugin과 동일한 계약이 아니다.

### 목표
- `github`, `vercel` integration 설치를 Codex, Claude, Gemini에서 쉽게 수행할 수 있게 한다.
- 패키지 하나로 agent별 차이를 감싸되, 내부적으로는 안전한 타깃별 전략을 사용한다.
- 설치, 조회, 제거 흐름을 최소 범위로 통일한다.
- v1은 “작동하는 경험”을 우선하되, Gemini는 extension이라는 별도 계약을 존중하는 방식으로 포함한다.

## 2. 조사 결과와 범위 확정

### 2026-03-29 기준 확인 결과
- Codex:
  - `.codex-plugin/plugin.json` 기반 plugin 구조와 로컬 marketplace 구성이 가능하다.
  - 문서상 plugin은 marketplace를 통해 노출되고, 사용자는 Plugin Directory에서 설치/활성화한다.
  - 문서상 설치 캐시와 활성 상태는 Codex가 내부적으로 관리한다.
- Claude:
  - `.claude-plugin/plugin.json` 기반 plugin 구조를 지원한다.
  - 공식 marketplace `claude-plugins-official`에서 `github`, `vercel` 같은 plugin을 설치할 수 있다.
  - `claude plugin install ... --scope ...` 같은 CLI 명령이 공식 문서에 있다.
- Gemini:
  - 공식 문서상 `plugins`가 아니라 `extensions`를 지원한다.
  - `gemini extensions install <source>`, `gemini extensions uninstall <name>`, `gemini extensions update <name|--all>`가 공식 문서에 명시돼 있다.
  - extension 루트에는 `gemini-extension.json`이 필요하며, 실제 로드 위치는 `~/.gemini/extensions`다.
  - skills, MCP servers, custom commands, hooks, sub-agents를 extension에 번들할 수 있다.
  - 따라서 Codex/Claude와 동일한 설치 메커니즘은 아니지만, 별도 타깃 전략을 두면 같은 npm 도구 안에서 지원 가능하다.

### 범위 결론
- v1은 `codex`, `claude`, `gemini`를 지원한다.
- 다만 Gemini는 `plugin`이 아니라 `extension`으로 설치된다.
- CLI 타깃에서도 v1은 `codex|claude|gemini|all`을 노출한다.

## 3. 해결 접근

### 선택한 접근
- `공통 카탈로그 + 타깃별 설치 전략` 구조를 사용한다.
- 카탈로그는 “integration id” 기준으로 관리한다.
- 각 integration은 타깃별로 서로 다른 설치 전략을 가진다.
  - `github`
    - `codex`: 번들된 로컬 plugin 소스 사용
    - `claude`: 공식 marketplace의 `github@claude-plugins-official` 설치
    - `gemini`: 번들된 로컬 extension 소스 사용
  - `vercel`
    - `codex`: 번들된 로컬 plugin 소스 사용
    - `claude`: 공식 marketplace의 `vercel@claude-plugins-official` 설치
    - `gemini`: 번들된 로컬 extension 소스 사용

### 이유
- Codex용 plugin 원본은 현재 저장소에 이미 있으므로 npm 패키지에 번들하기 쉽다.
- Claude는 공식 marketplace가 이미 존재하므로, 원본을 중복 패키징하기보다 공식 CLI를 호출하는 편이 더 안정적이다.
- Gemini는 공식 extension CLI와 manifest 계약이 있으므로, gemini-native extension 번들을 함께 배포하면 충분히 지원 가능하다.
- 다만 GitHub integration은 Codex의 `.app.json` 커넥터를 그대로 재사용할 수 없으므로, Gemini용은 CLI-first extension으로 별도 준비해야 한다.

## 4. 핵심 설계

### 4.1 설치 전략 요약

| 타깃 | 전략명 | 구현 방식 |
| --- | --- | --- |
| `codex` | `local-marketplace-provision` | plugin 디렉터리 복사 + marketplace.json 병합 |
| `claude` | `official-marketplace-install` | `claude plugin install` / `uninstall` 호출 |
| `gemini` | `local-extension-install` | `user`와 `project` 모두 home extension bundle을 사용하고, `project`는 workspace 활성화만 추가 |

### 4.2 공통 카탈로그 모델

`catalog.json` 예시:

```json
{
  "schemaVersion": 2,
  "integrations": [
    {
      "id": "github",
      "title": "GitHub",
      "description": "Shared GitHub integration bundle",
      "sourceDir": "plugins/github",
      "targets": ["codex", "claude", "gemini"],
      "enabledByDefault": true
    },
    {
      "id": "vercel",
      "title": "Vercel",
      "description": "Shared Vercel integration bundle",
      "sourceDir": "plugins/vercel",
      "targets": ["codex", "claude", "gemini"],
      "enabledByDefault": true
    }
  ]
}
```

### 4.3 저장소 구조 제안

```text
agent-plugins-installer/
├── docs/
│   └── IMPLEMENTATION_PLAN.md
├── extensions/
│   └── gemini/
│       ├── github/
│       └── vercel/
├── plugins/
│   └── codex/
│       ├── github/
│       └── vercel/
├── src/
│   ├── cli.js
│   └── lib/
│       ├── catalog.js
│       ├── install.js
│       ├── manage.js
│       ├── interactive.js
│       ├── targets/
│       │   ├── codex.js
│       │   ├── claude.js
│       │   └── gemini.js
│       ├── state.js
│       ├── utils.js
│       └── errors.js
├── catalog.json
├── package.json
└── README.md
```

### 4.4 기존 자산 정리 방향
- 현재 루트의 `codex-github-plugin/`, `codex-vercel-plugin/`는 패키지 번들 소스로 재배치한다.
- 권장 이동 경로:
  - `codex-github-plugin` -> `plugins/github`
  - `codex-vercel-plugin` -> `plugins/vercel`
- Gemini용 manifest와 Claude/Codex용 manifest는 공용 plugin 디렉터리 아래 `targets/<agent>/` overlay로 둔다.
- `codex/`, `claude/` 문서 폴더는 초기 설계 참고 자료로 유지한다.

## 5. 타깃별 설치 로직

### 5.1 Codex

#### 설치 루트
- `user` scope
  - marketplace: `~/.agents/plugins/marketplace.json`
  - plugin source copy root: `~/.codex/plugins/<plugin-id>`
- `project` scope
  - marketplace: `<cwd>/.agents/plugins/marketplace.json`
  - plugin source copy root: `<cwd>/.codex/plugins/<plugin-id>`

#### 설치 흐름
1. 카탈로그에서 선택된 plugin의 Codex sourceDir를 찾는다.
2. 대상 plugin 루트에 번들 plugin 디렉터리를 복사한다.
3. marketplace.json을 생성하거나 병합한다.
4. plugin entry의 `source.path`를 `./.codex/plugins/<plugin-id>`로 기록한다.
5. 결과 요약에 “Codex 재시작 후 Plugin Directory에서 설치/활성화 필요”를 출력한다.

#### marketplace entry 예시

```json
{
  "name": "agent-plugins-installer",
  "interface": {
    "displayName": "Agent Plugins Installer"
  },
  "plugins": [
    {
      "name": "github",
      "source": {
        "source": "local",
        "path": "./.codex/plugins/github"
      },
      "policy": {
        "installation": "AVAILABLE",
        "authentication": "ON_INSTALL"
      },
      "category": "Coding"
    }
  ]
}
```

#### Codex v1 정책
- `~/.codex/plugins/cache`를 직접 수정하지 않는다.
- `~/.codex/config.toml`를 직접 수정하지 않는다.
- 즉, v1의 Codex는 “설치 가능한 상태까지 준비”가 목표다.

### 5.2 Claude

#### 설치 루트 개념
- 실제 plugin 파일 위치는 Claude가 관리한다.
- 우리 도구는 공식 CLI를 호출해 설치를 오케스트레이션한다.
- scope는 v1에서 `user`, `project`만 지원한다.

#### 설치 흐름
1. `claude` 실행 파일 존재 여부를 확인한다.
2. 필요 시 `claude --version`으로 plugin 지원 버전인지 검사한다.
3. 선택된 plugin마다 아래 명령을 실행한다.

```bash
claude plugin install github@claude-plugins-official --scope user
claude plugin install vercel@claude-plugins-official --scope project
```

4. 결과 요약에 `/reload-plugins` 또는 재시작 안내를 포함한다.

#### Claude v1 정책
- Claude 내부 캐시나 설정 파일을 직접 수정하지 않는다.
- 공식 CLI와 공식 marketplace를 우선 사용한다.
- `project` scope는 공식 CLI에 위임한다.

### 5.3 Gemini

#### 설치 루트 개념
- Gemini CLI는 extension을 `<home>/.gemini/extensions`에서 로드한다.
- 설치는 로컬 경로 또는 GitHub URL을 받아 CLI가 내부적으로 복사한다.
- 따라서 우리 도구는 설치 디렉터리를 직접 조작하기보다 공식 `gemini extensions` 명령을 호출한다.

#### 설치 흐름
1. `gemini` 실행 파일 존재 여부를 확인한다.
2. 필요 시 `gemini --version` 또는 `gemini extensions --help`로 extension 명령 지원 여부를 확인한다.
3. 선택된 integration마다 번들된 Gemini extension 소스 경로를 찾는다.
4. 아래 명령으로 설치한다.

```bash
gemini extensions install /path/to/plugins/github --consent
gemini extensions install /path/to/plugins/vercel --consent
```

5. 결과 요약에 “Gemini CLI 재시작 필요”를 출력한다.

#### Gemini용 integration 설계
- `vercel`
  - `gemini-extension.json`에 MCP 설정과 context file, skills 디렉터리를 포함한다.
  - Codex vercel plugin의 재사용 가능 자산을 최대한 활용한다.
- `github`
  - Gemini에는 Codex의 GitHub app connector 개념이 없으므로 `.app.json`을 쓸 수 없다.
  - 따라서 Gemini용 GitHub integration은 `gh` CLI와 로컬 git 중심의 skill 집합으로 다시 구성한다.
  - 즉, 이름은 같지만 Codex/Claude와 기능 계약이 완전히 동일하다고 가정하지 않는다.

#### Gemini v1 정책
- v1 공식 지원 scope는 `user`다.
- Gemini 문서상 enable/disable은 `user` 또는 `workspace` scope를 지원하지만, 설치 자체는 글로벌 extension 저장소를 기준으로 동작한다.
- 따라서 `project` 또는 `workspace` 범위 제어는 v2 고도화 대상으로 분리한다.

## 6. CLI 설계

### 6.1 권장 기본 진입점

```bash
npx agent-plugins-installer
```

TTY 환경이면 대화형 설치를 시작한다.

### 6.2 v1 직접 CLI

```bash
npx agent-plugins-installer install <codex|claude|gemini|all> [--scope user|project] [--cwd <path>] [--dry-run] [--force] [--plugins <github,vercel>]
npx agent-plugins-installer list <codex|claude|gemini|all> [--scope user|project] [--cwd <path>]
npx agent-plugins-installer remove <codex|claude|gemini|all> [--scope user|project] [--cwd <path>] [--plugins <github,vercel>] [--dry-run]
```

추가 정책:
- `gemini --scope project`는 v1에서 usage error로 처리한다.
- `all --scope project`는 `gemini`를 건너뛰고 경고를 출력하거나, 명시적 실패 정책 중 하나를 선택해야 한다.
- 권장안은 `all --scope project` 시 `gemini`를 `skipped`로 보고 최종 종료 코드는 성공으로 두는 것이다.

### 6.3 v2 후보 CLI

```bash
npx agent-plugins-installer update <codex|claude|gemini|all> [--scope user|project]
npx agent-plugins-installer doctor [--target codex|claude|gemini|all]
npx agent-plugins-installer enable gemini --scope project --plugins <github,vercel>
```

### 6.4 대화형 설치 흐름
1. 타깃 선택
   - `codex`, `claude`, `gemini`, `all`
2. scope 선택
   - `user`, `project`
3. integration 선택
   - `github`, `vercel`
4. 설치 방식 안내
   - Codex: marketplace provisioning
   - Claude: official marketplace install
   - Gemini: official extension CLI install
5. 확인 후 실행

## 7. 상태 관리와 안전 모델

### 공통 안전 원칙
- 소유권 마커를 사용한다.
- `--force`는 우리 도구가 관리하는 항목에만 허용한다.
- 원자적 복사와 잠금 파일을 사용한다.
- `dry-run`에서는 외부 명령과 파일 변경을 모두 수행하지 않는다.

### 상태 파일 제안
- Codex plugin 루트: `.agent-plugins-installer.json`
- marketplace 루트: `.agent-plugins-installer-state.json`
- Claude scope 루트:
  - user: `~/.claude/.agent-plugins-installer.json`
  - project: `<cwd>/.claude/.agent-plugins-installer.json`
- Gemini scope 루트:
  - user: `~/.gemini/.agent-plugins-installer.json`

### 마커 예시

```json
{
  "schemaVersion": 1,
  "packageName": "agent-plugins-installer",
  "packageVersion": "0.1.0",
  "target": "codex",
  "pluginId": "github",
  "scope": "user",
  "installedAt": "2026-03-29T08:00:00.000Z"
}
```

## 8. 명령별 기대 동작

### install
- Codex:
  - plugin source 복사
  - marketplace entry 생성/병합
- Claude:
  - 공식 CLI 호출
- Gemini:
  - 공식 extension CLI 호출

### list
- Codex:
  - 우리가 관리하는 plugin 디렉터리와 marketplace entry를 확인
- Claude:
  - 우선 우리 state 파일 기준으로 보고
  - 가능하면 `claude` CLI 기반 검증을 추가한다
- Gemini:
  - 우선 우리 state 파일 기준으로 보고
  - 가능하면 `~/.gemini/extensions/<name>/gemini-extension.json` 존재 여부로 검증한다

### remove
- Codex:
  - 관리 중인 plugin 디렉터리 삭제
  - marketplace entry 제거
- Claude:
  - `claude plugin uninstall <name>@claude-plugins-official --scope ...`
- Gemini:
  - `gemini extensions uninstall <name>`

## 9. 테스트 전략

### 단위 테스트
- 카탈로그 스키마 검증
- scope별 경로 계산
- marketplace JSON 병합/삭제
- `--plugins` 파싱
- 상태 마커 유효성 검증
- Gemini extension source 유효성 검증 (`gemini-extension.json` 존재, name 일치)

### 통합 테스트
- 임시 디렉터리 기준 Codex `user/project` 설치
- marketplace file 신규 생성과 기존 파일 병합
- `remove` 이후 잔여 상태 검증
- Claude CLI는 mock executable로 성공/실패 케이스 검증
- Gemini CLI는 mock executable로 install/uninstall 성공/실패 케이스 검증

### 수동 검증
- Codex:
  - 설치 후 재시작
  - Plugin Directory에서 `github`, `vercel` 노출 확인
- Claude:
  - 설치 후 `/reload-plugins`
  - 해당 plugin command 혹은 capability 노출 확인
- Gemini:
  - 설치 후 CLI 재시작
  - `/extensions list` 또는 실제 task 호출로 extension 로드 확인

## 10. 단계별 구현 계획

### Phase 1
- 패키지 스캐폴드 생성
- `package.json`, `src/cli.js`, `catalog.json` 구성
- 번들 Codex plugin 자산 재배치

### Phase 2
- Codex 설치 전략 구현
- marketplace 생성/병합/제거 로직 구현
- `install`, `list`, `remove` 기본 동작 구현

### Phase 3
- Claude 설치 전략 구현
- `claude` 실행 파일 검사와 외부 명령 래퍼 구현
- dry-run 및 오류 메시지 정리

### Phase 4
- Gemini extension 번들 구성
- `gemini extensions install/uninstall` 래퍼 구현
- GitHub Gemini extension의 CLI-first 스킬 초안 작성
- dry-run 및 오류 메시지 정리

### Phase 5
- 대화형 설치 마법사 구현
- 테스트 보강
- README 정리
- npm publish 준비

## 11. 복잡도

### 조건 정리
- `n`: 카탈로그에 등록된 integration 수
- `p`: 선택된 integration 수
- `m`: 기존 marketplace entry 수
- `Bc`: 선택된 Codex plugin 전체 파일 크기 합
- `Bg`: 선택된 Gemini extension 전체 파일 크기 합

### 복잡도 계산
- 카탈로그 로드/필터링: 시간 `O(n)`, 공간 `O(n)`
- Codex marketplace 병합: 시간 `O(m + p)`, 공간 `O(m)`
- Codex plugin 복사: 시간 `O(Bc)`, 추가 공간 `O(Bc)`  
  스테이징 복사를 쓰면 디스크 임시 공간이 plugin 크기와 비례한다.
- Claude 설치 오케스트레이션: 로컬 기준 시간 `O(p)`, 공간 `O(1)`  
  실제 전체 시간은 CLI 실행과 네트워크 상태에 의존한다.
- Gemini extension 설치: 시간 `O(Bg + p)`, 공간 `O(Bg)`  
  설치 명령은 로컬 번들 extension을 Gemini 관리 디렉터리로 복사한다.
- `all` 설치 총합: 시간 `O(n + m + p + Bc + Bg)`, 공간 `O(n + m + Bc + Bg)`

## 12. 주의사항

> - Codex는 문서상 marketplace 기반 흐름이 핵심이므로, v1에서 내부 캐시나 활성 상태 파일을 직접 조작하지 않는 것이 안전하다.
> - Claude plugin 설치 성공 여부는 공식 marketplace 가용성과 사용자의 로컬 `claude` 설치 상태에 영향을 받는다.
> - Gemini는 공식적으로 extension을 지원하지만, Codex/Claude의 plugin과 계약이 다르므로 gemini-native 번들을 별도로 관리해야 한다.
> - 특히 GitHub integration은 Gemini에서 Codex의 GitHub app connector를 그대로 재사용할 수 없으므로, 기능을 CLI-first로 재설계해야 한다.
> - Codex와 Claude 모두 실행 중일 때 신규 plugin 반영을 위해 재시작 또는 reload가 필요할 수 있다.
> - Gemini도 extension 관리 작업 후 CLI 재시작이 필요하다.

## 13. 대안

### 대안 1. 모든 타깃을 로컬 번들 복사 기반으로 통일
- 장점:
  - 네트워크나 외부 CLI 의존성이 적다.
  - 설치 로직을 한쪽으로 맞추기 쉽다.
- 단점:
  - Claude 공식 marketplace와 어긋난다.
  - 타깃별 원본을 직접 계속 관리해야 하므로 유지보수 비용이 커진다.
  - 공식 배포 흐름과 버전 동기화가 어렵다.

### 대안 2. 내부 캐시/설정 파일을 직접 수정해 완전 자동 설치
- 장점:
  - 사용자 입장에서는 가장 자동화된 경험이 된다.
  - Codex도 UI 개입 없이 “설치된 상태”까지 만들 가능성이 있다.
- 단점:
  - 문서화되지 않은 내부 구현에 강하게 결합된다.
  - 버전 변경에 매우 취약하다.
  - 실패 시 복구가 어렵고 사용자 신뢰를 잃기 쉽다.

### 대안 3. Codex/Claude만 v1에 포함하고 Gemini는 연기
- 장점:
  - 초기 구현 범위가 가장 작다.
  - GitHub Gemini 설계 난도를 뒤로 미룰 수 있다.
- 단점:
  - 사용자 기대와 어긋난다.
  - 나중에 카탈로그와 CLI 표면을 다시 흔들어야 한다.

### 대안 4. 하이브리드 3타깃 전략 사용
- 장점:
  - 공식 문서와 실제 제품 동작에 가장 잘 맞는다.
  - Codex, Claude, Gemini의 차이를 무리하게 숨기지 않으면서도 UX는 통일할 수 있다.
  - v1을 가장 빠르게 안정화할 수 있다.
- 단점:
  - 타깃별 구현 코드가 조금 더 분기된다.
  - Gemini용 GitHub integration은 별도 자산 작성이 필요하다.
  - Codex는 v1에서 완전 자동 설치가 아니라 “설치 준비”에 가깝다.

### 선택
- v1은 `대안 4`를 채택한다.

## 14. 배포 계획

### 패키지 메타데이터
- 패키지명: `agent-plugins-installer`
- Node 요구 버전: `>=20`
- 공개 배포: npm public

### 포함 파일
- `src/`
- `catalog.json`
- `plugins/github/**`
- `plugins/vercel/**`
- `README.md`
- `LICENSE`
- `CHANGELOG.md`

### 릴리스 기준
- macOS, Linux에서 smoke test 통과
- Codex user/project provisioning 확인
- Claude user/project install mock test 통과
- Gemini user install mock test 통과
- Gemini용 `github`, `vercel` extension manifest 검증 통과
- README의 quick start 예제 검증

## 15. 참고 자료

### 저장소 내 참고 문서
- `codex/plugin overview.md`
- `claude/Create plugins.md`
- `claude/Discover and install prebuilt plugins through marketplaces.md`

### 외부 공식 문서
- Gemini CLI Extensions 개요: [https://geminicli.com/docs/extensions/](https://geminicli.com/docs/extensions/)
- Gemini CLI Extensions 레퍼런스: [https://geminicli.com/docs/extensions/reference/](https://geminicli.com/docs/extensions/reference/)
- Codex Plugins 개요: [https://developers.openai.com/codex/plugins](https://developers.openai.com/codex/plugins)
- Claude Code Plugins 개요/설치: [https://code.claude.com/docs/en/discover-plugins](https://code.claude.com/docs/en/discover-plugins)
- Claude Code Plugins 제작: [https://code.claude.com/docs/en/plugins](https://code.claude.com/docs/en/plugins)
