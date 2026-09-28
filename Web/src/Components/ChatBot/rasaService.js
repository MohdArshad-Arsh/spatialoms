/**
 * Rasa Service
 * Handles all API communication with Rasa server
 */

const RASA_API_URL = "http://localhost:5005/webhooks/rest/webhook";

/**
 * Send message to Rasa and get response
 */
export const sendMessageToRasa = async (message, sender = "web-user") => {
  try {
    const response = await fetch(RASA_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sender,
        message,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      console.warn("Rasa response is not an array:", data);
      return [];
    }

    return data;
  } catch (error) {
    console.error("Error communicating with Rasa:", error);
    throw error;
  }
};

/**
 * Extract text messages from Rasa response
 */
export const extractTextMessages = (rasaResponse) => {
  if (!Array.isArray(rasaResponse)) {
    return [];
  }

  return rasaResponse
    .filter((item) => item && item.text)
    .map((item) => item.text);
};
