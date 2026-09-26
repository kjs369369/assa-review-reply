# 배포와 후속 운영

- 앱: 앗싸, 답글!
- 로컬 폴더: 기존 review-reply-gift 유지
- GitHub 저장소: kjs369369/assa-review-reply (공개)
- 배포처: GitHub Pages
- 공개 URL: https://kjs369369.github.io/assa-review-reply/
- 도서 QR 대상: https://kjs369369.github.io/assa-review-reply/?channel=book
- 배포 범위: dist/public 정적 파일만
- 시작 브랜치: main
- 자동 배포: .github/workflows/pages.yml

## 공개 전 검사

자동 테스트 10개(72가지 문장 조합 포함), 빌드 검사, 브라우저 생성 동작을 확인했다. 빌드 검사에는 OG·canonical·이미지 실제 크기·하위 경로·비밀 파일 제외·클라이언트의 외부 요청 부재를 포함한다. 런타임 의존성은 없다. Actions는 공식 액션의 조회된 커밋 SHA로 고정했다.

## 도서 구매 링크

실제 링크가 나오면 `src/config.mjs`의 `BOOK.purchaseUrl`에 입력한다. HTTPS만 허용하며 값이 없으면 구매 버튼이 나타나지 않는다. 사용자 요청으로 별도 기억에도 남겼다.

## 후속 배포

파일 수정 → npm test → npm run build → npm run verify:build → 필요한 경로만 git add → commit → push. Actions의 성공 상태와 실제 공개 화면을 모두 확인한다.

## 참고

- https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages
- https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits

출판에 인쇄할 때는 단축 URL보다 관리 가능한 고정 URL을 사용하고, 실제 인쇄 크기로 QR을 읽어 검증한다. 추후 배포처를 옮기면 인쇄 주소의 호환성을 먼저 검토한다.
