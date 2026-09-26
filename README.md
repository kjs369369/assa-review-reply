# 앗싸, 답글!

짧은 고객 리뷰에 80자 이내 답글 3종을 만드는 무료 학습·실습 도구입니다. 회원가입이나 이용코드 없이 사용할 수 있습니다.

- 공개 앱: https://kjs369369.github.io/assa-review-reply/
- 도서 안내 포함: https://kjs369369.github.io/assa-review-reply/?channel=book
- 저장소: https://github.com/kjs369369/assa-review-reply

## 무엇을 하나요?

리뷰 유형(만족·담담함·아쉬움), 실제 주문 메뉴, 말투를 고르면 준비된 답글 문장을 조합합니다. 답글 3개를 복사하거나 다른 표현 묶음을 선택할 수 있습니다. 메뉴 미입력 시 메뉴명을 추측하지 않고, 아쉬운 리뷰에는 재방문 권유 대신 공감·확인 표현을 사용합니다.

생성형 AI가 원문을 해석하지 않습니다. 같은 유형·메뉴·말투는 같은 결과 묶음을 만듭니다. 원문에 맞춰 더 다듬고 싶으면 AI 요청문을 복사해 본인이 사용하는 AI 서비스에 붙여 넣을 수 있습니다.

공개 앱은 브라우저 안에서만 처리합니다. 입력 리뷰와 결과를 서버나 외부 AI로 전송·저장하지 않으며 쿠키·분석 도구도 사용하지 않습니다. GitHub Pages가 페이지를 전달하는 일반적인 접속 처리는 별개입니다.

## 로컬 실행

Node.js 22 이상. npm 런타임 의존성 없음.

```sh
npm test
npm run build
npm run verify:build
npm run start:built
```

미리보기: http://127.0.0.1:4317/assa-review-reply/

## 수정 위치

| 파일 | 용도 |
|---|---|
| `src/replies.mjs` | 답글 문구, 80자 검증, AI 요청문 |
| `src/config.mjs` | 도서 정보, 구매 URL, 채널별 안내 |
| `public/index.html` | 감사 인사, 사용법, 입력·결과·푸터 |
| `public/styles.css` | 차콜·화이트·레드 디자인 |
| `public/app.js` | 브라우저 안의 생성·복사 |
| `site.config.json` | 공개 주소와 OG 문구 |
| `public/og-image.png` | 1200×630 공유 이미지 |
| `scripts/build.mjs` | 하위 경로·OG 태그·공개 파일 생성 |
| `.github/workflows/pages.yml` | 검사·빌드·GitHub Pages 배포 |

## 도서 구매 링크가 나오면

사용자 요청으로 후속 작업을 기록했습니다. `src/config.mjs`의 `BOOK.purchaseUrl`에 **확인된 실제 HTTPS 구매 주소**를 입력하면 푸터의 ‘도서 구매 안내’가 표시됩니다. 값이 비어 있거나 잘못된 주소이면 버튼은 숨깁니다. 가짜 구매 URL이나 임의의 출간일은 넣지 않습니다. 변경 후 테스트·빌드·푸시하고 실제 링크를 확인합니다.

도서: 《앗싸 나도 되네! 오늘부터 바로 써먹는 AI 검색 GEO마케팅 – 기초편》

부제: AI가 나를 말하게 하는 100가지 활용법

## 배포와 비용

`main`에 푸시하면 GitHub Actions가 검사 후 `dist/public`만 GitHub Pages에 배포합니다. 공개 저장소의 무료 Pages·표준 Actions 실행을 사용하며 유료 AI·서버·도메인 구매는 없습니다. GitHub Pages의 사용량 정책은 적용됩니다.

이 서비스는 공개 학습 도구이며 결제·유료 SaaS 기능은 없습니다. 향후 판매·유료 서비스 중심으로 확장한다면 GitHub Pages의 상업용 호스팅 제한을 검토하고 적합한 배포처로 이전합니다.

OG 검증은 원본 파일뿐 아니라 실제 배포 HTML의 canonical·og:url·og:image 및 공개 PNG 응답까지 수행합니다. SNS별 미리보기 캐시 갱신 시점은 다를 수 있습니다.

## 개발 이력

최초 Node 서버와 앱별 코드 인증 모듈(`src/server.mjs`, `src/auth.mjs`, `src/limits.mjs`)은 향후 보호 앱 개발 참고용으로 보존했습니다. 이 서버·인증 코드는 **현재 공개 앱에 배포하지 않습니다**. 공개 앱은 `src/replies.mjs`와 비밀값 없는 `src/config.mjs`만 공유합니다. 기존 `.env.local`은 로컬에만 보존하며 커밋·배포 대상이 아닙니다.

보안 점검: [docs/SECURITY-REVIEW.md](docs/SECURITY-REVIEW.md)

AICLab · AI콘텐츠융합연구소 · 대표 김진수 · info@aiclab2020.com
