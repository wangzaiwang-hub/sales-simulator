import { Request, Response } from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import type { SignOptions } from 'jsonwebtoken';
import { URLSearchParams } from 'url';
import { eq, insertRows, selectOne, updateRows } from '../lib/supabase';
import { normalizeSecondMeProfile } from '../lib/secondmeProfile';
import { syncSecondMeAvatarApiKey } from '../lib/secondmeAvatar';
import { secondMeJsonRequest } from '../lib/secondmeHttp';

type UserRow = {
  id: string;
  secondmeId: string;
  username: string;
  email?: string | null;
  avatar?: string | null;
  profession?: string | null;
  interests?: string[] | string | null;
  personaSummary?: string | null;
  npcBehavior?: string | null;
  secondmeProfile?: Record<string, unknown> | null;
  isNpcVisible?: boolean | null;
  secondmeAccessToken?: string | null;
  secondmeApiKey?: string | null;
  secondmeTokenScope?: string | null;
  secondmeTokenExpiresAt?: string | null;
};

function resolveSecondMeId(profile: any) {
  return (
    profile?.id ||
    profile?.sub ||
    profile?.userId ||
    profile?.uid ||
    profile?.email ||
    (profile?.name ? `secondme:${profile.name}` : null)
  );
}

function resolveFrontendUrl(req: Request) {
  return process.env.FRONTEND_URL || `${req.protocol}://${req.get('host')}`;
}

function resolveBackendBaseUrl(req: Request) {
  return process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
}

