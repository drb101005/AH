(async function groqQuizTester() {
  "use strict";

  const API_KEY = "your api key";
  const MODEL = "openai/gpt-oss-20b";
  const API_URL =
    "https://api.groq.com/openai/v1/chat/completions";

  const QUESTION_SELECTOR = ".que";

  const NEXT_BUTTON_SELECTORS = [
    "#mod_quiz-next-nav",
    "input[name='next']",
    "button[name='next']",
    "input[value*='Next']",
    "button"
  ];

  const ANSWER_DELAY = 100;
  const NAVIGATION_TIMEOUT = 10000;

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

  console.log(
    "%c🚀 GROQ AUTO QUIZ TESTER 🚀",
    "color:#FFD700;font-size:16px;font-weight:bold"
  );

  console.log(
    "%cModel:%c " + MODEL,
    "font-weight:bold",
    "color:#00AAFF"
  );

  console.log(
    "%cAutomatic answer selection + Next navigation enabled.",
    "color:#999"
  );

  if (
    !API_KEY ||
    API_KEY === "Your API Key here (of groq)"
  ) {
    fail("No API key configured.");
    return;
  }

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

  function parseQuestion(element) {
    return {
      question: getQuestionText(element),
      options: getOptions(element)
    };
  }

  async function askGroq(question, options) {
    const numberedOptions =
      options
        .map(option =>
          `${option.number}. ${option.text}`
        )
        .join("\n");

    const prompt = `
Choose the correct answer.

Return ONLY the option number.
Return exactly ONE number.
No explanation.
No words.
No punctuation.

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
          reasoning_effort: "low",
          include_reasoning: false,
          max_completion_tokens: 128
        })
      });

    const raw =
      await response.text();

    if (!response.ok) {
      throw new Error(
        `Groq HTTP ${response.status}: ${raw}`
      );
    }

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

    console.log(
      "%cGroq response:",
      "color:#999;font-weight:bold"
    );

    console.log(data);

    const choice =
      data?.choices?.[0];

    const message =
      choice?.message;

    let reply = "";

    if (
      typeof message?.content === "string"
    ) {
      reply =
        message.content;
    }

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

    else if (
      typeof choice?.text === "string"
    ) {
      reply =
        choice.text;
    }

    reply =
      String(reply || "").trim();

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
        `Groq returned no answer. finish_reason=${choice?.finish_reason || "unknown"}`
      );
    }

    return reply;
  }

  function extractAnswer(
    reply,
    optionCount
  ) {
    const exact =
      String(reply)
        .trim()
        .match(/^(\d+)$/);

    if (exact) {
      const number =
        Number(exact[1]);

      if (
        number >= 1 &&
        number <= optionCount
      ) {
        return number;
      }
    }

    const numbers =
      String(reply)
        .replace(/[^\d]/g, " ")
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

  async function selectAnswer(
    option,
    questionNumber
  ) {
    const input =
      option.element;

    if (!input) {
      throw new Error(
        "Answer input element not found."
      );
    }

    log(
      `Question ${questionNumber}: selecting option ${option.number}`
    );

    console.log(
      "Answer:",
      option.text
    );

    try {
      input.scrollIntoView({
        behavior: "instant",
        block: "center"
      });
    } catch (_) {}

    if (!input.checked) {
      input.click();
    }

    try {
      input.dispatchEvent(
        new Event("input", {
          bubbles: true
        })
      );

      input.dispatchEvent(
        new Event("change", {
          bubbles: true
        })
      );
    } catch (_) {}

    await sleep(ANSWER_DELAY);

    if (
      input.type === "radio" ||
      input.type === "checkbox"
    ) {
      if (!input.checked) {
        throw new Error(
          `Failed to select option ${option.number}`
        );
      }
    }

    success(
      `Question ${questionNumber}: option ${option.number} selected.`
    );
  }

  function findNextButton() {
    for (
      const selector of NEXT_BUTTON_SELECTORS
    ) {
      const elements = [
        ...document.querySelectorAll(selector)
      ];

      for (const element of elements) {
        if (!isVisible(element)) {
          continue;
        }

        const text =
          (
            element.innerText ||
            element.value ||
            element.getAttribute("aria-label") ||
            ""
          )
            .trim()
            .toLowerCase();

        if (
          element.id === "mod_quiz-next-nav"
        ) {
          return element;
        }

        if (
          /\b(next|continue)\b/i.test(text)
        ) {
          return element;
        }
      }
    }

    const allButtons = [
      ...document.querySelectorAll(
        "button, input[type='submit'], input[type='button']"
      )
    ];

    for (const button of allButtons) {
      if (!isVisible(button)) {
        continue;
      }

      const text =
        (
          button.innerText ||
          button.value ||
          button.getAttribute("aria-label") ||
          ""
        ).trim();

      if (
        /\b(next|continue)\b/i.test(text)
      ) {
        return button;
      }
    }

    return null;
  }

  function isVisible(element) {
    if (!element) {
      return false;
    }

    const style =
      window.getComputedStyle(element);

    if (
      style.display === "none" ||
      style.visibility === "hidden"
    ) {
      return false;
    }

    if (
      element.disabled ||
      element.getAttribute("aria-disabled") === "true"
    ) {
      return false;
    }

    const rect =
      element.getBoundingClientRect();

    return (
      rect.width > 0 &&
      rect.height > 0
    );
  }

  function getQuestionSignature() {
    const questions = [
      ...document.querySelectorAll(
        QUESTION_SELECTOR
      )
    ];

    if (!questions.length) {
      return "";
    }

    return questions
      .map(q =>
        getQuestionText(q)
      )
      .join("|||");
  }

  async function waitForNavigation(
    oldSignature
  ) {
    const start =
      Date.now();

    while (
      Date.now() - start <
      NAVIGATION_TIMEOUT
    ) {
      await sleep(100);

      const newSignature =
        getQuestionSignature();

      if (
        newSignature &&
        newSignature !== oldSignature
      ) {
        return true;
      }

      if (
        !newSignature &&
        oldSignature
      ) {
        continue;
      }
    }

    return false;
  }

  async function clickNext() {
    const button =
      findNextButton();

    if (!button) {
      return {
        success: false,
        reason: "Next button not found."
      };
    }

    log(
      "Clicking Next..."
    );

    try {
      button.scrollIntoView({
        behavior: "instant",
        block: "center"
      });
    } catch (_) {}

    await sleep(50);

    button.click();

    return {
      success: true
    };
  }

  async function processQuestion(
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

    if (!question) {
      console.error(
        "Question text not found."
      );

      console.groupEnd();

      return {
        success: false,
        error: "Question text not found."
      };
    }

    if (!options.length) {
      console.error(
        "No radio/checkbox options found."
      );

      console.groupEnd();

      return {
        success: false,
        question,
        error: "No options found."
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

    try {
      log(
        `Question ${questionNumber}: asking ${MODEL}...`
      );

      const startTime =
        performance.now();

      const reply =
        await askGroq(
          question,
          options
        );

      const elapsed =
        Math.round(
          performance.now() - startTime
        );

      console.log(
        `%cGroq response time: ${elapsed} ms`,
        "color:#999"
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

      if (
        answerNumber === null
      ) {
        console.warn(
          "Could not identify a valid option number."
        );

        console.groupEnd();

        return {
          success: false,
          question,
          options,
          reply,
          error: "Invalid answer number."
        };
      }

      const selected =
        options[answerNumber - 1];

      console.log(
        `%cSelected answer: ${answerNumber}`,
        "color:#00AA66;font-weight:bold"
      );

      console.log(
        selected.text
      );

      await selectAnswer(
        selected,
        questionNumber
      );

      console.groupEnd();

      return {
        success: true,
        question,
        options,
        reply,
        optionNumber: answerNumber,
        answer: selected.text
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
        error:
          err?.message ||
          String(err)
      };
    }
  }

  const results = [];

  let questionNumber = 1;

  while (true) {
    const questions = [
      ...document.querySelectorAll(
        QUESTION_SELECTOR
      )
    ].filter(isVisible);

    if (!questions.length) {
      fail(
        `No visible questions found using "${QUESTION_SELECTOR}".`
      );

      break;
    }

    let currentQuestion = null;

    for (const question of questions) {
      const inputs = [
        ...question.querySelectorAll(
          "input[type='radio'], input[type='checkbox']"
        )
      ];

      const hasOptions =
        inputs.length > 0;

      if (hasOptions) {
        currentQuestion =
          question;

        break;
      }
    }

    if (!currentQuestion) {
      fail(
        "Could not find a question with answer options."
      );

      break;
    }

    const oldSignature =
      getQuestionSignature();

    const result =
      await processQuestion(
        currentQuestion,
        questionNumber
      );

    results.push(result);

    if (!result.success) {
      fail(
        `Stopped at question ${questionNumber}.`
      );

      break;
    }

    const nextButton =
      findNextButton();

    if (!nextButton) {
      success(
        "No Next button found. This may be the final question."
      );

      break;
    }

    const nextText =
      (
        nextButton.innerText ||
        nextButton.value ||
        nextButton.getAttribute("aria-label") ||
        ""
      )
        .trim()
        .toLowerCase();

    if (
      /\b(submit|finish|attempt|quiz)\b/i.test(
        nextText
      ) &&
      !/\bnext\b/i.test(nextText)
    ) {
      console.log(
        "%cFinal/submit button detected. Stopping without clicking it.",
        "color:#FF9900;font-weight:bold"
      );

      break;
    }

    const navigation =
      await clickNext();

    if (!navigation.success) {
      fail(
        navigation.reason
      );

      break;
    }

    log(
      "Waiting for next question..."
    );

    const changed =
      await waitForNavigation(
        oldSignature
      );

    if (!changed) {
      await sleep(500);

      const newSignature =
        getQuestionSignature();

      if (
        !newSignature ||
        newSignature === oldSignature
      ) {
        fail(
          "Next was clicked, but the next question was not detected."
        );

        console.log(
          "If your website uses a custom Next button, change NEXT_BUTTON_SELECTORS."
        );

        break;
      }
    }

    success(
      `Moved to question ${questionNumber + 1}.`
    );

    questionNumber++;

    await sleep(50);
  }

  console.log("");

  console.log(
    "%c========== GROQ AUTO QUIZ SUMMARY ==========",
    "color:#FFD700;font-weight:bold"
  );

  const successful =
    results.filter(
      result => result.success
    );

  log(
    `Processed ${successful.length}/${results.length} question(s).`
  );

  const summary =
    results.map(
      (result, index) => ({
        question: index + 1,

        status:
          result.success
            ? "OK"
            : "FAILED",

        selected:
          result.optionNumber ?? "",

        answer:
          result.answer ?? "",

        error:
          result.error ?? ""
      })
    );

  console.table(summary);

  window.groqQuizTestResults =
    results;

  success(
    "Results saved as window.groqQuizTestResults"
  );

  console.log(
    "%cAutomation stopped.",
    "color:#999"
  );

})();
