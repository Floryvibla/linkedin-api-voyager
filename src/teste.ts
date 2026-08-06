import { getCompany } from "./company";
import { searchCompanyPeople } from "./company-people";
import { Client } from "./config";
import { linkedinSSE } from "./linkedin-sse";
import { getMessages, getMessagingInboxConversations } from "./message";
import { getCommentsByPostUrl, getPostLinkedin } from "./posts";
import { extractProfileIdLinkedin, getUserMiniProfile } from "./user";

Client({
  JSESSIONID: "0466411065031579456",
  li_at:
    "AQEDAU9C-sMFsgXNAAABn50UsQ4AAAGf7bPhCk0AgiA4C_se-MkZSo5oDLPCmgbKpl7-UBeJTpwl-_I3BbOI8K84b-ezS98_D_IDZoKrNELEMzbxxupD2QS_diYPmAeyJYxbu6rhhM43CEGWKUKspKOl",
});

const leads = [
  {
    id: "3b1234ca-bccc-8153-a70c-c2c7e7b73620",
    name: "Grupo Facta",
    slug: "facta---in-store-execution",
  },
  {
    id: "3b1234ca-bccc-81d6-91da-efbcaf89b4c6",
    name: "Full Sales System",
    slug: "full-sales-system",
  },
  {
    id: "3b1234ca-bccc-81b1-92ce-f1bb4d47e29e",
    name: "Dr. Hair Franchising",
    slug: "dr-hair-franchising",
  },
  {
    id: "3b1234ca-bccc-811c-b68b-e2714600c8d4",
    name: "MOTIM",
    slug: "motim-cc",
  },
  {
    id: "3b1234ca-bccc-8173-be47-c8a4c890a09c",
    name: "Kolab",
    slug: "kolabrh",
  },
];

const hierarchy = [
  {
    kw: "Diretor Comercial",
    checks: ["diretor comercial", "diretora comercial"],
  },
  {
    kw: "Diretor de Vendas",
    checks: ["diretor de vendas", "diretora de vendas", "diretor de venda"],
  },
  {
    kw: "Gerente de Vendas",
    checks: ["gerente de vendas", "gerente de venda"],
  },
  { kw: "Gerente Comercial", checks: ["gerente comercial"] },
  {
    kw: "Head Comercial",
    checks: ["head comercial", "head de vendas", "head de venda"],
  },
  { kw: "CEO", checks: ["ceo", "chief executive"] },
];

function headlineMatch(h: string, checks: string[]): boolean {
  return checks.some((c) => h.toLowerCase().includes(c));
}

const scriptIA = async () => {
  const results: any[] = [];

  for (const lead of leads) {
    process.stdout.write(`${lead.name}: `);
    let found: any = null;

    for (const level of hierarchy) {
      const r = await searchCompanyPeople({
        companySlug: lead.slug,
        keywordTitle: level.kw,
        includePrivateProfiles: true,
        limit: 49,
      });
      await new Promise((r) => setTimeout(r, 500));

      const match = (r.results || []).find(
        (p) =>
          p.name &&
          headlineMatch(p.headline?.toLowerCase() || "", level.checks),
      );

      if (match) {
        found = {
          name: match.name,
          headline: match.headline,
          url: match.url,
          cargo: level.kw,
        };
        console.log(`${match.name} (${level.kw})`);
        break;
      }
    }

    if (!found) console.log("nenhum");
    results.push({ company: lead.name, notionId: lead.id, dm: found });
  }

  console.log("\n===== RESULTADOS =====");
  console.log(JSON.stringify(results));
};

async function start() {
  try {
    // const response = await searchCompanyPeople({
    //   companySlug: "dr-hair-franchising",
    //   query: "Diretor Comercial",
    // });
    const response = await getUserMiniProfile("florymignon");
    console.log("response: ", response);
    // await scriptIA();
  } catch (error) {
    console.error("ERROR: ", error);
  }
  // await getCommentsByPostUrl(
  //   "https://www.linkedin.com/posts/obrunookamoto_se-voc%C3%AA-usa-o-chatgpt-para-agora-mesmo-cancela-ugcPost-7444852024854306816-h1GG?utm_source=social_share_send&utm_medium=member_desktop_web&rcm=ACoAABgQ7uMBHhkeqe_cSk1_5fNcRa3Q1TZ8j0k",
  // );
}

start();
