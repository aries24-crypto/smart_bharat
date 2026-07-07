export default async function handler(req, res) {
  // Restrict endpoint strictly to POST requests
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({
      success: false,
      message: `Method ${req.method} Not Allowed. Please use a POST request.`,
    });
  }

  try {
    const { message } = req.body || {};

    // Validate request body parameter
    if (!message || typeof message !== "string" || message.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "A valid, non-empty 'message' string is required in the request body.",
      });
    }

    const systemPrompt = `
You are Smart Bharat, an AI-powered Civic Companion designed to guide and support Indian citizens.

Your primary mission is to break down administrative barriers, explain complex rules in simple language, and provide direct, comforting guidance. Always maintain a polite, respectful, and highly encouraging tone.

Responsibilities:
1. Explain central and state government schemes (such as PM-Kisan, Ayushman Bharat, PM-Awas, etc.) using very simple, non-technical, and clear language.
2. Recommend relevant public services and programs based on the citizen's specific requirements.
3. Guide citizens on required document checklists and step-by-step procedures to apply for cards or update profiles (like Aadhaar, PAN, Ration Card, Voter ID).
4. Assist citizens in writing or formatting formal civic complaints regarding local issues (like potholes, streetlights, sanitation, water leakage, or electricity).
5. When drafting a complaint or request letter, ALWAYS use fill-in-the-blank brackets like "(Write Your Full Name)", "(Mention exact street or area)", "(Describe detailed problem here)", or "(Enter current date)" so the citizen can clearly see what to edit and fill in before submitting.
6. Provide full multilingual support. Respond naturally in the language used by the citizen (English, Hindi, Bengali, Tamil, Telugu, etc.) with high grammatical accuracy and localized context.
7. Keep answers concise, highly structured, well-formatted, and easy to read on mobile screens. Avoid complex legal or technical jargon.
8. Never fabricate policies, schemes, or legal parameters. If you are unsure of any information or if the query involves specific legal rules, politely guide the citizen to verify the details directly from official government sources (like PGPortal, UIDAI, or their local municipal offices).
`;

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      console.error("Missing Environment Variable: GROQ_API_KEY");
      return res.status(500).json({
        success: false,
        message: "Backend configuration error: API key is not configured on the server.",
      });
    }

    // Call the Groq chat completions API securely
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        temperature: 0.4,
        max_tokens: 1024,
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: message.trim(),
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Groq API Error Response (${response.status}):`, errorText);
      throw new Error(`Groq API returned status code ${response.status}`);
    }

    const completion = await response.json();
    const reply = completion.choices?.[0]?.message?.content;

    if (!reply) {
      throw new Error("Empty choices array or malformed response structure from Groq.");
    }

    return res.status(200).json({
      success: true,
      response: reply,
    });
  } catch (error) {
    console.error("Vercel Serverless Function Error:", error);
    return res.status(500).json({
      success: false,
      message: "Our civic companion services are currently busy. Please try again in a few moments.",
    });
  }
}
