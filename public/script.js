"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("chat-form");
  const input = document.getElementById("user-input");
  const chatBox = document.getElementById("chat-box");
  const submitButton = form.querySelector('button[type="submit"]');

  const conversation = [];

  function addMessage(role, text) {
    const message = document.createElement("div");
    message.classList.add("message", role === "user" ? "user-message" : "bot-message");
    message.textContent = text;

    chatBox.appendChild(message);
    chatBox.scrollTop = chatBox.scrollHeight;

    return message;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const userMessage = input.value.trim();

    if (!userMessage) {
      input.focus();
      return;
    }

    conversation.push({
      role: "user",
      text: userMessage,
    });

    addMessage("user", userMessage);
    const thinkingMessage = addMessage("model", "Thinking...");

    input.value = "";
    input.disabled = true;
    submitButton.disabled = true;

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ conversation }),
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const data = await response.json();

      if (typeof data.result !== "string" || !data.result.trim()) {
        thinkingMessage.textContent = "Sorry, no response received.";
        return;
      }

      const botReply = data.result.trim();

      thinkingMessage.textContent = botReply;

      conversation.push({
        role: "model",
        text: botReply,
      });
    } catch (error) {
      console.error("Chat request failed:", error);
      thinkingMessage.textContent = "Failed to get response from server.";
    } finally {
      input.disabled = false;
      submitButton.disabled = false;
      input.focus();
      chatBox.scrollTop = chatBox.scrollHeight;
    }
  });
});