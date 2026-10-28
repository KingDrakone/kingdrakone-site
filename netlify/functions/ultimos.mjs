// Lê os últimos uploads do canal e separa vídeos, Shorts e lives.
const CANAL_PADRAO = "UCqokNdkmIcKAOzJaVzYLevQ";

const segundos = (iso) => {
  const m = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(iso || "");
  if (!m) return 0;
  return (+m[1] || 0) * 3600 + (+m[2] || 0) * 60 + (+m[3] || 0);
};

export default async () => {
  const chave = Netlify.env.get("YOUTUBE_API_KEY");
  const canal = Netlify.env.get("YOUTUBE_CHANNEL_ID") || CANAL_PADRAO;
  if (!chave) return Response.json({ erro: "Falta a variável YOUTUBE_API_KEY" }, { status: 503 });
  try {
    const uploads = "UU" + canal.slice(2);
    const r1 = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails&maxResults=50&playlistId=${uploads}&key=${chave}`
    );
    if (!r1.ok) return Response.json({ erro: "YouTube recusou o pedido", estado: r1.status }, { status: 502 });
    const ids = ((await r1.json()).items || []).map((i) => i.contentDetails.videoId);
    if (!ids.length) return Response.json({ videos: [], shorts: [], live: null });
    const r2 = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,liveStreamingDetails&id=${ids.join(",")}&key=${chave}`
    );
    if (!r2.ok) return Response.json({ erro: "YouTube recusou o pedido", estado: r2.status }, { status: 502 });
    const lista = ((await r2.json()).items || []).map((v) => {
      const t = v.snippet.thumbnails || {};
      const img = (t.maxres || t.high || t.medium || t.default || {}).url || "";
      return {
        id: v.id,
        titulo: v.snippet.title,
        miniatura: img,
        segundos: segundos(v.contentDetails.duration),
        estado: v.snippet.liveBroadcastContent,
        inicio: v.liveStreamingDetails && v.liveStreamingDetails.scheduledStartTime,
        publicado: v.snippet.publishedAt,
      };
    });
    lista.sort((a, b) => (a.publicado < b.publicado ? 1 : -1));
    const normais = lista.filter((v) => v.estado === "none");
    const shorts = normais
      .filter((v) => v.segundos > 0 && v.segundos <= 60)
      .map((v) => ({ ...v, url: `https://www.youtube.com/shorts/${v.id}` }));
    const videos = normais
      .filter((v) => v.segundos > 60)
      .map((v) => ({ ...v, url: `https://www.youtube.com/watch?v=${v.id}` }));
    const aoVivo = lista.find((v) => v.estado === "live");
    const agendadas = lista.filter((v) => v.estado === "upcoming").sort((a, b) => (a.inicio > b.inicio ? 1 : -1));
    const escolhida = aoVivo || agendadas[0] || null;
    const live = escolhida
      ? { id: escolhida.id, titulo: escolhida.titulo, estado: escolhida.estado, inicio: escolhida.inicio, url: `https://www.youtube.com/watch?v=${escolhida.id}` }
      : null;
    return Response.json(
      { videos, shorts, live },
      { headers: { "Cache-Control": "public, max-age=120, s-maxage=300" } }
    );
  } catch (e) {
    return Response.json({ erro: "Falha ao contactar o YouTube" }, { status: 502 });
  }
};
