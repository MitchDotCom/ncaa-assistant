export default async function handler(req, res) {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  const assistant_id = "asst_yFQpyxtJ1vYBMvjRvXHKV0cs"; // NHL Assistant ID
  const messages = req.body.messages;

  if (!messages || messages.length === 0) {
    return res.status(400).json({ result: "No messages provided." });
  }

  // Step 1: Create a thread
  const threadRes = await fetch("https://api.openai.com/v1/threads", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "OpenAI-Beta": "assistants=v2",
    },
  });

  const thread = await threadRes.json();
  if (!thread.id) {
    return res.status(500).json({ result: "Failed to create assistant thread." });
  }

  // Step 2: Add user message to thread
  await fetch(`https://api.openai.com/v1/threads/${thread.id}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "OpenAI-Beta": "assistants=v2",
    },
    body: JSON.stringify({
      role: "user",
      content: messages[messages.length - 1].content,
    }),
  });

  // Step 3: Try fetching file_ids from assistant config
  let file_ids = [];
  try {
    const assistantRes = await fetch(
      `https://api.openai.com/v1/assistants/${assistant_id}`,
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "OpenAI-Beta": "assistants=v2",
        },
      }
    );
    const assistantData = await assistantRes.json();
    file_ids = assistantData.tool_resources?.file_ids || [];
  } catch (err) {
    console.warn("Failed to fetch file_ids — continuing without documents.");
  }

  // Step 4: Start a run — include file_ids only if they exist
  const runPayload = {
    assistant_id,
  };
  if (file_ids.length > 0) {
    runPayload.file_ids = file_ids;
  }

  const runRes = await fetch(`https://api.openai.com/v1/threads/${thread.id}/runs`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "OpenAI-Beta": "assistants=v2",
    },
    body: JSON.stringify(runPayload),
  });

  const run = await runRes.json();
  if (!run.id) {
    return res.status(500).json({ result: "Failed to start assistant run." });
  }

  // Step 5: Poll until run completes
  let status = run.status;
  let retries = 0;
  const maxRetries = 20;

  while ((status === "queued" || status === "in_progress") && retries < maxRetries) {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    const statusRes = await fetch(
      `https://api.openai.com/v1/threads/${thread.id}/runs/${run.id}`,
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "OpenAI-Beta": "assistants=v2",
        },
      }
    );
    const statusData = await statusRes.json();
    status = statusData.status;
    retries++;
  }

  if (status !== "completed") {
    return res.status(500).json({ result: "Assistant run failed or timed out." });
  }

  // Step 6: Get the assistant response
  const messagesRes = await fetch(
    `https://api.openai.com/v1/threads/${thread.id}/messages`,
    {
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "OpenAI-Beta": "assistants=v2",
      },
    }
  );
  const messageData = await messagesRes.json();
  const assistantReply = messageData.data?.find((msg) => msg.role === "assistant");

  const resultMessage =
    assistantReply?.content?.[0]?.text?.value?.trim() ||
    "The assistant returned an empty response.";

  res.status(200).json({ result: resultMessage });
}
