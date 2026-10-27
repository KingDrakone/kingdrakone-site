// Devolve o número de inscritos do canal King Drakone.
// A chave da API fica guardada na Netlify (variável YOUTUBE_API_KEY) e nunca aparece no site.
const CANAL_PADRAO = "UCqokNdkmIcKAOzJaVzYLevQ";

export default async () => {
  const chave = Netlify.env.get("YOUTUBE_API_KEY");
  const canal = Netlify.env.get("YOUTUBE_CHANNEL_ID") || CANAL_PADRAO;

  if (!chave) {
    return Response.json({ erro: "Falta a variável YOUTUBE_API_KEY" }, { status: 503 });
  }

  try {
    const url =
      "https://www.googleapis.com/youtube/v3/channels?part=statistics&id=" +
      encodeURIComponent(canal) +
      "&key=" +
      encodeURIComponent(chave);
    const resposta = await fetch(url);
    if (!resposta.ok) {
      return Response.json({ erro: "O YouTube recusou o pedido" }, { status: 502 });
    }
    const dados = await resposta.json();
    const stats = dados.items && dados.items[0] && dados.items[0].statistics;
    if (!stats || stats.hiddenSubscriberCount) {
      return Response.json({ erro: "Número de inscritos indisponível" }, { status: 404 });
    }
    return Response.json(
      { inscritos: Number(stats.subscriberCount), atualizado: new Date().toISOString() },
      { headers: { "Cache-Control": "public, max-age=60, s-maxage=300" } }
    );
  } catch (e) {
    return Response.json({ erro: "Falha ao contactar o YouTube" }, { status: 502 });
  }
};
