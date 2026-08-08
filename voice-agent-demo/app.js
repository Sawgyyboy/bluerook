(() => {
  const params = new URLSearchParams(window.location.search);
  const voiceAgentId = params.get("voiceAgentId");
  const publicKey = params.get("publicKey");
  const placeholder = document.querySelector("#agent-placeholder");

  const looksLikeRetellId =
    typeof voiceAgentId === "string" &&
    /^[a-zA-Z0-9_-]{10,}$/.test(voiceAgentId);
  const looksLikePublicKey =
    typeof publicKey === "string" &&
    /^(?:key|public_key)_[a-zA-Z0-9_-]{10,}$/.test(publicKey);

  if (!looksLikeRetellId || !looksLikePublicKey) {
    return;
  }

  placeholder.innerHTML = `
    <div class="orb" aria-hidden="true">
      <span></span><span></span><span></span>
    </div>
    <p class="placeholder-title">Retell voice agent connected</p>
    <p class="placeholder-copy">
      Use the <strong>Talk to Bluerook AI</strong> button in the lower-right
      corner to begin the conversation.
    </p>
  `;

  const script = document.createElement("script");
  script.id = "retell-widget";
  script.src = "https://dashboard.retellai.com/retell-widget-v2.js";
  script.type = "module";
  script.dataset.voicePublicKey = publicKey;
  script.dataset.voiceAgentId = voiceAgentId;
  script.dataset.title = "Bluerook AI Concierge";
  script.dataset.botName = "Bluerook AI";
  script.dataset.fabText = "Talk to Bluerook AI";
  script.dataset.popupMessage = "Ask about our services or an operational bottleneck.";
  script.dataset.showAiPopup = "true";
  script.dataset.showAiPopupTime = "3";
  script.dataset.autoOpen = "false";
  script.dataset.themeColor = "#08111E";
  script.dataset.componentColor = "#D4A437";
  document.head.appendChild(script);
})();
