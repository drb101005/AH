# 📚Quiz Solver

> **Educational Testing Tool for Quality Assurance**

This script is designed for **educational and testing purposes only** to help testers efficiently validate quiz functionality.

---

## ⚠️ Disclaimer

**This script is only for educational purposes.** It is intended for:
- Testing and quality assurance of quiz systems
- Educational research
- Authorized testing environments only
**Do not use this on live academic assessments or any unauthorized platforms.**

---

## 🚀 Quick Start

### Step 1: Get Groq API Key
1. Visit [Groq Console] (https://console.groq.com/keys)
2. Sign up for a free account
3. Genrate and Copy your API key

### Step 2: Set Up the Script
1. Open the `groq_quiz_solver.js` file
2. Replace the empty `API_KEY` with your Groq API key:
   ```javascript
   const API_KEY = "gsk_YOUR_API_KEY_HERE";
   ```

### Step 3: Run on  Quiz Page
1. Navigate to your quiz page
2. Open **Developer Tools** (Press `F12` or `Right-click → Inspect`)
3. Go to the **Console** tab
4. Copy and paste the entire script
5. Press **Enter**
(You might get a warning about not pasting code you are not sure about
Just type "allow pasting")

### Step 4: Watch It Work
- Script will automatically answer all visible questions
- Click "Next page" or "Finish attempt" button when prompted
- **For multi-page quizzes: Run the script on EACH page(just spam the ⬆️ and hit enter)**

---

## 📋 How It Works

Extracts questions → sends to AI → auto-selects answers
---

## ✨ Features

✅ **Multi-page quiz support** - Run on each page individually  
✅ **Multiple answer types** - Handles radio buttons and checkboxes  
✅ **Fast & reliable** - Uses Groq's fast API  
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
- Make sure you're on a quiz page with questions visible

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

## 🤝 Contributing

Found a bug? Have suggestions? Feel free to:
- Open an issue on GitHub
- Submit a pull request
- Share your feedback

---

## ⭐ Support This Project

If this tool helped you test quizzes effectively, please:

1. **Star the repository** ⭐  
   👉 [github.com/drb101005/AH](https://github.com/drb101005/AH)

2. **Share with other :D**

3. **Follow for updates**

Your support helps keep this project maintained and improved!

---

## 📝 License

This project is provided as-is for educational purposes.

---

---

## 📞 Contact & Social

- **GitHub:** [drb101005](https://github.com/drb101005)
- **Repository:** [AH/Quiz_solver](https://github.com/drb101005/AH/tree/main/Quiz_solver)

---
**Made with ❤️ for educational testing**
