# DOT Scanner - PWA Business Card Scanner

![GitHub stars](https://img.shields.io/github/stars/iam-Arun-C/DOT-Scanner-PWA-Business-Card-Scanner?style=social)
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Technology](https://img.shields.io/badge/tech-Vanilla%20JS-yellow.svg)
![PWA Ready](https://img.shields.io/badge/PWA-Ready-brightgreen.svg)

DOT Scanner is a modern, privacy-focused Progressive Web App (PWA) that transforms your device into a powerful business card scanner.  
It uses in-browser Optical Character Recognition (OCR) to instantly extract contact details, which are stored securely in your browser's local storage.

**No data ever leaves your device** unless you enable the optional Google Form integration for personal backups.

---

## ✨ Live Demo

**[👉 Try DOT Scanner Here](https://iam-arun-c.github.io/DOT-Scanner-PWA-Business-Card-Scanner/)**

![DOT Scanner Preview](https://raw.githubusercontent.com/iam-Arun-C/DOT-Scanner-PWA-Business-Card-Scanner/main/preview.png)

*(Note: The live demo is hosted on GitHub Pages. You can scan, save, and test all features directly from your browser.)*

---

## 🎥 App in Action

> **Tip:** Create and upload a short GIF of your app (named `demo.gif`) using tools like [ScreenToGif](https://www.screentogif.com/) or [LiceCap](https://www.cockos.com/licecap/).

---

## 🚀 Features

- **📱 Progressive Web App (PWA):** Installable on mobile or desktop, works offline, and feels like a native app.  
- **👁️ Client-Side OCR:** Powered by Tesseract.js — everything runs locally in your browser.  
- **🔐 Privacy First:** Contact data is stored only in your browser's `localStorage`.  
- **📸 Clean Camera Interface:** Includes a guided card-shaped overlay for accurate scanning.  
- **🧠 Smart Extraction:** Automatically detects and parses names, emails, phone numbers, and more.  
- **✏️ Contact Management:** View, edit, and delete saved contacts easily.  
- **📄 CSV Export:** Download all your contacts as a single `.csv` file.  
- **☁️ Optional Google Form Backup:** Sync data to Google Sheets using your own form setup.  

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-------------|
| Frontend | HTML5, CSS3, Vanilla JS (ES6+) |
| Styling | Tailwind CSS (via CDN) |
| OCR Engine | Tesseract.js |
| Offline Support | Service Workers |
| Deployment | GitHub Pages / Any Static Host |

---

## 💻 Getting Started (Local Setup)

No build tools or dependencies — it’s plug and play.

### 1. Clone the Repository
```bash
git clone https://github.com/iam-Arun-C/DOT-Scanner-PWA-Business-Card-Scanner.git
cd DOT-Scanner-PWA-Business-Card-Scanner
````

### 2. Run a Local Server

To use the Service Worker, the app must be served via `http://localhost`.

#### Option A — VS Code Live Server (Recommended)

1. Install the [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) extension.
2. Right-click `index.html` → **Open with Live Server**

#### Option B — Python HTTP Server

```bash
# For Python 3
python -m http.server
```

Then open your browser at the provided URL (usually [http://localhost:8000](http://localhost:8000)).

---

## 📝 Google Form Backup (Optional)

You can optionally connect DOT Scanner to a Google Form to automatically back up your contacts.

### Step 1: Create the Google Form

1. Go to [Google Forms](https://forms.google.com/) → Create a **Blank Form**
2. Add these **Short Answer** fields (exact names):

   * `Name`
   * `Job Title`
   * `Company`
   * `Email`
   * `Phone 1`
   * `Website`
   * `Address` (set as “Paragraph” type)
3. Go to **Responses → Google Sheets icon** to link to a spreadsheet.

---

### Step 2: Get the Pre-filled Link

1. Click the **⋮ (three-dot menu)** → **Get pre-filled link**
2. Enter sample text in each field and click **Get link** → **Copy link**

It’ll look something like this:

```
https://docs.google.com/forms/d/e/LONG_FORM_ID/viewform?usp=pp_url&entry.12345=TEST+NAME&entry.67890=TEST+EMAIL
```

---

### Step 3: Extract the URL and Entry IDs

* Replace `viewform` with `formResponse`

  ```
  https://docs.google.com/forms/d/e/LONG_FORM_ID/formResponse
  ```
* Copy the unique `entry.xxxxx` codes for each field (they’re your field IDs).

---

### Step 4: Update `script.js`

Open your project’s `script.js`, find the `submitToGoogleForm` function, and replace with:

```javascript
// --- GOOGLE FORM SUBMISSION (OPTIONAL) ---
async function submitToGoogleForm(details) {
    const formUrl = "https://docs.google.com/forms/d/e/YOUR_FORM_ID_HERE/formResponse";

    if (!formUrl || formUrl.includes("YOUR_FORM_ID_HERE")) {
        console.log("Google Form URL not provided. Skipping submission.");
        return;
    }

    const keyMap = {
        name: 'entry.12345',
        jobTitle: 'entry.67890',
        company: 'entry.11111',
        email: 'entry.22222',
        phone1: 'entry.33333',
        website: 'entry.44444',
        address: 'entry.55555'
    };

    const formData = new FormData();
    for (let key in keyMap) {
        formData.append(keyMap[key], details[key] || '');
    }

    await fetch(formUrl, { method: 'POST', mode: 'no-cors', body: formData });
    console.log('Data sent to Google Form');
}
```

Every saved contact will now also get backed up to your Google Sheet automatically.

---

## 🤝 Contributing

Contributions and suggestions are always welcome.

1. Fork this repository
2. Create a new branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m "Add AmazingFeature"`)
4. Push to your branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request



## 📜 License

Distributed under the **MIT License**.
See [`LICENSE`](./LICENSE) for full details.



### 🧠 Credits

* **Developer:** [Arun C](https://github.com/iam-Arun-C)
* **OCR Engine:** [Tesseract.js](https://github.com/naptha/tesseract.js)
* **Hosting:** [GitHub Pages](https://pages.github.com/)



Made with ❤️ by Arun C

