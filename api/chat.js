import express from "express";
import Groq from "groq-sdk";

const router = express.Router();

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

router.post("/", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({
        success: false,
        message: "Message is required.",
      });
    }

    const systemPrompt = `
You are Smart Bharat, an AI Powered Civic Companion.

Your role is to assist Indian citizens with government-related services.

Responsibilities:
- Explain government schemes in simple language.
- Recommend relevant public services.
- Guide users about required documents.
- Help users understand application procedures.
- Assist in reporting civic issues.
- Explain complaint tracking.
- Provide multilingual support when requested.
- Keep answers concise, accurate, and easy to understand.
- Never fabricate government policies or legal information.
- If unsure, clearly mention that official government sources should be verified.
`;

    const completion = await groq.chat.completions.create({
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
          content: message,
        },
      ],
    });

    const reply =
      completion.choices?.[0]?.message?.content ||
      "I'm sorry, I couldn't generate a response.";

    return res.status(200).json({
      success: true,
      response: reply,
    });
  } catch (error) {
    console.error("Groq Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to generate response.",
    });
  }
});

export default router;
