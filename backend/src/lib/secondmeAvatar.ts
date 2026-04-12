import { secondMeJsonRequest } from './secondmeHttp';

const SECONDME_BASE_URL = 'https://api.mindverse.com/gate/lab';

type AvatarSummary = {
  avatarId: number;
  type?: string;
  title?: string;
  modes?: {
    textChat?: boolean;
    voiceCall?: boolean;
  };
  distribution?: {
    apiEnabled?: boolean;
    wxappEnabled?: boolean;
  };
};

type AvatarListResponse = {
  code?: number;
  message?: string;
  subCode?: string;
  data?: {
    total?: number;
    list?: AvatarSummary[];
  };
};

type AvatarApiKeyCreateResponse = {
  code?: number;
  message?: string;
  subCode?: string;
  data?: {
    keyId?: number;
    avatarId?: number;
    name?: string;
    secretKey?: string;
    enabled?: boolean;
  };
};

export type SyncedAvatarApiKey = {
  avatarId: number | null;
  avatarTitle?: string | null;
  secretKey: string | null;
};

function choosePreferredAvatar(avatars: AvatarSummary[]) {
  return (
    avatars.find((avatar) => avatar.type === 'primary') ||
    avatars.find((avatar) => avatar.distribution?.apiEnabled && avatar.modes?.textChat !== false) ||
    avatars.find((avatar) => avatar.modes?.textChat !== false) ||
    avatars[0] ||
    null
  );
}

export async function syncSecondMeAvatarApiKey(accessToken: string): Promise<SyncedAvatarApiKey> {
  const listResponse = await secondMeJsonRequest<AvatarListResponse>({
    url: `${SECONDME_BASE_URL}/api/secondme/avatar/list?pageNo=1&pageSize=20`,
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const listPayload = listResponse.data || {};

  if (!listResponse.ok || listPayload.code !== 0) {
    throw new Error(listPayload.message || listPayload.subCode || 'Failed to load SecondMe avatars');
  }

  const avatar = choosePreferredAvatar(listPayload.data?.list || []);

  if (!avatar) {
    return {
      avatarId: null,
      avatarTitle: null,
      secretKey: null,
    };
  }

  const createResponse = await secondMeJsonRequest<AvatarApiKeyCreateResponse>({
    url: `${SECONDME_BASE_URL}/api/secondme/avatar/api-key/create`,
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      avatarId: avatar.avatarId,
      name: '销售模拟器 NPC',
    }),
  });

  const createPayload = createResponse.data || {};

  if (!createResponse.ok || createPayload.code !== 0) {
    throw new Error(createPayload.message || createPayload.subCode || 'Failed to create SecondMe avatar api key');
  }

  return {
    avatarId: avatar.avatarId,
    avatarTitle: avatar.title || null,
    secretKey: createPayload.data?.secretKey || null,
  };
}
