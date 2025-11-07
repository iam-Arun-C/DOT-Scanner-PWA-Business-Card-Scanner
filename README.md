# DOT Scanner - PWA Business Card Scanner

DOT Scanner is a modern, privacy-focused Progressive Web App (PWA) that allows you to scan business cards using your device's camera. It uses in-browser Optical Character Recognition (OCR) to extract contact details, which are then stored securely in your browser's local storage.

No data ever leaves your device unless you choose to configure the optional Google Form integration.

![DOT Scanner Screenshot](https://user-images.githubusercontent.com/username/repo/screenshot.png) <!-- TODO: Replace with a real screenshot URL -->

### ✨ Features

-   **Progressive Web App (PWA):** Installable on your device for an app-like experience, with offline access.
-   **Client-Side OCR:** Uses Tesseract.js to perform all image recognition directly in the browser.
-   **Privacy First:** All contact data is stored in your browser's `localStorage` and is never sent to a server by default.
-   **Camera Integration:** A clean, intuitive camera interface to capture business cards.
-   **Smart Extraction:** A rule-based system attempts to intelligently parse names, emails, phone numbers, and more from the raw OCR text.
-   **Contact Management:** View, edit, and delete saved contacts.
-   **CSV Export:** Download all your saved contacts as a single `.csv` file.
-   **Optional Data Backup:** Includes a function to submit saved contact details to a Google Form for easy collection in a Google Sheet.

### 🛠️ Technology Stack

-   **Frontend:** HTML5, CSS3, Vanilla JavaScript (ES6+)
-   **Styling:** Tailwind CSS (via CDN)
-   **OCR Engine:** Tesseract.js
-   **Offline Capabilities:** Service Workers

### 🚀 Getting Started

Since this project uses no build tools and relies on CDNs, setup is extremely simple.

**1. Clone the repository:**
```bash
git clone https://github.com/your-username/dot-scanner.git
cd dot-scanner
```

**2. Run a local server:**
To ensure the Service Worker and other browser features work correctly, you should serve the files from a local web server.

-   **Using Python:**
    ```bash
    # For Python 3
    python -m http.server
    ```
-   **Using VS Code:**
    Install the [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) extension and click "Go Live" from the bottom-right status bar.

Now, open your browser and navigate to `http://localhost:8000` (or the URL provided by Live Server).

### 📝 Optional: Setting up Google Form Integration

This app can send a copy of each saved contact to a Google Sheet via a Google Form. This is useful for backing up data.

**Step 1: Create the Google Form**
1.  Go to [Google Forms](https://forms.google.com/) and create a new form.
2.  Add "Short answer" questions for each piece of data you want to collect. The recommended fields are:
    -   `Name`
    -   `Job Title`
    -   `Company`
    -   `Email`
    -   `Phone 1`
    -   `Website`
    -   `Address` (use a "Paragraph" type for this one)

**Step 2: Get the Form URL and Entry IDs**
1.  Click the "Send" button in the top right.
2.  Go to the "link" tab (🔗) and copy the form link.
3.  Open the link in a new browser tab. Right-click on the page and select "View Page Source".
4.  Search (`Ctrl+F` or `Cmd+F`) for `form action`. You will find a URL that looks like this:
    ```html
    <form action="https://docs.google.com/forms/d/e/SOME_LONG_ID/formResponse" ...>
    ```
    Copy this `formResponse` URL. This is your `formUrl`.
5.  Now, search for the names of your questions (e.g., "Name"). You will find input fields with `name` attributes like `entry.1234567890`. These `entry.xxxxxxxxxx` values are your entry IDs.

**Step 3: Update `script.js`**
1.  Open the `script.js` file.
2.  Find the `submitToGoogleForm` function.
3.  Replace the placeholder values with your own:
    ```javascript
    async function submitToGoogleForm(details) {
        // TODO: Replace with your actual Google Form URL
        const formUrl = "https://docs.google.com/forms/d/e/YOUR_FORM_ID/formResponse";

        // TODO: Replace with your actual entry IDs from your form
        const keyMap = {
            name: 'entry.YOUR_NAME_ID',
            jobTitle: 'entry.YOUR_JOBTITLE_ID',
            company: 'entry.YOUR_COMPANY_ID',
            email: 'entry.YOUR_EMAIL_ID',
            phone1: 'entry.YOUR_PHONE1_ID',
            website: 'entry.YOUR_WEBSITE_ID',
            address: 'entry.YOUR_ADDRESS_ID'
        };

        // ... rest of the function
    }
    ```

That's it! Now every time a contact is saved, it will also be sent to your Google Sheet.
