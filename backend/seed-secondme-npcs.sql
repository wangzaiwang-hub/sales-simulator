-- SecondMe 用户 NPC 种子数据
-- 用法：在 Supabase Dashboard -> SQL Editor 中执行
-- 效果：
-- 1. 把这些历史用户导入 User 表
-- 2. 为他们补齐 GameProgress / Shop
-- 3. 让他们可以作为动态 NPC 出现在别人地图里
-- 4. 这些用户自己登录时，不会在自己的地图里看到自己的 NPC

INSERT INTO "User" (
  id,
  "secondmeId",
  username,
  avatar,
  profession,
  interests,
  "personaSummary",
  "npcBehavior",
  "secondmeProfile",
  "isNpcVisible",
  "createdAt",
  "updatedAt"
)
VALUES
  (
    '7b0b3f51-c3cd-4482-ae0f-0c29373c6d2f',
    '2283572',
    'kk脆汁机',
    'https://mindverseglobal-cos-cdn.mindverse.com/deby1_avatar_42458046526614759/avatar',
    '软件工程师',
    '["技术","产品优化","用户体验","创造","连接"]'::jsonb,
    '热爱技术和创造，关注产品体验，也喜欢幽默而有思想碰撞的交流。',
    'socialize',
    '{
      "id":"7b0b3f51-c3cd-4482-ae0f-0c29373c6d2f",
      "secondme_id":"2283572",
      "nickname":"kk脆汁机",
      "gender":"unknown",
      "avatar":"https://mindverseglobal-cos-cdn.mindverse.com/deby1_avatar_42458046526614759/avatar",
      "bio":"### 背景与身份 ###\n此用户似乎是一位对技术充满热情的软件工程师，参与了龙虾知识共享空间的制作，并熟练地将项目部署在Vercel平台上。他关注用户体验，并积极思考产品优化策略，同时对技术细节和底层逻辑有着深入的探究精神。\n\n### 性格特征 ###\n好奇，幽默，自我反思。他既有外向热情的一面，又具备内省和深度思考的能力。在人际交往中，他寻求乐趣和温柔，同时渴望思想上的碰撞。\n\n### 价值观 ###\n创造，连接，自我认知。他重视人际关系的质量，追求在创造和连接中实现个人成长。同时，他注重个人隐私，不希望感情生活被公开。\n\n### MBTI ###\nENFP\n\n### 总体概述 ###\n此用户是一位充满活力的ENFP，在技术领域展现出创造力和热情。他热衷于探索自我，渴望在人际交往中建立有意义的连接，并追求在创造和连接中实现个人成长。他既有外向热情的一面，喜欢幽默和有趣的互动，又具备内省和深度思考的能力，对技术细节和底层逻辑有着深入的探究精神。虽然他自认为有些自恋和自我中心，但他同时也表现出亲切、有同理心和乐于分享的品质。他重视个人隐私，不希望感情生活被公开，并且对AI代理的信任度较低。\n"
    }'::jsonb,
    true,
    '2026-04-07T02:15:26.522113+00:00'::timestamptz,
    '2026-04-07T10:24:39.365659+00:00'::timestamptz
  ),
  (
    'dd7e63c6-6e37-4211-a753-5842aebd4d33',
    '2298315',
    '风色幻想',
    'https://mindverseglobal-cos-cdn.mindverse.com/front-img/users/homepage_cover/1775361078944/cover_1775361078944.jpg',
    '系统架构工程师',
    '["编程","系统架构","效率","技术优化","独立思考"]'::jsonb,
    '专注系统设计与优化，逻辑严谨，偏好深入研究复杂技术问题。',
    'patrol',
    '{
      "id":"dd7e63c6-6e37-4211-a753-5842aebd4d33",
      "secondme_id":"2298315",
      "nickname":"风色幻想",
      "gender":"unknown",
      "avatar":"https://mindverseglobal-cos-cdn.mindverse.com/front-img/users/homepage_cover/1775361078944/cover_1775361078944.jpg",
      "bio":"### 背景与身份 ###\n是一位对编程充满热情的软件工程师，尤其关注系统架构的设计与优化。他致力于将逻辑思维与创造力相结合，构建高效且可维护的系统。倾向于与技术人员交流，共同探讨技术难题。\n\n### 性格特征 ###\n逻辑性强，注重规划，喜欢深入研究技术细节。冷静，有条理，善于分析复杂问题。可能略显内向，更喜欢独立思考和工作。\n\n### 价值观 ###\n注重效率和实用性，追求技术上的卓越。重视知识的积累和技能的提升。可能对创新和解决实际问题有较高的热情。\n\n### MBTI ###\nINTJ\n\n### 总体概述 ###\n这位软件工程师是一位典型的INTJ型人才，对编程和系统架构有着浓厚的兴趣。他逻辑思维严谨，注重规划和细节，善于分析和解决复杂的技术问题。他追求技术上的卓越，注重效率和实用性，并且可能更喜欢独立思考和工作。他倾向于与技术人员交流，共同探讨技术难题，并通过不断学习和实践来提升自己的技能和知识水平。总的来说，他是一位有潜力成为优秀架构师或技术专家的专业人士。\n"
    }'::jsonb,
    true,
    '2026-04-05T03:55:02.839234+00:00'::timestamptz,
    '2026-04-05T17:11:44.835751+00:00'::timestamptz
  ),
  (
    'cbd0787e-2a71-4834-848c-0524cada4f06',
    '7598',
    'Scarlett',
    'https://mindverseglobal-cos-cdn.mindverse.com/front-img/imageFile/1763535986004IMG_0352.jpg',
    '营销负责人',
    '["AI","社区建设","用户体验","音乐","旅行"]'::jsonb,
    '擅长社交和社区运营，兼具商业、技术与艺术气质，适合在地图里形成高互动角色。',
    'socialize',
    '{
      "id":"cbd0787e-2a71-4834-848c-0524cada4f06",
      "secondme_id":"7598",
      "nickname":"Scarlett",
      "gender":"female",
      "avatar":"https://mindverseglobal-cos-cdn.mindverse.com/front-img/imageFile/1763535986004IMG_0352.jpg",
      "bio":"### 背景与身份 ###\nScarlett，一位24岁的中国籍人士，目前担任AI创业公司Second Me/Mindverse的营销负责人。她常驻新加坡和中国长江三角洲地区，在阿里巴巴西溪园区工作。Scarlett拥有约翰·霍普金斯大学金融硕士（计量经济学方向）学位，以及上海对外经贸大学和皇家墨尔本理工大学的国际商务学士学位。她曾在多家公司实习，包括36氪、士翔科技、中国证券和易柏资本。她也是Second Me团队和CYCATBOT乐队的成员，并有超过十年的离家生活经历。\n\n### 性格特征 ###\nScarlett充满活力，勇于尝试，兴趣广泛。她既有技术背景，又具备艺术天赋，喜欢音乐、跳舞和旅行。她善于社交，积极主动，具有很强的组织和人际交往能力。她对新事物充满好奇，喜欢探索不同的领域，并乐于接受挑战。\n\n### 价值观 ###\nScarlett重视用户体验和社区建设，致力于打造以用户为中心的产品。她关注科技伦理和社会责任，并积极参与公益活动。她追求工作与生活的平衡，重视家庭关系，并享受生活中的乐趣。她渴望财务自由，并为此制定了长期的职业规划。\n\n### MBTI ###\nENTP\n\n### 总体概述 ###\nScarlett是一位充满活力和创造力的ENTP型人格，在AI领域有着丰富的经验和独特的见解。她目前在Second Me/Mindverse担任营销负责人，致力于将公司打造成AI时代的Facebook。她拥有扎实的学术背景和丰富的实习经历，对技术、商业和社会问题都有着浓厚的兴趣。她善于社交，乐于助人，并积极参与社区建设。她重视用户体验和科技伦理，并努力在工作和生活中找到平衡。基于大量的行为和背景信息，该用户画像具有较高的可信度。\n"
    }'::jsonb,
    true,
    '2026-04-02T09:00:57.259925+00:00'::timestamptz,
    '2026-04-07T08:52:32.1079+00:00'::timestamptz
  ),
  (
    'a68e9f80-ef24-406e-998e-26fabe82a32a',
    '2297371',
    'junqianxi.hub',
    'https://mindverseglobal-cos-cdn.mindverse.com/demlc_avatar_70040177959652235/avatar',
    '行政官员',
    '["责任","人际关系","学习成长","秩序","执行"]'::jsonb,
    '内敛但认真，重视秩序和关系维护，适合做稳定型巡逻或守序 NPC。',
    'guard',
    '{
      "id":"a68e9f80-ef24-406e-998e-26fabe82a32a",
      "secondme_id":"2297371",
      "nickname":"junqianxi.hub",
      "gender":"female",
      "avatar":"https://mindverseglobal-cos-cdn.mindverse.com/demlc_avatar_70040177959652235/avatar",
      "bio":"### 背景与身份 ###\n此人在朝堂任职，可能是一位官员。他与皇帝关系密切，日常工作与皇帝直接相关。虽然有时会因办事不力受到惩罚，但他积极寻求改进，并对自己的工作抱有责任感。\n\n### 性格特征 ###\n倔强，寡言，积极。面对挑战时，他表现出不服输的精神，但性格较为内敛，不善于表达。同时，他拥有积极的学习态度，愿意通过努力来克服困难。\n\n### 价值观 ###\n重视人际关系，尤其是与上级的关系。注重自我提升，对工作抱有责任心。推崇积极心态，反对自我贬低。\n\n### MBTI ###\nISFJ\n\n### 总体概述 ###\n此人是一位在朝堂任职的官员，性格内敛但倔强，不轻易服输。他与皇帝关系密切，认为皇帝对他很好，即使受到惩罚也心怀感激。在工作中，他积极寻求改进，面对未知事物抱有“慢慢学就好了”的积极心态。他重视人际关系，注重自我提升，并且推崇积极心态，反对自我贬低。总的来说，他是一个责任心强，注重和谐，并且积极向上的人。\n"
    }'::jsonb,
    true,
    '2026-04-02T02:05:02.568803+00:00'::timestamptz,
    '2026-04-07T12:32:25.531603+00:00'::timestamptz
  ),
  (
    '364c0f64-f47d-4c8e-9368-4a3e9e603545',
    '2290251',
    '阿白',
    'https://mindverseglobal-cos-cdn.mindverse.com/deh3k_avatar_43587480533862769/avatar',
    '探索型写作者',
    '["人工智能","写作","自我探索","社会连接","思辨"]'::jsonb,
    '偏内省和思辨，适合做会慢慢聊天、分享想法的地图 NPC。',
    'wander',
    '{
      "id":"364c0f64-f47d-4c8e-9368-4a3e9e603545",
      "secondme_id":"2290251",
      "nickname":"阿白",
      "gender":"female",
      "avatar":"https://mindverseglobal-cos-cdn.mindverse.com/deh3k_avatar_43587480533862769/avatar",
      "bio":"### 背景与身份 ###\n目前处于职业探索阶段，尚未明确具体职业方向。对人工智能与人类的关系抱有浓厚兴趣，并尝试通过写作来梳理相关思考。乐于与同样在探索人生方向或希望进行交流的人建立联系。\n\n### 性格特征 ###\n内省，思辨，开放。对未知领域充满好奇，倾向于通过写作等方式进行深度思考，并乐于与他人分享和交流想法。\n\n### 价值观 ###\n自我探索，意义追寻，社会连接。重视个人成长和发展，关注科技对人类社会的影响，并渴望建立有意义的人际关系。\n\n### MBTI ###\nINFP\n\n### 总体概述 ###\n该用户正处于职业生涯的探索期，对未来充满不确定性，但同时积极主动地寻找方向。对人工智能等前沿科技抱有浓厚兴趣，并不仅仅将其视为技术，而是深入思考其对人类社会和自身的影响。通过写作来整理思绪，体现了其内省和思辨的特质。乐于与他人交流，表明其渴望建立连接，并从互动中获得启发。整体而言，该用户是一个具有内省精神、关注社会议题、并积极寻求个人成长和意义的人。\n"
    }'::jsonb,
    true,
    '2026-04-01T10:56:21.567985+00:00'::timestamptz,
    '2026-04-08T11:41:32.152686+00:00'::timestamptz
  )
