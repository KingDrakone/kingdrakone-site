// Devolve os primeiros 5 vídeos de uma playlist do YouTube.
export default async (req) => {
  const chave = Netlify.env.get("YOUTUBE_API_KEY");
  if (!chave) return Response.json({ erro: "Falta a variável YOUTUBE_API_KEY" }, { status: 503 });
  const id = new URL(req.url).searchParams.get("id") || "";
  if (!/^[\w-]{10,60}$/.test(id)) return Response.json({ erro: "Playlist inválida" }, { status: 400 });
  try {
    const r = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,status&maxResults=15&playlistId=${id}&key=${chave}`
    );
    if (!r.ok) return Response.json({ erro: "YouTube recusou o pedido", estado: r.status }, { status: 502 });
    const videos = ((await r.json()).items || [])
      .filter((i) => i.snippet && i.snippet.resourceId && i.snippet.title !== "Private video" && i.snippet.title !== "Deleted video")
      .slice(0, 5)
      .map((i) => {
        const t = i.snippet.thumbnails || {};
        const img = (t.maxres || t.high || t.medium || t.default || {}).url || "";
        const vid = i.snippet.resourceId.videoId;
        return { titulo: i.snippet.title, miniatura: img, url: `https://www.youtube.com/watch?v=${vid}&list=${id}` };
      });
    return Response.json({ videos }, { headers: { "Cache-Control": "public, max-age=300, s-maxage=600" } });
  } catch (e) {
    return Response.json({ erro: "Falha ao contactar o YouTube" }, { status: 502 });
  }
};
