(async function groqQuizSolver() {
  const API_KEY = "Your API Key Here"; // <-- REPLACE WITH YOUR GROQ API KEY
  const MODEL   = "llama-3.3-70b-versatile";

  const sleep = ms => new Promise(r => setTimeout(r, ms));

  // ===== CLEAN LOGGING =====
  function log(msg) {
    console.log("%c[Groq Solver]%c " + msg,
      "color:#7F77DD;font-weight:bold",
      "color:inherit"
    );
  }

  // ===== PROMO (VISIBLE BUT NOT SPAMMY) =====
  function showPromo() {
    console.log(
      "%c🚀QUIZ SOLVER ACTIVATED 🚀",
      "color:#FFD700;font-size:16px;font-weight:bold;text-align:center"
    );

    console.log(
      "%c⭐ Star on this repo:%c https://github.com/drb101005/AH will be appricated",
      "color:#FFD700;font-weight:bold;font-size:13px",
      "color:#00AAFF;font-weight:bold;text-decoration:underline;cursor:pointer"
    );

    console.log(
      "%cAutomated answering in progress...",
      "color:#999;font-size:11px"
    );
  }

  function parseQuestion(el) {
    const qText =
      el.querySelector('.qtext, .question-text, [class*="qtext"]')
        ?.innerText?.trim() ||
      el.querySelector('p')?.innerText?.trim() ||
      el.innerText?.split("\n")[0]?.trim() || "";

    const options = [];
    el.querySelectorAll('input[type="radio"], input[type="checkbox"]')
      .forEach((inp, i) => {
        const label =
          inp.closest('label') ||
          document.querySelector(`label[for="${inp.id}"]`) ||
          inp.parentElement;

        options.push({
          el: inp,
          text: label?.innerText?.trim() || "Option " + (i + 1),
          index: i
        });
      });

    return { qText, options };
  }

  async function askGroq(question, options) {
    const numbered = options.map((o, i) => (i + 1) + ". " + o.text).join("\n");

    const prompt =
      "Reply ONLY with the number(s) of the correct answer(s), comma-separated.\n\n" +
      "Question: " + question + "\n\nOptions:\n" + numbered;

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + API_KEY
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 32,
        temperature: 0,
        messages: [{ role: "user", content: prompt }]
      })
    });

    if (!res.ok) {
      throw new Error("HTTP " + res.status);
    }

    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content?.trim() || "";

    return reply
      .split(",")
      .map(n => parseInt(n.trim()) - 1)
      .filter(n => !isNaN(n));
  }

  async function answerQuestion(el) {
    const { qText, options } = parseQuestion(el);

    if (!qText || options.length === 0) return false;

    try {
      const correct = await askGroq(qText, options);

      correct.forEach(ci => {
        if (options[ci]) options[ci].el.click();
      });

      return true;

    } catch {
      return false;
    }
  }

  function clickNext() {
    const btn =
      document.querySelector('input[type="submit"][value*="Next"]') ||
      document.querySelector('button[type="submit"]') ||
      document.querySelector('input[type="submit"]');

    if (btn) {
      btn.click();
      return true;
    }
    return false;
  }

  function clickFinish() {
    const btn =
      document.querySelector('input[type="submit"][value*="Finish"]') ||
      Array.from(document.querySelectorAll('input[type="submit"]'))
        .find(b => b.value.toLowerCase().includes('finish'));

    if (btn) {
      btn.click();
      return true;
    }
    return false;
  }

  // ===== START =====
  showPromo();

  const questions = document.querySelectorAll('.que');

  if (questions.length === 0) {
    log("No questions found");
    return;
  }

  let answered = 0;

  for (let i = 0; i < questions.length; i++) {
    const ok = await answerQuestion(questions[i]);
    if (ok) answered++;
    await sleep(300);
  }

  log(`Answered ${answered}/${questions.length}`);

  await sleep(800);

  if (clickFinish()) {
    log("Quiz finished");
    return;
  }

  if (clickNext()) {
    log("Moving to next page...");
  } else {
    log("No navigation button found");
  }

})();