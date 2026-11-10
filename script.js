(function () {
  "use strict";

  /* =====================================================
     1. MOBILE MENU (hamburger button)
     ===================================================== */
  const menuBtn = document.getElementById("menuBtn");
  const menu = document.getElementById("menu");

  function setMenu(open) {
    if (!menu || !menuBtn) return;
    menu.classList.toggle("open", open);
    menuBtn.setAttribute("aria-expanded", String(open));
    menuBtn.setAttribute(
      "aria-label",
      open ? "Close navigation" : "Open navigation",
    );
  }

  if (menu && menuBtn) {
    // Button par click: menu khulta/band hota hai
    menuBtn.addEventListener("click", () => {
      setMenu(!menu.classList.contains("open"));
    });

    // Kisi link par click: menu band
    menu.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => setMenu(false));
    });

    // Escape dabane par band
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") setMenu(false);
    });

    // Menu ke bahar click par band
    document.addEventListener("click", (e) => {
      if (!menu.contains(e.target) && !menuBtn.contains(e.target))
        setMenu(false);
    });

    // Screen bari ho jaye to menu band kar do (CSS breakpoint 1080px se match karta hai)
    window.matchMedia("(min-width: 1081px)").addEventListener("change", (e) => {
      if (e.matches) setMenu(false);
    });
  }

  /* =====================================================
     2. ACTIVE MENU LINK (scroll karte waqt highlight)
     ===================================================== */
  const menuLinks = document.querySelectorAll(".menu a:not(.btn)");
  const sections = document.querySelectorAll("main section[id]");

  if ("IntersectionObserver" in window && sections.length) {
    const spy = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            menuLinks.forEach((link) => {
              link.classList.toggle(
                "active",
                link.getAttribute("href") === "#" + entry.target.id,
              );
            });
          }
        });
      },
      { rootMargin: "-40% 0px -55% 0px" },
    );

    sections.forEach((section) => spy.observe(section));
  }

  /* =====================================================
     3. FOOTER YEAR
     ===================================================== */
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  /* =====================================================
     4. CONTACT FORM
     Success message sirf tab jab form service confirm kare
     ===================================================== */
  const form = document.getElementById("contactForm");
  if (!form) return;

  const status = document.getElementById("formStatus");
  const submitBtn = form.querySelector("button[type=submit]");
  const btnText = submitBtn.textContent;
  let sending = false; // yeh badalta rehta hai, is liye let

  function showStatus(type, text) {
    status.className = type ? "form-status " + type : "form-status";
    status.textContent = text;
  }

  function setSending(on) {
    sending = on;
    submitBtn.disabled = on;
    submitBtn.textContent = on ? "Sending..." : btnText;
    form.setAttribute("aria-busy", String(on));
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    // Pehle se bheja ja raha hai to dobara nahi
    if (sending) return;

    // Bot ne hidden checkbox tick kiya to chupchap ruk jao
    const bot = form.elements.botcheck;
    if (bot && bot.checked) return;

    // 1. Pehle fields validate karo
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    // 2. Phir access key check karo
    const keyField = form.elements.access_key;
    const key = keyField ? keyField.value.trim() : "";
    if (!key || key.includes("YOUR")) {
      showStatus(
        "error",
        "The form is not connected yet. Please use WhatsApp or email instead.",
      );
      return;
    }

    setSending(true);
    showStatus("", "Sending your message...");

    const data = {};
    new FormData(form).forEach((value, name) => {
      data[name] = value;
    });

    // 15 second mein jawab na aaye to request cancel
    const controller =
      "AbortController" in window ? new AbortController() : null;
    const timer = controller
      ? setTimeout(() => controller.abort(), 15000)
      : null;

    fetch(form.action, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(data),
      signal: controller ? controller.signal : undefined,
    })
      .then((res) =>
        res
          .json()
          .catch(() => ({}))
          .then((result) => ({ ok: res.ok, result })),
      )
      .then((r) => {
        if (r.ok && r.result && r.result.success) {
          showStatus(
            "ok",
            "Thank you! Your message was sent. I will reply soon.",
          );
          form.reset();
        } else {
          const msg =
            r.result && r.result.message
              ? r.result.message
              : "Message could not be sent. Please use WhatsApp or email instead.";
          showStatus("error", msg);
        }
      })
      .catch(() => {
        showStatus(
          "error",
          "Message could not be sent. Please check your internet or use WhatsApp or email instead.",
        );
      })
      .then(() => {
        if (timer) clearTimeout(timer);
        setSending(false);
      });
  });
})();