export const authController = {
  async secondmeCallback(req: Request, res: Response) {
    try {
      const { code, state } = req.query;
      const frontendUrl = resolveFrontendUrl(req);
      
      if (!code || typeof code !== 'string') {
        return res.redirect(`${frontendUrl}/auth/login?error=no_code`);
      }

      const redirectUri =
        process.env.SECONDME_REDIRECT_URI ||
        `${resolveBackendBaseUrl(req)}/api/auth/callback`;
      
      const tokenParams = new URLSearchParams({
        client_id: process.env.SECONDME_CLIENT_ID || '',
        client_secret: process.env.SECONDME_CLIENT_SECRET || '',
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      });

      const tokenResponse = await secondMeJsonRequest<{
        code?: number;
        message?: string;
        data?: {
          accessToken?: string;
          expiresIn?: number | string;
          expires_in?: number | string;
          scope?: string;
        };
      }>({
        url: 'https://api.mindverse.com/gate/lab/api/oauth/token/code',
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: tokenParams.toString(),
        timeoutMs: 30000,
      });

      const accessToken = tokenResponse.data?.data?.accessToken;
      
      if (!tokenResponse.ok || !accessToken) {
        console.error('Token exchange failed:', tokenResponse.data);
        return res.redirect(`${frontendUrl}/auth/login?error=token_failed`);
      }

      // 跳转到前端并带上token
      return res.redirect(`${frontendUrl}/auth/callback?token=${accessToken}`);
    } catch (error) {
      console.error('OAuth callback error:', error);
      const frontendUrl = resolveFrontendUrl(req);
      return res.redirect(`${frontendUrl}/auth/login?error=callback_failed`);
    }
  },

  async secondmeLogin(req: Request, res: Response) {
    try {
      const { code, redirectUri: requestRedirectUri } = req.body;

      if (!code) {
        return res.status(400).json({ error: 'Authorization code is required' });
      }

      const redirectUri =
        (typeof requestRedirectUri === 'string' && requestRedirectUri.trim()) ||
        process.env.SECONDME_REDIRECT_URI ||
        `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/callback`;

      const tokenParams = new URLSearchParams({
        client_id: process.env.SECONDME_CLIENT_ID || '',
        client_secret: process.env.SECONDME_CLIENT_SECRET || '',
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      });

      const tokenResponse = await secondMeJsonRequest<{
        code?: number;
        message?: string;
        subCode?: string;
        data?: {
          accessToken?: string;
          expiresIn?: number | string;
          expires_in?: number | string;
          scope?: string;
        };
      }>({
        url: 'https://api.mindverse.com/gate/lab/api/oauth/token/code',
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: tokenParams.toString(),
        timeoutMs: 30000,
      });

      const accessToken = tokenResponse.data?.data?.accessToken;
      const expiresInSeconds = Number(
        tokenResponse.data?.data?.expiresIn || tokenResponse.data?.data?.expires_in || 0,
      );
      const scope = tokenResponse.data?.data?.scope || 'userinfo';
      const tokenExpiresAt = expiresInSeconds
        ? new Date(Date.now() + expiresInSeconds * 1000).toISOString()
        : null;

      if (!tokenResponse.ok || !accessToken) {
        console.error('SecondMe token response:', tokenResponse.data || tokenResponse.bodyText);
        return res.status(500).json({
          error: 'Failed to get access token',
          detail:
            process.env.NODE_ENV === 'development'
              ? tokenResponse.data || tokenResponse.bodyText
              : undefined,
        });
      }

      const userResponse = await secondMeJsonRequest<{
        code?: number;
        message?: string;
        subCode?: string;
        data?: any;
      }>({
        url: 'https://api.mindverse.com/gate/lab/api/secondme/user/info',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        timeoutMs: 30000,
      });

      const secondmeUser = userResponse.data?.data;
      const secondmeId = resolveSecondMeId(secondmeUser);
      const normalizedProfile = normalizeSecondMeProfile(secondmeUser || {});
      let syncedAvatarApiKey: string | null = null;
      let syncedAvatarId: number | null = null;
      let syncedAvatarTitle: string | null = null;

      try {
        const syncedAvatar = await syncSecondMeAvatarApiKey(accessToken);
        syncedAvatarApiKey = syncedAvatar.secretKey;
        syncedAvatarId = syncedAvatar.avatarId;
        syncedAvatarTitle = syncedAvatar.avatarTitle || null;
      } catch (error) {
        console.warn(
          'SecondMe avatar api key sync skipped:',
          error instanceof Error ? error.message : error,
        );
      }

      const nextSecondMeProfile = {
        ...normalizedProfile.secondmeProfile,
        ...(syncedAvatarId ? { avatarId: syncedAvatarId } : {}),
        ...(syncedAvatarTitle ? { avatarTitle: syncedAvatarTitle } : {}),
      };

      if (!userResponse.ok || !secondmeUser || !secondmeId) {
        console.error('SecondMe user info response:', userResponse.data || userResponse.bodyText);
        return res.status(500).json({
          error: 'Failed to get user info',
          detail:
            process.env.NODE_ENV === 'development'
              ? userResponse.data || userResponse.bodyText
              : undefined,
        });
      }

      let user = await selectOne<UserRow>('User', {
        select: 'id,secondmeId,username,email,avatar,profession,interests,personaSummary,npcBehavior,secondmeProfile,isNpcVisible,secondmeAccessToken,secondmeApiKey,secondmeTokenScope,secondmeTokenExpiresAt',
        ...eq('secondmeId', secondmeId),
      });

      if (!user) {
        const userId = crypto.randomUUID();
        const username = secondmeUser.name || secondmeUser.username || 'Player';

        const [createdUser] = await insertRows<UserRow>('User', {
          id: userId,
          secondmeId,
          username,
          email: secondmeUser.email,
          avatar: secondmeUser.picture,
          profession: normalizedProfile.profession,
          interests: normalizedProfile.interests,
          personaSummary: normalizedProfile.personaSummary,
          npcBehavior: normalizedProfile.npcBehavior,
          secondmeProfile: nextSecondMeProfile,
          isNpcVisible: true,
          secondmeAccessToken: accessToken,
          secondmeApiKey: syncedAvatarApiKey,
          secondmeTokenScope: scope,
          secondmeTokenExpiresAt: tokenExpiresAt,
        });

        await insertRows('GameProgress', {
          id: crypto.randomUUID(),
          userId,
          level: 1,
          experience: 0,
          gold: 1000,
          positionX: 100,
          positionY: 100,
          currentMap: 'main',
        });

        await insertRows('Shop', {
          id: crypto.randomUUID(),
          userId,
          name: `${username}的商店`,
          level: 1,
          reputation: 0,
        });

        user = createdUser;
      } else {
        const [updatedUser] = await updateRows<UserRow>(
          'User',
          { ...eq('id', user.id) },
          {
            username: secondmeUser.name || secondmeUser.username || user.username,
            email: secondmeUser.email ?? user.email ?? null,
            avatar: secondmeUser.picture ?? user.avatar ?? null,
            profession: normalizedProfile.profession ?? user.profession ?? null,
            interests: normalizedProfile.interests,
            personaSummary: normalizedProfile.personaSummary ?? user.personaSummary ?? null,
            npcBehavior: normalizedProfile.npcBehavior ?? user.npcBehavior ?? 'wander',
            secondmeProfile: nextSecondMeProfile,
            secondmeAccessToken: accessToken,
            secondmeApiKey: syncedAvatarApiKey ?? user.secondmeApiKey ?? null,
            secondmeTokenScope: scope,
            secondmeTokenExpiresAt: tokenExpiresAt,
          },
        );

        if (updatedUser) {
          user = updatedUser;
        }
      }

      const existingProgress = await selectOne<{ id: string }>('GameProgress', {
        select: 'id',
        ...eq('userId', user.id),
      });

      if (!existingProgress) {
        await insertRows('GameProgress', {
          id: crypto.randomUUID(),
          userId: user.id,
          level: 1,
          experience: 0,
          gold: 1000,
          positionX: 100,
          positionY: 100,
          currentMap: 'main',
        });
      }

      const existingShop = await selectOne<{ id: string }>('Shop', {
        select: 'id',
        ...eq('userId', user.id),
      });

      if (!existingShop) {
        await insertRows('Shop', {
          id: crypto.randomUUID(),
          userId: user.id,
          name: `${user.username}的商店`,
          level: 1,
          reputation: 0,
        });
      }

      const expiresIn = (process.env.JWT_EXPIRES_IN || '7d') as SignOptions['expiresIn'];

      const jwtToken = jwt.sign(
        { userId: user.id, secondmeId: user.secondmeId },
        process.env.JWT_SECRET!,
        { expiresIn },
      );

      res.json({
        token: jwtToken,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          avatar: user.avatar,
          profession: user.profession,
          interests: user.interests,
          personaSummary: user.personaSummary,
          npcBehavior: user.npcBehavior,
        },
      });
    } catch (error: any) {
      const detail = error.response?.data || error.message || 'Unknown error';
      console.error('SecondMe login error:', detail);
      res.status(500).json({
        error: 'Login failed',
        detail: process.env.NODE_ENV === 'development' ? detail : undefined,
      });
    }
  },

  async refreshToken(req: Request, res: Response) {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({ error: 'Token is required' });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      const expiresIn = (process.env.JWT_EXPIRES_IN || '7d') as SignOptions['expiresIn'];

      const newToken = jwt.sign(
        { userId: decoded.userId, secondmeId: decoded.secondmeId },
        process.env.JWT_SECRET!,
        { expiresIn },
      );

      res.json({ token: newToken });
    } catch (error) {
      res.status(401).json({ error: 'Invalid token' });
    }
  },

  async getCurrentUser(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;

      const user = await selectOne<UserRow>('User', {
        select: 'id,username,email,avatar,profession,interests,personaSummary,npcBehavior,secondmeProfile,isNpcVisible,secondmeApiKey',
        ...eq('id', userId),
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const gameProgress = await selectOne('GameProgress', {
        select: '*',
        ...eq('userId', userId),
      });

      const shop = await selectOne('Shop', {
        select: '*',
        ...eq('userId', userId),
      });

      res.json({
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        profession: user.profession,
        interests: user.interests,
        personaSummary: user.personaSummary,
        npcBehavior: user.npcBehavior,
        secondmeProfile: user.secondmeProfile,
        isNpcVisible: user.isNpcVisible ?? true,
        secondmeApiKey: user.secondmeApiKey ? 'configured' : null,
        gameProgress,
        shop,
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get user' });
    }
  },

  async updateProfile(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const {
        profession,
        interests,
        personaSummary,
        npcBehavior,
        isNpcVisible,
        secondmeApiKey,
      } = req.body || {};

      const nextInterests = Array.isArray(interests)
        ? interests.map((item) => String(item).trim()).filter(Boolean).slice(0, 8)
        : undefined;

      const [user] = await updateRows<UserRow>(
        'User',
        { ...eq('id', userId) },
        {
          ...(profession !== undefined && { profession: profession ? String(profession).trim() : null }),
          ...(nextInterests !== undefined && { interests: nextInterests }),
          ...(personaSummary !== undefined && { personaSummary: personaSummary ? String(personaSummary).trim() : null }),
          ...(npcBehavior !== undefined && { npcBehavior: String(npcBehavior).trim() || 'wander' }),
          ...(isNpcVisible !== undefined && { isNpcVisible: Boolean(isNpcVisible) }),
          ...(secondmeApiKey !== undefined && { secondmeApiKey: secondmeApiKey ? String(secondmeApiKey).trim() : null }),
        },
      );

      res.json({
        id: user.id,
        username: user.username,
        profession: user.profession,
        interests: user.interests,
        personaSummary: user.personaSummary,
        npcBehavior: user.npcBehavior,
        isNpcVisible: user.isNpcVisible ?? true,
        secondmeApiKey: user.secondmeApiKey ? 'configured' : null,
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update profile' });
    }
  },
};
