import { generateReplies, lengthOf } from './engine/replies.mjs';
import { getAppState, purchaseLink } from './engine/config.mjs';
const $ = id => document.getElementById(id);
const channel = new URL(location.href).searchParams.get('channel') || 'general';
document.querySelector('.brand').href = `./?channel=${encodeURIComponent(channel)}`;
let currentResult = null;
let variant = 0;
let dirty = false;
let busy = false;

function markDirty() {
  $('review-count').textContent = `${lengthOf($('review').value)} / 500자`;
  if (!currentResult) return;
  dirty = true; $('stale-notice').hidden = false; $('regenerate').disabled = true;
  $('next-step').hidden = true;
  document.querySelectorAll('.copy-button, #copy-prompt').forEach(button => button.disabled = true);
}
async function copyText(text, button, fallback) {
  const original = button.textContent;
  try {
    await navigator.clipboard.writeText(text);
    button.textContent = '복사했어요 ✓'; $('copy-status').textContent = '복사했습니다. 답글을 올리기 전에 한 번 더 확인해 주세요.';
    setTimeout(() => { button.textContent = original; }, 1800);
  } catch {
    fallback.value = text; fallback.hidden = false; fallback.focus(); fallback.select();
    $('copy-status').textContent = '자동 복사가 제한되어 있어요. 선택된 글을 직접 복사해 주세요.';
  }
}
function renderResult(result) {
  currentResult = result; dirty = false; $('reply-list').replaceChildren();
  for (const [index, reply] of result.replies.entries()) {
    const article = document.createElement('article'); article.className = 'reply-item';
    const top = document.createElement('div'); top.className = 'reply-top';
    const label = document.createElement('h3'); label.className = 'reply-label'; label.textContent = reply.label;
    const count = document.createElement('span'); count.className = 'reply-count'; count.textContent = `${reply.length} / 80자`;
    top.append(label, count);
    const text = document.createElement('p'); text.className = 'reply-text'; text.textContent = reply.text;
    const button = document.createElement('button'); button.className = 'copy-button'; button.type = 'button'; button.textContent = '답글 복사'; button.setAttribute('aria-label', `${reply.label} 답글 복사`);
    const fallback = document.createElement('textarea'); fallback.className = 'copy-fallback'; fallback.readOnly = true; fallback.hidden = true; fallback.setAttribute('aria-label', `${index + 1}번 답글 직접 복사`);
    button.addEventListener('click', () => copyText(reply.text, button, fallback));
    article.append(top, text, button, fallback); $('reply-list').append(article);
  }
  $('result-note').textContent = result.replies[1].label === '식사 언급형' ? '메뉴를 입력하지 않아 식사에 대한 표현으로 바꿨어요.' : (result.replies[0].label === '의견에 감사' ? '아쉬운 리뷰에는 다음 방문 권유 대신 공감과 확인을 담았어요.' : '실제 주문 메뉴가 맞는지 확인하고 사용해 주세요.');
  $('variant-label').textContent = `${variant + 1} / 3`;
  $('empty-state').hidden = true; $('results').hidden = false; $('stale-notice').hidden = true;
  $('next-step').hidden = false; $('regenerate').disabled = false; $('copy-prompt').disabled = false; $('copy-status').textContent = '';
  $('prompt-fallback').value = ''; $('prompt-fallback').hidden = true;
  $('output-title').focus({ preventScroll: true });
  if (matchMedia('(max-width: 680px)').matches) $('output-title').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
}
async function generate(nextVariant) {
  if (busy) return;
  const form = $('reply-form');
  if (!form.reportValidity()) return;
  const data = new FormData(form);
  if (!$('review').value.trim() || lengthOf($('review').value.trim()) > 500) { $('form-error').textContent = '리뷰를 1~500자로 입력해 주세요.'; $('review').focus(); return; }
  if (lengthOf($('menu').value.trim()) > 20) { $('form-error').textContent = '메뉴를 20자 이내로 입력해 주세요.'; $('menu').focus(); return; }
  busy = true; $('form-error').textContent = ''; $('generate').disabled = true; $('regenerate').disabled = true;
  const controls = [...form.elements]; controls.forEach(element => element.disabled = true);
  try {
    const result = generateReplies({ review: data.get('review'), menu: data.get('menu'), sentiment: data.get('sentiment'), tone: data.get('tone'), variant: nextVariant });
    variant = nextVariant; renderResult(result);
  } catch (error) {
    $('form-error').textContent = error.message;
  } finally { busy = false; controls.forEach(element => element.disabled = false); $('regenerate').disabled = dirty; }
}
$('reply-form').addEventListener('submit', event => { event.preventDefault(); generate(0); });
$('reply-form').addEventListener('input', markDirty);
$('regenerate').addEventListener('click', () => { if (!dirty) generate((variant + 1) % 3); });
$('copy-prompt').addEventListener('click', () => { if (currentResult && !dirty) copyText(currentResult.prompt, $('copy-prompt'), $('prompt-fallback')); });
document.querySelectorAll('[data-example]').forEach(button => button.addEventListener('click', () => {
  const type = button.dataset.example;
  $('review').value = type === 'concern' ? '음식이 조금 식어서 아쉬웠어요.' : '잘 먹고 갑니다';
  document.querySelector(`input[name="sentiment"][value="${type}"]`).checked = true;
  markDirty(); $('review').focus();
}));

try {
  const state = getAppState(channel);
  const buyUrl = purchaseLink();
  if (buyUrl) { $('book-purchase').href = buyUrl; $('book-purchase').hidden = false; }
  $('workspace-label').textContent = state.guide.label;
  $('guide-title').textContent = state.guide.title; $('guide-body').textContent = state.guide.body;
  if (state.book) { $('book-info').textContent = `${state.book.title} · 부제: ${state.book.subtitle}`; $('book-info').hidden = false; }
  if (!state.accessible) throw new Error('App unavailable');
  $('boot-status').hidden = true; $('workspace').hidden = false;
} catch { $('boot-status').textContent = '앱에 연결하지 못했어요. 연결을 확인하고 새로고침해 주세요.'; }
