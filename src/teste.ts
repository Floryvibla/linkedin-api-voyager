import { Client, fetchData } from "./config";
import { linkedinSSE } from "./linkedin-sse";
import { getMessages, getMessagingInboxConversations } from "./message";
import { getCommentsByPostUrl, getPostLinkedin } from "./posts";
import { extractProfileIdLinkedin, getUserMiniProfile } from "./user";

Client({
  JSESSIONID: "0466411065031579456",
  li_at:
    "AQEDAU9C-sMEobZ6AAABmgzAd04AAAGdoxs1kU4AYDxi4dFa2JUkdsZHqpIU9JuPIhi6J_aMAPYQ5dIYJuv6jXBRj04t-4vhJvMHhlMF48-MRFPJDD-k5f8CYH4QESpzmpP4zMm6WKODloiizUwuthG8",
});

async function start() {
  const url =
    "https://www.linkedin.com/posts/obrunookamoto_se-voc%C3%AA-usa-o-chatgpt-para-agora-mesmo-cancela-ugcPost-7444852024854306816-h1GG?utm_source=social_share_send&utm_medium=member_desktop_web&rcm=ACoAABgQ7uMBHhkeqe_cSk1_5fNcRa3Q1TZ8j0k";
  try {
    const response = await getCommentsByPostUrl(url);
    console.log("response getCommentsByPostUrl: ", response);
  } catch (error) {
    console.error("ERROR: ", error);
  }
  // await getCommentsByPostUrl(
  //   "https://www.linkedin.com/posts/obrunookamoto_se-voc%C3%AA-usa-o-chatgpt-para-agora-mesmo-cancela-ugcPost-7444852024854306816-h1GG?utm_source=social_share_send&utm_medium=member_desktop_web&rcm=ACoAABgQ7uMBHhkeqe_cSk1_5fNcRa3Q1TZ8j0k",
  // );
}

start();
