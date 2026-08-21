D1 공유 저장 테스트본 (전체v8 기반)

1. Cloudflare Pages 프로젝트 Settings > Bindings에서 D1 binding을 추가합니다.
   Variable name: DB
   Database: lemon-cozybook-db

2. 이 폴더 구조를 그대로 Git 프로젝트 루트에 붙여넣습니다.
   특히 functions/api/guild-state.js 파일이 반드시 포함되어야 합니다.

3. Commit & Push 후 새 배포가 완료될 때까지 기다립니다.

4. 기존 체크 데이터가 들어있는 크롬에서 page2.html을 먼저 엽니다.
   D1이 비어 있으면 현재 브라우저의 길드원/체크 데이터를 최초 공용 상태로 저장합니다.

5. 다른 크롬/기기에서 같은 page2.html을 열어 길드원 목록과 체크 상태가 공유되는지 확인합니다.

공유 대상: guild_members, guild_checks
기존 localStorage는 오프라인/오류 시 보조 저장소로 유지됩니다.
