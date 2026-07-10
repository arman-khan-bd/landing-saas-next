export async function generateProductDetails(productName: string) {
  const apiKey = process.env.NEXT_PUBLIC_OPENROUTER_API;
  const model = process.env.NEXT_PUBLIC_TEXT_MODEL || "meta-llama/llama-3-8b-instruct:free";

  if (!apiKey) {
    throw new Error("NEXT_PUBLIC_OPENROUTER_API key is not configured in your .env file.");
  }

  const prompt = `You are an expert copywriter. Generate product details for a product named "${productName}".
You must respond with a raw JSON object containing exactly the following keys:
{
  "shortDescription": "A concise, engaging 2-3 sentence summary/hook of the product.",
  "description": "A comprehensive, beautifully formatted HTML description of the product (using basic tags like <p>, <ul>, <li>, <strong>, <em>, <h4>). Do not include any external markdown wrapper.",
  "tags": "A comma-separated string of 5-8 relevant SEO search tags/keywords."
}
Only output the raw JSON object, without any markdown formatting blocks or extra comments.`;

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://ihut.shop",
      "X-Title": "iHut Shop AI Generator"
    },
    body: JSON.stringify({
      model: model,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) {
    throw new Error("Empty response from AI model.");
  }

  try {
    return JSON.parse(text.trim());
  } catch (parseError) {
    // Fallback parser if JSON wrap is present
    const cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleanText);
  }
}
