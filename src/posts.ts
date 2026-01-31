/* eslint-disable @typescript-eslint/no-explicit-any */
import { extractProfileIdLinkedin } from "./user";
import { fetchData } from "./config";
import { extractFields } from "./utils";

export const parseResponsePostLinkedin = (
  response: any,
  key: string,
  accumulatedData: any,
) => {
  const elements = response.data?.data?.[key]?.["*elements"] as string[];

  const data =
    response.included?.filter((item: unknown) =>
      elements.includes((item as unknown as { entityUrn: string }).entityUrn),
    ) || [];

  if (!elements || elements.length === 0) {
    return accumulatedData;
  }

  return data;
};

export const getCommentsByPostUrl = async (
  url: string,
  start: number = 0,
  limit: number = 50,
  accumulatedComments: unknown[] = [],
): Promise<unknown[]> => {
  const postID = url.match(/activity-(\d+)/)?.[1];

  const response = await fetchData(
    `/graphql?includeWebMetadata=false&queryId=voyagerSocialDashComments.95ed44bc87596acce7c460c70934d0ff&variables=(count:${limit},start:${start},numReplies:1,socialDetailUrn:urn%3Ali%3Afsd_socialDetail%3A%28urn%3Ali%3Aactivity%${postID}%2Curn%3Ali%3Aactivity%3A${postID}%2Curn%3Ali%3AhighlightedReply%3A-%29,sortOrder:RELEVANCE)`,
  );

  const elements = response.data?.data?.socialDashCommentsBySocialDetail?.[
    "*elements"
  ] as string[];

  // Se não há elementos, retorna os comentários acumulados
  if (!elements || elements.length === 0) {
    return accumulatedComments;
  }

  const data =
    response.included?.filter((item: unknown) =>
      elements.includes((item as unknown as { entityUrn: string }).entityUrn),
    ) || [];

  // Mapeamento melhorado dos campos
  const fieldsMap = {
    id: "entityUrn",
    createdAt: "createdAt",
    isAuthor: "commenter.author",
    name: "commenter.title.text",
    headline: "commenter.subtitle",
    profileUrl: "commenter.navigationUrl",
    comment: "commentary.text",
    permalink: "permalink",
    image:
      "commenter.image.attributes.0.detailData.nonEntityProfilePicture.vectorImage",
  };

  const currentComments = extractFields(data, fieldsMap).map((comment) => ({
    ...comment,
    image: `${comment.image?.rootUrl}${
      comment.image?.artifacts?.at(-1)?.fileIdentifyingUrlPathSegment
    }`,
  }));
  const allComments = [...accumulatedComments, ...currentComments];

  //   console.log(
  //     `🔍 Encontrados ${elements.length} comentários (Total: ${allComments.length})`
  //   );

  // Continua a busca se há mais elementos
  if (elements.length > 0) {
    return await getCommentsByPostUrl(
      url,
      start + elements.length,
      limit,
      allComments,
    );
  }

  // Se retornou menos que o limite, chegou ao fim
  return allComments;
};

export const getPosts = async () => {
  return [];
};

export const getPostLinkedin = async (
  url: string,
  commentsCount: number = 10,
  likesCount: number = 10,
) => {
  const slugPost = url.match(/\/posts\/([^\/?]+)/)?.[1];

  const response = await fetchData(
    `/graphql?includeWebMetadata=false&queryId=voyagerFeedDashUpdates.5cf9b25c46b9d86c224647752f7d6bfd&variables=(commentsCount:${commentsCount},likesCount:${likesCount},includeCommentsFirstReply:true,includeReactions:false,moduleKey:feed-item%3Adesktop,slug:${slugPost})`,
  );

  const posts = helperGetPosts(
    response,
    "feedDashUpdatesByPostSlug",
    undefined,
    { actor: "actor" },
  )?.[0];

  const actor = {
    name: posts?.actor?.name?.text,
    headline: posts?.actor?.description?.text,
    profileUrl:
      posts?.actor?.image?.attributes?.[0]?.detailData?.nonEntityProfilePicture
        ?.vectorImage?.rootUrl +
      posts?.actor?.image?.attributes?.[0]?.detailData?.nonEntityProfilePicture?.vectorImage?.artifacts?.at(
        -1,
      )?.fileIdentifyingUrlPathSegment,
  };

  return {
    ...posts,
    actor,
  };
};