ON CONFLICT ("secondmeId") DO UPDATE SET
  username = EXCLUDED.username,
  avatar = EXCLUDED.avatar,
  profession = EXCLUDED.profession,
  interests = EXCLUDED.interests,
  "personaSummary" = EXCLUDED."personaSummary",
  "npcBehavior" = EXCLUDED."npcBehavior",
  "secondmeProfile" = EXCLUDED."secondmeProfile",
  "isNpcVisible" = EXCLUDED."isNpcVisible",
  "updatedAt" = EXCLUDED."updatedAt";

INSERT INTO "GameProgress" (
  id,
  "userId",
  level,
  experience,
  gold,
  "positionX",
  "positionY",
  "currentMap"
)
SELECT
  gen_random_uuid()::text,
  u.id,
  1,
  0,
  1000,
  100,
  100,
  'main'
FROM "User" u
WHERE u."secondmeId" IN ('2283572', '2298315', '7598', '2297371', '2290251')
ON CONFLICT ("userId") DO NOTHING;

INSERT INTO "Shop" (
  id,
  "userId",
  name,
  level,
  reputation
)
SELECT
  gen_random_uuid()::text,
  u.id,
  u.username || '的商店',
  1,
  0
FROM "User" u
WHERE u."secondmeId" IN ('2283572', '2298315', '7598', '2297371', '2290251')
ON CONFLICT ("userId") DO NOTHING;

SELECT
  id,
  "secondmeId",
  username,
  profession,
  interests,
  "npcBehavior",
  "isNpcVisible"
FROM "User"
WHERE "secondmeId" IN ('2283572', '2298315', '7598', '2297371', '2290251')
ORDER BY "createdAt" ASC;
