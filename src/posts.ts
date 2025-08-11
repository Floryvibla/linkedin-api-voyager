import { fetchData } from "./config";
import { extractFields } from "./utils";

export const getCommentsByPostUrl = async (
  url: string,
  start: number = 0,
  limit: number = 50,
  accumulatedComments: any[] = []
): Promise<any[]> => {
  const postID = url.match(/activity-(\d+)/)?.[1];

  const response = await fetchData(
    `/graphql?includeWebMetadata=false&queryId=voyagerSocialDashComments.95ed44bc87596acce7c460c70934d0ff&variables=(count:${limit},start:${start},numReplies:1,socialDetailUrn:urn%3Ali%3Afsd_socialDetail%3A%28urn%3Ali%3Aactivity%${postID}%2Curn%3Ali%3Aactivity%3A${postID}%2Curn%3Ali%3AhighlightedReply%3A-%29,sortOrder:RELEVANCE)`
  );

  const elements = response.data?.data?.socialDashCommentsBySocialDetail?.[
    "*elements"
  ] as string[];

  // Se não há elementos, retorna os comentários acumulados
  if (!elements || elements.length === 0) {
    // console.log(
    //   "✅ Busca finalizada. Total de comentários:",
    //   accumulatedComments.length
    // );
    return accumulatedComments;
  }

  const data =
    response.included?.filter((item: any) =>
      elements.includes(item.entityUrn)
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

  const currentComments = extractFields(data, fieldsMap);
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
      allComments
    );
  }

  // Se retornou menos que o limite, chegou ao fim
  return allComments;
};

export const getPosts = async () => {
  return [];
};
