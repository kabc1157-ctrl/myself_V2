# V2 안정화 개발 규칙

- 한 번에 한 단계만 구현한다.
- 다른 단계의 기능을 임의로 수정하지 않는다.
- 단계별 완료 기준을 반드시 확인한다.
- 원본 요구사항을 누락하거나 축소하지 않는다.
- 실제 데이터 저장·조회 결과를 확인한다.
- 실패 원인을 숨기지 않는다.
- 이음새 V1 코드·DB·OAuth는 수정하지 않는다.
- V2 Supabase 기존 데이터는 보호하고 파괴적 SQL을 사용하지 않는다.
- `docs/09-design-system.md`와 공통 record-kit을 준수한다.
- lint/typecheck/test/build와 브라우저 검증을 구분한다.
- 미검증을 PASS 또는 완료로 보고하지 않는다.
- 단계 완료 시 `docs/15-v2-stabilization-progress.md`를 갱신한다.
