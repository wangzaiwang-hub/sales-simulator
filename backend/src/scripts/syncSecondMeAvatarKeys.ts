import 'dotenv/config';
import { order, selectMany, updateRows, eq } from '../lib/supabase';
import { syncSecondMeAvatarApiKey } from '../lib/secondmeAvatar';

type UserRow = {
  id: string;
  username: string;
  secondmeId: string;
  secondmeAccessToken?: string | null;
  secondmeApiKey?: string | null;
};

async function main() {
  const users = await selectMany<UserRow>('User', {
    select: 'id,username,secondmeId,secondmeAccessToken,secondmeApiKey',
    secondmeAccessToken: 'not.is.null',
    secondmeApiKey: 'is.null',
    order: order('updatedAt', false),
  });

  if (!users.length) {
    console.log('No users need avatar api key sync.');
    return;
  }

  let synced = 0;
  let skipped = 0;

  for (const user of users) {
    if (!user.secondmeAccessToken) {
      skipped += 1;
      continue;
    }

    try {
      const avatar = await syncSecondMeAvatarApiKey(user.secondmeAccessToken);
      if (!avatar.secretKey) {
        skipped += 1;
        console.log(`[skip] ${user.username} (${user.secondmeId}) has no available avatar key to store.`);
        continue;
      }

      await updateRows<UserRow>('User', { ...eq('id', user.id) }, { secondmeApiKey: avatar.secretKey });
      synced += 1;
      console.log(`[ok] ${user.username} (${user.secondmeId}) avatar api key synced.`);
    } catch (error) {
      skipped += 1;
      console.log(
        `[skip] ${user.username} (${user.secondmeId}) sync failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  console.log(`Done. synced=${synced} skipped=${skipped}`);
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