export const getUserPosts = async ({
  identifier,
  start = 0,
  count = 50,
  accumulatedPosts = [],
}: {
  identifier: string;
  start?: number;
  count?: number;
  accumulatedPosts?: unknown[];
}) => {
  const profileId = await extractProfileIdLinkedin(identifier);
  const response = await fetchData(
    `graphql?variables=(profileUrn:urn%3Ali%3Afsd_profile%3A${profileId},count:${count},start:${start})&queryId=voyagerFeedDashProfileUpdates.4af00b28d60ed0f1488018948daad822`,
  );

  const parsePosts = helperGetPosts(
    response,
    "feedDashProfileUpdatesByMemberShareFeed",
    accumulatedPosts,
  );

  return parsePosts;
};

export const helperGetPosts = (
  response: any,
  key: string,
  accumulatedPosts?: any,
  addFields?: Record<string, string>,
) => {
  const data = parseResponsePostLinkedin(response, key, accumulatedPosts);

  const socialActivityData = response.included.filter(
    (item: any) =>
      item?.$type === "com.linkedin.voyager.dash.feed.SocialActivityCounts",
  );

  const fieldsMap = {
    urn: "metadata.backendUrn",
    postUrl: "socialContent.shareUrl",
    contentText: "commentary.text.text",
    tags: "commentary.text.attributesV2",
    media: "content",
    dateDescription: "actor.subDescription.text",
    ...addFields,
  };

  const fieldsSocialActivityCountMap = {
    numLikes: "numLikes",
    numComments: "numComments",
    reactionCounts: "reactionTypeCounts",
    numShares: "numShares",
    urn: "urn",
  };

  const extractPosts = extractFields(data, fieldsMap);
  const extractSocialActivityCount = extractFields(
    socialActivityData,
    fieldsSocialActivityCountMap,
  );

  const parsePosts = extractPosts?.map((post) => {
    const socialActivity =
      extractSocialActivityCount.find((item) => item.urn === post.urn) || {};
    if (socialActivity) {
      const mediaNonNullKeys = Object.fromEntries(
        Object.entries(post.media).filter(([_, value]) => value !== null),
      ) as any;

      let media = {};

      if (mediaNonNullKeys?.imageComponent) {
        media = {
          ...media,
          images: mediaNonNullKeys?.imageComponent?.images?.map((item: any) =>
            helperGetImageUrl(item),
          ),
        };
      }
      if (mediaNonNullKeys?.linkedInVideoComponent) {
        const videoentityUrn =
          mediaNonNullKeys?.linkedInVideoComponent?.["*videoPlayMetadata"];

        const videoActivityData = response.included.filter(
          (item: any) => item?.entityUrn === videoentityUrn,
        );
        media = {
          ...media,
          videoActivityData,
        };
      }

      return { ...post, media, ...socialActivity };
    }
  });

  return parsePosts;
};

export const helperGetImageUrl = (item: any) => {
  const keyEntity = item?.attributes?.[0]?.detailData?.nonEntityProfilePicture
    ? "nonEntityProfilePicture"
    : "vectorImage";

  const itemImage = item?.attributes?.[0]?.detailData?.[keyEntity];

  const biggestWidth = itemImage?.artifacts?.reduce(
    (max: any, current: any) => {
      return current.width > max.width ? current : max;
    },
    itemImage?.artifacts?.[0],
  );

  return itemImage?.rootUrl + biggestWidth?.fileIdentifyingUrlPathSegment;
};
