import axios from "axios";

export const sendChatMessage = async (bearerToken, userMessage, conversationContext, model) => {
  const payload = {
    model: model,
    message: userMessage,
    context: conversationContext,
  };

  try {
    const response = await axios.post(`/llm/`, payload, {
      headers: {
        Authorization: `Bearer ${bearerToken}`,
        "Content-Type": "application/json",
      },
      timeout: 60000,
    });
    return response.data || "No response from API.";
  } catch (error) {
    console.error("sendChatMessage API call failed:", error);
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data);
    }
    return "Error generating response.";
  }
};

export const getAvailableModels = async (bearerToken) => {
  try {
    const response = await axios.get(`/options/`, {
      headers: {
        Authorization: `Bearer ${bearerToken}`,
        "Content-Type": "application/json",
      },
      timeout: 60000,
    });
    const options = response.data;
    const models = options
      .filter((opt) => opt.endpointName === "llm/")
      .map((opt) => ({ name: opt.name, apiName: opt.apiName }));
    return models;
  } catch (error) {
    console.error("getAvailableModels API call failed:", error);
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data);
    }
    return [];
  }
};

export const getTextToSpeech = async (bearerToken, text, model = "default", speed = 1) => {
  const encoded = btoa(unescape(encodeURIComponent(text)));

  try {
    const res = await axios.get("/tts/", {
      headers: {
        Authorization: `Bearer ${bearerToken}`,
        model,
        message: encoded,
        speed,
      },
      responseType: "arraybuffer", 
      timeout: 60000,
    });

    const ct = res.headers["content-type"] || "";
    if (ct.startsWith("application/json")) {
      const json = JSON.parse(new TextDecoder().decode(res.data));
      return json.audioUrl || json.audioBase64 || "";
    }

    const blob = new Blob([res.data], { type: ct || "audio/mpeg" });
    return URL.createObjectURL(blob);
  } catch (err) {
    console.error("getTextToSpeech API call failed:", err);
    return "";
  }
};


export const sendSpeechToText = async (bearerToken, audioBlob, model = "default") => {
  const form = new FormData();
  form.append("model", model);
  form.append("message", audioBlob, "speech.webm");

  try {
    const res = await axios.post("/stt/", form, {
      headers: { Authorization: `Bearer ${bearerToken}` },
      timeout: 60000,
    });

    console.log("STT raw response:", res.data);


    return res.data;
  } catch (err) {
    console.error("sendSpeechToText API call failed:", err);
    return "";
  }
};