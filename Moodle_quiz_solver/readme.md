# 📚 Moodle Quiz Solver

> **Educational Testing Tool for Quality Assurance**

This script is designed for **educational and testing purposes only** to help testers efficiently validate Moodle quiz functionality.

---

## ⚠️ Disclaimer

**This script is only for educational purposes.** It is intended for:
- Testing and quality assurance of Moodle quiz systems
- Educational research
- Authorized testing environments only

**Do not use this on live academic assessments or any unauthorized platforms.**

---

## 🚀 Quick Start

### Step 1: Get Groq API Key
1. Visit [Groq Console](https://console.groq.com)
2. Sign up for a free account
3. Copy your API key

### Step 2: Set Up the Script
1. Open the `groq_quiz_solver.js` file
2. Replace the empty `API_KEY` with your Groq API key:
   ```javascript
   const API_KEY = "gsk_YOUR_API_KEY_HERE";
   ```

### Step 3: Run on Moodle Quiz Page
1. Navigate to your Moodle quiz page
2. Open **Developer Tools** (Press `F12` or `Right-click → Inspect`)
3. Go to the **Console** tab
4. Copy and paste the entire script
5. Press **Enter**

### Step 4: Watch It Work
- Script will automatically answer all visible questions
- Click "Next page" or "Finish attempt" button when prompted
- **For multi-page quizzes: Run the script on EACH page**

---

## 📋 How It Works

1. **Parses Questions** - Extracts question text and options from the page
2. **Calls Groq API** - Sends questions to Groq's AI model (llama-3.3-70b)
3. **Selects Answers** - Automatically clicks the correct option(s)
4. **Navigates Pages** - Clicks "Next page" or "Finish attempt" button

---

## ✨ Features

✅ **Multi-page quiz support** - Run on each page individually  
✅ **Multiple answer types** - Handles radio buttons and checkboxes  
✅ **Fast & reliable** - Uses Groq's fast API  
✅ **Detailed logging** - See exactly what's happening in console  
✅ **Error handling** - Gracefully handles parsing errors  

---

## 🎯 Usage Tips

### For Single Page Quizzes
- Just run the script once and it handles everything

### For Multi-Page Quizzes
- **Run the script on EACH page**
- It will auto-navigate to the next page
- Repeat until you see the final "Finish attempt" button

### Troubleshooting

**"No questions found"**
- Make sure you're on a Moodle quiz page with questions visible

**"Error: Could not parse answer"**
- Some questions may not have extractable answers
- Review manually and re-run the script

**"No Groq API response"**
- Check your API key is correct
- Ensure your Groq account has available API calls
- Check your internet connection

---

## 🔑 API Key Safety

⚠️ **IMPORTANT:**
- Never commit your API key to public repositories
- Use environment variables in production
- Rotate your key if accidentally exposed
- Free Groq API tier includes generous limits

---

## 📖 Example Console Output

```
[Groq Quiz Solver] Starting — model: llama-3.3-70b-versatile
[Groq Quiz Solver] 📚 Educational Testing Tool
[Groq Quiz Solver] Found 1 question(s)
[Groq Quiz Solver] Q1: querying Groq...
[Groq Quiz Solver] → "Which of the following is invalid..."
[Groq Quiz Solver] ✓ Selected: "Many to Many multithreading model"
[Groq Quiz Solver] All questions answered — checking for next/finish button...
[Groq Quiz Solver] → Clicking Next page button
```

---

## 🤝 Contributing

Found a bug? Have suggestions? Feel free to:
- Open an issue on GitHub
- Submit a pull request
- Share your feedback

---

## ⭐ Support This Project

If this tool helped you test Moodle quizzes effectively, please:

1. **Star the repository** ⭐  
   👉 [github.com/drb101005/AH](https://github.com/drb101005/AH)

2. **Share with other testers**

3. **Follow for updates**

Your support helps keep this project maintained and improved!

---

## 📝 License

This project is provided as-is for educational purposes.

---

## 🙋 FAQ

**Q: Is this legal?**  
A: Yes, for authorized testing environments. Always have permission before running automated tools.

**Q: Does it work on all Moodle versions?**  
A: Works on modern Moodle versions (3.0+). Some older versions may need selector adjustments.

**Q: How many API calls does it use?**  
A: One API call per question. A 10-question quiz uses ~10 API calls.

**Q: Is my data safe?**  
A: Questions are sent to Groq's API. Use your own Groq API key for privacy.

---

## 📞 Contact & Social

- **GitHub:** [drb101005](https://github.com/drb101005)
- **Repository:** [AH/Moodle_quiz_solver](https://github.com/drb101005/AH/tree/main/Moodle_quiz_solver)

---

**Made with ❤️ for educational testing**

*Last updated: April 2026*