"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("chat-form");
  const input = document.getElementById("user-input");
  const chatBox = document.getElementById("chat-box");
  const submitButton = form.querySelector('button[type="submit"]');
  const welcomeMessage = document.getElementById("welcome-message");

  function hideWelcome() {
    if (welcomeMessage && !welcomeMessage.classList.contains("hidden")) {
      welcomeMessage.classList.add("hidden");
    }
  }

  const conversation = [];

  function escapeHtml(text) {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function renderInlineMarkdown(text) {
    return escapeHtml(text)
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/\*([^*]+)\*/g, "<em>$1</em>")
      .replace(/\[([^\]]+)]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  }

  function renderMarkdown(text) {
    const lines = text.split("\n");
    const html = [];
    let inCodeBlock = false;
    let codeLines = [];
    let inList = false;

    function closeList() {
      if (inList) {
        html.push("</ul>");
        inList = false;
      }
    }

    function closeCodeBlock() {
      html.push(`<pre><code>${escapeHtml(codeLines.join("\n"))}</code></pre>`);
      codeLines = [];
      inCodeBlock = false;
    }

    lines.forEach((line) => {
      if (line.trim().startsWith("```")) {
        if (inCodeBlock) {
          closeCodeBlock();
        } else {
          closeList();
          inCodeBlock = true;
        }
        return;
      }

      if (inCodeBlock) {
        codeLines.push(line);
        return;
      }

      const trimmedLine = line.trim();

      if (!trimmedLine) {
        closeList();
        return;
      }

      const headingMatch = trimmedLine.match(/^(#{1,3})\s+(.+)$/);
      if (headingMatch) {
        closeList();
        const level = headingMatch[1].length;
        html.push(`<h${level}>${renderInlineMarkdown(headingMatch[2])}</h${level}>`);
        return;
      }

      const listMatch = trimmedLine.match(/^[-*]\s+(.+)$/);
      if (listMatch) {
        if (!inList) {
          html.push("<ul>");
          inList = true;
        }
        html.push(`<li>${renderInlineMarkdown(listMatch[1])}</li>`);
        return;
      }

      closeList();
      html.push(`<p>${renderInlineMarkdown(trimmedLine)}</p>`);
    });

    if (inCodeBlock) {
      closeCodeBlock();
    }

    closeList();

    return html.join("");
  }

  function addMessage(role, text) {
    const message = document.createElement("div");
    message.classList.add("message", role === "user" ? "user-message" : "bot-message");

    if (role === "user") {
      message.textContent = text;
    } else {
      message.innerHTML = renderMarkdown(text);
    }

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

    hideWelcome();
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

      thinkingMessage.innerHTML = renderMarkdown(botReply);

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