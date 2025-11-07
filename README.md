# DOT Scanner - PWA Business Card Scanner

![GitHub stars](https://img.shields.io/github/stars/iam-Arun-C/DOT-Scanner-PWA-Business-Card-Scanner?style=social)
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Technology](https://img.shields.io/badge/tech-Vanilla%20JS-yellow.svg)
![PWA Ready](https://img.shields.io/badge/PWA-Ready-brightgreen.svg)

DOT Scanner is a modern, privacy-focused Progressive Web App (PWA) that transforms your device into a powerful business card scanner. It uses in-browser Optical Character Recognition (OCR) to instantly extract contact details, which are then stored securely in your browser's local storage.

**No data ever leaves your device** unless you choose to configure the optional Google Form integration for personal backup.

---

### ✨ Live Demo

**[Try DOT Scanner Here!](https://iam-arun-c.github.io/DOT-Scanner-PWA-Business-Card-Scanner/)**

https://iam-arun-c.github.io/DOT-Scanner-PWA-Business-Card-Scanner/preview.png

*(Note: The live demo is hosted on GitHub Pages. Feel free to scan, save, and test all features.)*

---

### 🎥 App in Action

![DOT Scanner Demo GIF](https://github.com/iam-Arun-C/DOT-Scanner-PWA-Business-Card-Scanner/blob/main/demo.gif?raw=true) 
<!-- TODO: Create a 'demo.gif' and upload it to your repository to make this link work. You can use a tool like 'ScreenToGif' or 'LiceCap'. -->

---

### 🚀 Features

-   **📱 Progressive Web App (PWA):** Installable on mobile or desktop for a native, app-like experience with offline access.
-   **👁️ Client-Side OCR:** Utilizes Tesseract.js to perform all image recognition directly in the browser. Fast, efficient, and private.
-   **🔐 Privacy First:** All contact data is stored exclusively in your browser's `localStorage`.
-   **📸 Modern Camera Interface:** A clean, intuitive camera view with a card-shaped overlay to guide your scan.
-   **🧠 Smart Extraction:** A rule-based system intelligently parses names, emails, phone numbers, and more from the raw OCR text.
-   **✏️ Full Contact Management:** Easily view, edit, and delete your saved contacts.
-   **📄 CSV Export:** Download all your saved contacts as a single `.csv` file, ready for import into other applications.
-   **☁️ Optional Data Backup:** Includes a simple function to submit saved contacts to a personal Google Form, creating an automatic backup in a Google Sheet.

### 🛠️ Technology Stack

-   **Frontend:** HTML5, CSS3, Vanilla JavaScript (ES6+)
-   **Styling:** Tailwind CSS (via CDN for rapid development)
-   **OCR Engine:** Tesseract.js
-   **Offline Capabilities:** Service Workers

---

### 💻 Getting Started (Local Setup)

Since this project uses no build tools and relies on CDNs, setup is extremely simple.

**1. Clone the repository:**
```bash
git clone https://github.com/iam-Arun-C/DOT-Scanner-PWA-Business-Card-Scanner.git
cd DOT-Scanner-PWA-Business-Card-Scanner
```

**2. Run a local server:**
To ensure the Service Worker and other browser features function correctly, you must serve the files from a local web server.

-   **Using the VS Code Live Server extension (Recommended):**
    1.  Install the [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) extension.
    2.  Right-click on `index.html` and select `Open with Live Server`.

-   **Using Python:**
    ```bash
    # For Python 3
    python -m http.server
    ```

Now, open your browser and navigate to the local URL provided.

---

### 📝 Configuration (Optional Google Form Backup)

You can configure the app to send a copy of each saved contact to a Google Sheet for backup. This uses a Google Form as a free and simple API endpoint.

**Step 1: Create the Google Form**
1.  Go to [Google Forms](https://forms.google.com/) and create a new, blank form.
2.  Add "Short answer" questions for each field. **Use these exact titles:**
    -   `Name`
    -   `Job Title`
    -   `Company`
    -   `Email`
    -   `Phone 1`
    -   `Website`
    -   `Address` (use a "Paragraph" question type for this one)
3.  (Optional) Go to the "Responses" tab and click the Google Sheets icon to create a spreadsheet where your data will be saved.

**Step 2: Get the Pre-filled Link Details (The Easy Way!)**
1.  While in the form editor, click the **three-dot menu (⋮)** in the top-right corner.
2.  Select **"Get pre-filled link"**.
3.  A new tab will open with your form. Fill in each field with placeholder text (e.g., "TEST NAME" in the Name field, "TEST EMAIL" in the Email field, etc.).
4.  Click the **"Get link"** button at the bottom of the page, then click **"COPY LINK"**.

**Step 3: Extract the URL and Entry IDs**
1.  Paste the copied link into a text editor. It will look very long, something like this:
    ```
    https://docs.google.com/forms/d/e/LONG_FORM_ID/viewform?usp=pp_url&entry.12345=TEST+NAME&entry.67890=TEST+JOB+TITLE...
    ```
2.  **Get the Form URL:** Copy the first part of the link and change `viewform` to `formResponse`.
    -   **Your link:** `https://docs.google.com/forms/d/e/LONG_FORM_ID/viewform?...`
    -   **Change it to:** `https://docs.google.com/forms/d/e/LONG_FORM_ID/formResponse`
3.  **Get the Entry IDs:** The `entry.xxxxxxxx` parts are your unique IDs.
    -   `entry.12345` corresponds to your "Name" field.
    -   `entry.67890` corresponds to your "Job Title" field, and so on.

**Step 4: Update `script.js`**
1.  Open the `script.js` file and find the `submitToGoogleForm` function.
2.  Replace the placeholder values with your URL and Entry IDs.

    ```javascript
    // --- GOOGLE FORM SUBMISSION (OPTIONAL) ---
    async function submitToGoogleForm(details) {
        // TODO: Replace with your actual Google Form URL
        const formUrl = "https://docs.google.com/forms/d/e/YOUR_FORM_ID_HERE/formResponse";

        // If no formUrl is provided, silently skip submission.
        if (!formUrl || formUrl.includes("YOUR_FORM_ID_HERE")) {
            console.log("Google Form URL not provided. Skipping submission.");
            return;
        }

        // TODO: Replace with your actual entry IDs from your pre-filled link
        const keyMap = {
            name: 'entry.12345', // Replace with your Name ID
            jobTitle: 'entry.67890', // Replace with your Job Title ID
            company: 'entry.11111', // etc.
            email: 'entry.22222',
            phone1: 'entry.33333',
            website: 'entry.44444',
            address: 'entry.55555'
        };
        
        // ... rest of the function (no changes needed below)
    }
    ```

That's it! Now every time you save a contact, it will be automatically backed up to your Google Sheet.

### 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/iam-Arun-C/DOT-Scanner-PWA-Business-Card-Scanner/issues).

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

### 📜 License

Distributed under the MIT License. See `LICENSE` for more information.

---
Made with ❤️ by Arun C
