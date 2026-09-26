// Public presentation settings only. Never place private app codes here.
export function createApps(env) {
  return new Map([['review-reply', {
    id: 'review-reply', name: '앗싸, 답글!', access: 'public',
    channels: {
      book: { label: '도서 독자를 위한 실습 도구', title: '한 번의 답글에서, 꾸준한 고객 소통으로', body: '기초편에서 짧은 답글을 직접 만들어 보세요. 심화편 안내는 내용이 확정되면 이곳에서 전해 드립니다.' },
      class: { label: '강의에서 함께 쓰는 실습 도구', title: '내 가게의 리뷰로 한 번 더 연습해 보세요', body: '말투와 리뷰 유형을 바꾸어 보고, 실제로 사용할 답글을 골라 보세요.' },
      event: { label: '직접 써 보는 리뷰 답글 도구', title: '짧고 자연스러운 답글부터 시작하세요', body: '결과를 복사한 뒤, 고객의 리뷰와 맞는지 한 번 더 읽어 주세요.' },
      general: { label: '짧은 리뷰에 정성을 담는 도구', title: '짧은 리뷰일수록, 짧고 자연스럽게', body: '고객이 전한 이야기에 맞는 답글을 골라 직접 확인하고 사용하세요.' }
    }
  }]]);
}
export const BOOK = {
  title: '《앗싸 나도 되네! 오늘부터 바로 써먹는 AI 검색 GEO마케팅 – 기초편》',
  subtitle: 'AI가 나를 말하게 하는 100가지 활용법',
  // Add the real bookstore URL when supplied. Empty means no purchase button.
  purchaseUrl: ''
};

export function purchaseLink(value = BOOK.purchaseUrl) {
  if (!value) return null;
  try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password ? url.href : null; }
  catch { return null; }
}
export function getAppState(requestedChannel) {
  const app = createApps({}).get('review-reply');
  const channel = Object.hasOwn(app.channels, requestedChannel) ? requestedChannel : 'general';
  return { accessible: true, access: 'public', guide: app.channels[channel], book: channel === 'book' ? BOOK : null, channel };
}
