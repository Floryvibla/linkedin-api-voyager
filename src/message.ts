import { fetchData } from "./config";
import { LinkedInMessage } from "./types";
import { extractProfileIdLinkedin } from "./user";
import { encodeLinkedinUrn } from "./utils";

const DEFAULT_INBOX_QUERY_ID =
  "messengerConversations.0d5e6781bbee71c3e51c8843c6519f48";

interface LinkedInConversation {
  urn: string;
  identifier: string;
  fullName: string;
  firstName: string;
  lastName: string;
  headline: string;
  profilePicture: string | null;
  lastMessage: {
    text: string;
    sentAt: Date;
    isRead: boolean;
  };
  unreadCount: number;
  isGroup: boolean;
  participants: any[];
}

/**
 * Organiza o payload bruto do messengerConversations do LinkedIn
 * em uma lista de objetos limpos e tipados.
 */
export const organizeInbox = (rawPayload: any): LinkedInConversation[] => {
  const elements =
    rawPayload?.data?.messengerConversationsBySyncToken?.elements || [];

  return elements.map((conv: any) => {
    // 1. Identifica o outro participante (que não é o usuário logado)
    // Geralmente o primeiro participante que não tem a URN do mailbox
    const otherParticipant =
      conv.conversationParticipants.find(
        (p: any) => p.participantType?.member?.distance !== "SELF",
      )?.participantType?.member ||
      conv.conversationParticipants[0]?.participantType?.member;

    const memberInfo = otherParticipant;

    // 2. Extrai a URN e o Identifier numérico
    const conversationUrn = conv.entityUrn;
    const identifier = conversationUrn.split(":")?.[6]?.split(",")?.[0] || "";

    // 3. Processa a Imagem (Pega o artifact com maior largura/qualidade)
    let profilePic = null;
    if (memberInfo?.profilePicture?.artifacts) {
      const bestArtifact = memberInfo.profilePicture.artifacts.reduce(
        (prev: any, current: any) => {
          return prev.width > current.width ? prev : current;
        },
      );
      profilePic = `${memberInfo.profilePicture.rootUrl}${bestArtifact.fileIdentifyingUrlPathSegment}`;
    }

    // 4. Pega a última mensagem
    const lastMsgElement = conv.messages?.elements?.[0];

    return {
      urn: conversationUrn,
      identifier: identifier,
      fullName:
        `${memberInfo?.firstName?.text || ""} ${memberInfo?.lastName?.text || ""}`.trim(),
      firstName: memberInfo?.firstName?.text || "",
      lastName: memberInfo?.lastName?.text || "",
      headline: memberInfo?.headline?.text || "",
      profilePicture: profilePic,
      lastMessage: {
        text: lastMsgElement?.body?.text || "",
        sentAt: new Date(conv.lastActivityAt),
        isRead: conv.read,
      },
      unreadCount: conv.unreadCount || 0,
      isGroup: conv.groupChat,
    };
  });
};

async function resolveMailboxUrn(input: {
  mailboxUrn?: string;
  identifier?: string;
}): Promise<string> {
  if (input.mailboxUrn) return input.mailboxUrn;
  if (!input.identifier)
    throw new Error("mailboxUrn or identifier is required");
  if (input.identifier.startsWith("urn:li:")) return input.identifier;
  const profileId = await extractProfileIdLinkedin(input.identifier);
  if (!profileId) throw new Error("Profile not found");
  return `urn:li:fsd_profile:${profileId}`;
}

export const getMessagingInboxConversations = async (input: {
  mailboxUrn?: string;
  identifier?: string;
  queryId?: string;
}): Promise<LinkedInConversation[]> => {
  const mailboxUrn = await resolveMailboxUrn(input);
  const queryId = input.queryId ?? DEFAULT_INBOX_QUERY_ID;

  const response = await fetchData(
    `/voyagerMessagingGraphQL/graphql?queryId=${queryId}&variables=(mailboxUrn:${encodeURIComponent(mailboxUrn)})`,
    { headers: { accept: "application/graphql" } },
  );

  const conversations = organizeInbox(response);

  return conversations;
};

