(async function groqQuizTester() {
  "use strict";

  // ============================================================
  // CONFIG
  // ============================================================

  const API_KEY = "Your API Key here (of groq)";

  const MODEL = "openai/gpt-oss-120b";

  const API_URL =
    "https://api.groq.com/openai/v1/chat/completions";

  const QUESTION_SELECTOR = ".que";

  const DELAY = 500;

  // ============================================================
  // LOGGING
  // ============================================================

  function log(message) {
    console.log(
      `%c[Groq Tester]%c ${message}`,
      "color:#7F77DD;font-weight:bold",
      "color:inherit"
    );
  }

  function success(message) {
    console.log(
      `%c[Groq Tester OK]%c ${message}`,
      "color:#00AA66;font-weight:bold",
      "color:inherit"
    );
  }

  function fail(message) {
    console.error(
      `%c[Groq Tester ERROR]%c ${message}`,
      "color:#FF4444;font-weight:bold",
      "color:inherit"
    );
  }

  const sleep = ms =>
    new Promise(resolve => setTimeout(resolve, ms));

  // ============================================================
  // STARTUP
  // ============================================================

  console.log(
    "%c🚀 GROQ QUIZ TESTER 🚀",
    "color:#FFD700;font-size:16px;font-weight:bold"
  );

  console.log(
    "%cModel:%c " + MODEL,
    "font-weight:bold",
    "color:#00AAFF"
  );

  console.log(
    "%cEndpoint:%c " + API_URL,
    "font-weight:bold",
    "color:#00AAFF"
  );

  console.log(
    "%cNo quiz navigation or submission will occur.",
    "color:#999"
  );

  // ============================================================
  // VALIDATE API KEY
  // ============================================================

  if (
    !API_KEY ||
    API_KEY === "PASTE_YOUR_GROQ_API_KEY_HERE"
  ) {
    fail("No API key configured.");
    return;
  }

  // ============================================================
  // QUESTION TEXT
  // ============================================================

  function getQuestionText(element) {

    const selectors = [
      ".qtext",
      ".question-text",
      ".questiontext",
      "[class*='qtext']",
      "[class*='question-text']"
    ];

    for (const selector of selectors) {

      const node =
        element.querySelector(selector);

      if (
        node &&
        node.innerText &&
        node.innerText.trim()
      ) {
        return node.innerText.trim();
      }
    }

    const paragraphs =
      [...element.querySelectorAll("p")];

    for (const p of paragraphs) {

      const text =
        p.innerText?.trim();

      if (text) {
        return text;
      }
    }

    return (
      element.innerText
        ?.split("\n")
        .map(x => x.trim())
        .find(Boolean) || ""
    );
  }

  // ============================================================
  // OPTIONS
  // ============================================================

  function getOptions(element) {

    const inputs = [
      ...element.querySelectorAll(
        "input[type='radio'], input[type='checkbox']"
      )
    ];

    return inputs.map((input, index) => {

      let label = null;

      if (input.id) {

        try {

          label =
            document.querySelector(
              `label[for="${CSS.escape(input.id)}"]`
            );

        } catch (_) {}
      }

      if (!label) {
        label =
          input.closest("label");
      }

      if (!label) {
        label =
          input.parentElement;
      }

      const text =
        label?.innerText?.trim() ||
        input.getAttribute("aria-label") ||
        input.value ||
        `Option ${index + 1}`;

      return {
        index,
        number: index + 1,
        text,
        element: input
      };
    });
  }

  // ============================================================
  // PARSE QUESTION
  // ============================================================

  function parseQuestion(element) {

    return {
      question: getQuestionText(element),
      options: getOptions(element)
    };
  }

  // ============================================================
  // GROQ REQUEST
  // ============================================================

  async function askGroq(question, options) {

    const numberedOptions =
      options
        .map(option =>
          `${option.number}. ${option.text}`
        )
        .join("\n");

    const prompt = `
Analyze this multiple-choice question.

Return ONLY the number of the best answer.
Return exactly one number from 1 to ${options.length}.
Do not include an explanation.

Question:
${question}

Options:
${numberedOptions}
`.trim();

    const response =
      await fetch(API_URL, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "Authorization":
            "Bearer " + API_KEY
        },

        body: JSON.stringify({
          model: MODEL,

          messages: [
            {
              role: "user",
              content: prompt
            }
          ],

          temperature: 0,

          max_tokens: 100
        })
      });

    const raw =
      await response.text();

    // ----------------------------------------------------------
    // HTTP ERROR
    // ----------------------------------------------------------

    if (!response.ok) {

      throw new Error(
        `Groq HTTP ${response.status}: ${raw}`
      );
    }

    // ----------------------------------------------------------
    // PARSE JSON
    // ----------------------------------------------------------

    let data;

    try {

      data =
        JSON.parse(raw);

    } catch {

      console.error(
        "%cRAW GROQ RESPONSE:",
        "color:#FF9900;font-weight:bold"
      );

      console.log(raw);

      throw new Error(
        "Groq returned invalid JSON."
      );
    }

    // ----------------------------------------------------------
    // DEBUG RESPONSE
    // ----------------------------------------------------------

    console.log(
      "%cGroq response:",
      "color:#999;font-weight:bold"
    );

    console.log(data);

    // ----------------------------------------------------------
    // EXTRACT MESSAGE
    // ----------------------------------------------------------

    const choice =
      data?.choices?.[0];

    const message =
      choice?.message;

    let reply = "";

    // Standard chat-completions response.
    if (
      typeof message?.content === "string"
    ) {
      reply =
        message.content;
    }

    // Some APIs/models can return content arrays.
    else if (
      Array.isArray(message?.content)
    ) {

      reply =
        message.content
          .map(item => {

            if (
              typeof item === "string"
            ) {
              return item;
            }

            return (
              item?.text ||
              item?.content ||
              ""
            );
          })
          .join(" ");
    }

    // Additional fallback.
    else if (
      typeof choice?.text === "string"
    ) {

      reply =
        choice.text;
    }

    // Additional fallback for structured output.
    else if (
      typeof message?.reasoning === "string"
    ) {

      reply =
        message.reasoning;
    }

    reply =
      String(reply || "").trim();

    // ----------------------------------------------------------
    // EMPTY RESPONSE
    // ----------------------------------------------------------

    if (!reply) {

      console.error(
        "%cFULL GROQ RESPONSE:",
        "color:#FF4444;font-weight:bold"
      );

      console.log(
        JSON.stringify(
          data,
          null,
          2
        )
      );

      throw new Error(
        "Groq returned an empty answer."
      );
    }

    return reply;
  }

  // ============================================================
  // EXTRACT ANSWER NUMBER
  // ============================================================

  function extractAnswer(
    reply,
    optionCount
  ) {

    const cleaned =
      String(reply)
        .trim()
        .replace(/[^\d]/g, " ");

    const numbers =
      cleaned
        .split(/\s+/)
        .filter(Boolean)
        .map(Number);

    for (const number of numbers) {

      if (
        number >= 1 &&
        number <= optionCount
      ) {
        return number;
      }
    }

    return null;
  }

  // ============================================================
  // ANALYZE QUESTION
  // ============================================================

  async function analyzeQuestion(
    element,
    questionNumber
  ) {

    const {
      question,
      options
    } = parseQuestion(element);

    console.group(
      `%cQuestion ${questionNumber}`,
      "color:#7F77DD;font-weight:bold"
    );

    // ----------------------------------------------------------
    // Validate question
    // ----------------------------------------------------------

    if (!question) {

      console.error(
        "Question text not found."
      );

      console.groupEnd();

      return {
        success: false
      };
    }

    // ----------------------------------------------------------
    // Validate options
    // ----------------------------------------------------------

    if (!options.length) {

      console.error(
        "No radio/checkbox options found."
      );

      console.log(
        "Question:",
        question
      );

      console.groupEnd();

      return {
        success: false
      };
    }

    console.log(
      "%cQuestion:",
      "font-weight:bold",
      question
    );

    console.log(
      "%cOptions:",
      "font-weight:bold"
    );

    options.forEach(option => {

      console.log(
        `${option.number}. ${option.text}`
      );

    });

    // ----------------------------------------------------------
    // Groq
    // ----------------------------------------------------------

    try {

      log(
        `Question ${questionNumber}: asking Groq...`
      );

      const reply =
        await askGroq(
          question,
          options
        );

      console.log(
        "%cRaw answer:",
        "font-weight:bold",
        reply
      );

      const answerNumber =
        extractAnswer(
          reply,
          options.length
        );

      if (answerNumber === null) {

        console.warn(
          "Could not identify a valid option number."
        );

        console.groupEnd();

        return {
          success: false,
          question,
          options,
          reply
        };
      }

      const suggested =
        options[answerNumber - 1];

      console.log(
        `%cSuggested option: ${answerNumber}`,
        "color:#00AA66;font-weight:bold"
      );

      console.log(
        "%cSuggested text:",
        "font-weight:bold",
        suggested.text
      );

      console.groupEnd();

      return {
        success: true,
        question,
        options,
        reply,
        optionNumber: answerNumber,
        answer: suggested.text
      };

    } catch (err) {

      console.error(
        err
      );

      console.groupEnd();

      return {
        success: false,
        question,
        options,
        error: err.message
      };
    }
  }

  // ============================================================
  // FIND QUESTIONS
  // ============================================================

  const questions = [
    ...document.querySelectorAll(
      QUESTION_SELECTOR
    )
  ];

  if (!questions.length) {

    fail(
      `No questions found using "${QUESTION_SELECTOR}".`
    );

    return;
  }

  log(
    `Found ${questions.length} question(s).`
  );

  // ============================================================
  // PROCESS
  // ============================================================

  const results = [];

  for (
    let i = 0;
    i < questions.length;
    i++
  ) {

    const result =
      await analyzeQuestion(
        questions[i],
        i + 1
      );

    results.push(result);

    if (
      i < questions.length - 1
    ) {
      await sleep(DELAY);
    }
  }

  // ============================================================
  // SUMMARY
  // ============================================================

  const successful =
    results.filter(
      result => result.success
    );

  console.log("");

  console.log(
    "%c========== GROQ TEST SUMMARY ==========",
    "color:#FFD700;font-weight:bold"
  );

  log(
    `Processed ${successful.length}/${questions.length} question(s).`
  );

  const summary =
    results.map(
      (result, index) => ({
        question: index + 1,

        status:
          result.success
            ? "OK"
            : "FAILED",

        suggested:
          result.optionNumber ?? "",

        answer:
          result.answer ?? "",

        error:
          result.error ?? ""
      })
    );

  console.table(summary);

  // ============================================================
  // GLOBAL DEBUG OBJECT
  // ============================================================

  window.groqQuizTestResults =
    results;

  success(
    "Results saved as window.groqQuizTestResults"
  );

  console.log(
    "%cNo answers were clicked and no quiz was submitted.",
    "color:#999"
  );

})();