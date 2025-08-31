import fetch from "node-fetch";

export default async function handler(req, res) {
    if(req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const { prompt, persona } = req.body;
    if(!prompt) return res.status(400).json({ error: "Prompt dibutuhkan" });

    try {
        const apiKey = process.env.OPENROUTER_API_KEY;
        const response = await fetch('https://openrouter.ai/z-ai/glm-4.5-air:free/api', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({ prompt: `[${persona||"Friendly"}] ${prompt}` })
        });
        const data = await response.json();
        res.status(200).json({ reply: data.response || "Bot tidak merespon" });
    } catch (err) {
        res.status(500).json({ error: "Gagal terhubung ke API" });
    }
}