export const getMessages = async (
  conversationUrn: string,
): Promise<LinkedInMessage[]> => {
  const response = await fetchData(
    `/voyagerMessagingGraphQL/graphql?queryId=messengerMessages.5846eeb71c981f11e0134cb6626cc314&variables=(conversationUrn:${encodeLinkedinUrn(conversationUrn)})`,
  );

  const included = response?.included || [];
  const messageUrns =
    response?.data?.data?.messengerMessagesBySyncToken?.["*elements"] || [];

  // 1. Criamos mapas para busca rápida dentro do array 'included'
  const messageMap = new Map();
  const participantMap = new Map();
  const mediaMap = new Map();

  included.forEach((item: any) => {
    if (item.$type === "com.linkedin.messenger.Message") {
      messageMap.set(item.entityUrn, item);
    } else if (item.$type === "com.linkedin.messenger.MessagingParticipant") {
      participantMap.set(item.entityUrn, item);
    } else if (item.$type === "com.linkedin.videocontent.VideoPlayMetadata") {
      mediaMap.set(item.entityUrn, item);
    }
    // Adicione outros tipos de mídia aqui se necessário (File, Image, etc)
  });

  // 2. Montamos a lista final baseada na ordem do array principal (*elements)
  return messageUrns
    .map((urn: string) => {
      const msg = messageMap.get(urn);
      if (!msg) return null;

      const senderUrn = msg["*sender"];
      const senderRaw = participantMap.get(senderUrn);
      const memberInfo = senderRaw?.participantType?.member;

      // Processamento de Foto do Remetente
      let profilePic = null;
      if (memberInfo?.profilePicture?.artifacts) {
        const bestArtifact = memberInfo.profilePicture.artifacts.reduce(
          (prev: any, curr: any) => (prev.width > curr.width ? prev : curr),
        );
        profilePic = `${memberInfo.profilePicture.rootUrl}${bestArtifact.fileIdentifyingUrlPathSegment}`;
      }

      // Processamento de Mídia (Video, Imagem, File)
      let mediaContent = null;
      const renderContent = msg.renderContent?.[0];

      if (renderContent) {
        // Caso seja Vídeo (URN referenciada)

        if (renderContent["*video"]) {
          const videoData = mediaMap.get(renderContent["*video"]);
          const stream =
            videoData?.progressiveStreams?.[0]?.streamingLocations?.[0];
          mediaContent = {
            type: "VIDEO",
            url: stream?.url || null,
            thumbnail:
              videoData?.thumbnail?.artifacts?.[0]
                ?.fileIdentifyingUrlPathSegment || null,
            duration: videoData?.duration,
          };
        }
        // Caso seja Imagem (Objeto direto)
        else if (renderContent.vectorImage) {
          mediaContent = {
            type: "IMAGE",
            url:
              renderContent.vectorImage.rootUrl +
              (renderContent.vectorImage.artifacts?.[0]
                ?.fileIdentifyingUrlPathSegment || ""),
          };
        }
        // Caso seja Arquivo (Objeto direto)
        else if (renderContent.file) {
          mediaContent = {
            type: "FILE",
            url: renderContent.file.url,
            fileName: renderContent.file.name,
          };
        } else if (renderContent.audio) {
          mediaContent = {
            type: "AUDIO",
            url: renderContent.audio.url,
            duration: renderContent.audio.duration,
          };
        }
      }

      return {
        id: msg.backendUrn,
        text: msg.body?.text || null,
        sentAt: msg.deliveredAt,
        media: mediaContent,
        sender: {
          urn: senderRaw?.hostIdentityUrn || null,
          fullName:
            `${memberInfo?.firstName?.text || "LinkedIn User"} ${memberInfo?.lastName?.text || ""}`.trim(),
          profilePicture: profilePic,
          isSelf: memberInfo?.distance === "SELF",
        },
      };
    })
    .filter(Boolean)
    .sort((a: LinkedInMessage, b: LinkedInMessage) => b.sentAt - a.sentAt);
};
