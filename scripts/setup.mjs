import { randomBytes } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
const code = `REPLY-${randomBytes(5).toString('hex').toUpperCase()}`;
try {
  await writeFile(new URL('../.env.local', import.meta.url), `APP_CODE=${code}\nSESSION_SECRET=${randomBytes(32).toString('hex')}\nPORT=4317\nPUBLIC_ORIGIN=http://127.0.0.1:4317\n`, { flag: 'wx', mode: 0o600 });
  console.log(`로컬 설정 생성 완료. 리뷰 앱 이용코드: ${code}`);
} catch (error) {
  if (error.code !== 'EEXIST') throw error;
  console.log('기존 설정을 유지했습니다. 이용코드는 .env.local에서 확인하세요.');
}
