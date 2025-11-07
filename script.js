// --- STATE MANAGEMENT ---
const AppState = {
  appState: 'welcome',
  contacts: [],
  editingContact: null,
  rawText: '',
  error: null,
  isLoading: false,
  stream: null,
  deferredPrompt: null,
};

// --- UTILS ---
const generateCSV = (contacts) => {
    const headers = ['Name', 'Job Title', 'Company', 'Email', 'Phone 1', 'Phone 2', 'Website', 'Address'];
    const rows = contacts.map(c => `"${c.name||''}","${c.jobTitle||''}","${c.company||''}","${c.email||''}","${c.phone1||''}","${c.phone2||''}","${c.website||''}","${(c.address||'').replace(/"/g,'""')}"`);
    return [headers.join(','), ...rows].join('\n');
};

const preprocessImage = (sourceCanvas) => {
    const resizeCanvas = document.createElement('canvas');
    const resizeCtx = resizeCanvas.getContext('2d');
    const targetWidth = 1200;
    const aspectRatio = sourceCanvas.height / sourceCanvas.width;
    const targetHeight = targetWidth * aspectRatio;
    resizeCanvas.width = targetWidth;
    resizeCanvas.height = targetHeight;
    resizeCtx.drawImage(sourceCanvas, 0, 0, targetWidth, targetHeight);
    
    const ctx = resizeCtx;
    const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
    const data = imageData.data; 
    const contrast = 2.0;
    const intercept = 128 * (1 - contrast);
    for (let i = 0; i < data.length; i += 4) {
      const gray = 0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2];
      let contrasted = Math.max(0, Math.min(255, gray * contrast + intercept));
      data[i] = data[i+1] = data[i+2] = contrasted;
    }
    ctx.putImageData(imageData, 0, 0); 
    return resizeCanvas.toDataURL('image/jpeg', 0.9);
};

// --- CONTACT DETAILS EXTRACTION LOGIC ---
const extractContactDetails = (text) => {
    const cleanedText = text.replace(/[^a-zA-Z0-9\s@.\-]/g, '');
    let lines = cleanedText.split('\n').map(l => l.trim()).filter(l => l && l.length > 2);
    const result = { name: '', jobTitle: '', email: '', phone1: '', phone2: '', company: '', website: '', address: '' };
    const usedLines = new Set();

    // Pass 1: Extract Email first, as it's the primary source for Name and Company.
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
    for (const line of lines) {
        const emailMatch = line.match(emailRegex);
        if (emailMatch) {
            result.email = emailMatch[0].toLowerCase();
            usedLines.add(line);
            break; // Find the first email and stop.
        }
    }
    
    // Pass 2: **High Priority Rule:** Derive Name, Website, and Company ONLY from email.
    if (result.email) {
        const [alias, domain] = result.email.split('@');
        result.name = alias.replace(/[._\d-]/g, ' ').split(' ').map(n => n.charAt(0).toUpperCase() + n.slice(1)).join(' ').trim();
        result.website = `www.${domain}`;
        const companyDomain = domain.split('.')[0];
        const freeProviders = ['gmail', 'yahoo', 'outlook', 'hotmail', 'aol', 'icloud'];
        if (!freeProviders.includes(companyDomain)) {
            result.company = companyDomain.charAt(0).toUpperCase() + companyDomain.slice(1);
        }
    }

    // Pass 3: Extract Phones from all lines
    lines.forEach(line => {
        const phoneMatches = line.match(/(?:(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}/g);
        if (phoneMatches) {
            phoneMatches.forEach(p => {
                if (p.replace(/\D/g, '').length >= 7) {
                    if (!result.phone1) {
                        result.phone1 = p;
                        usedLines.add(line);
                    } else if (!result.phone2) {
                        result.phone2 = p;
                        usedLines.add(line);
                    }
                }
            });
        }
    });

    let remainingLines = lines.filter(line => !usedLines.has(line));

    // Pass 4: Address Extraction (anchored by PIN code)
    const pincodeRegex = /\b\d{6}\b/;
    let pinLineIndex = -1;
    remainingLines.forEach((line, index) => { if (pincodeRegex.test(line)) pinLineIndex = index; });

    if (pinLineIndex !== -1) {
        let addressBlock = [];
        for (let i = pinLineIndex; i >= 0; i--) {
            const currentLine = remainingLines[i];
            addressBlock.unshift(currentLine);
            usedLines.add(currentLine);
            const prevLine = i > 0 ? remainingLines[i - 1] : null;
            if (!prevLine || prevLine.split(/\s+/).length < 2) break;
        }
        result.address = addressBlock.join('\n');
        remainingLines = remainingLines.filter(line => !usedLines.has(line));
    }

    // Pass 5: Job Title Extraction (max 3 words)
    const jobKeywords = ['manager', 'director', 'president', 'founder', 'engineer', 'developer', 'designer', 'consultant', 'executive', 'officer', 'representative', 'sales', 'ceo', 'cto', 'cfo'];
    remainingLines.forEach(line => {
        const words = line.split(/\s+/);
        if (words.length > 0 && words.length <= 3 && jobKeywords.some(kw => line.toLowerCase().includes(kw))) {
            if (!result.jobTitle) { // Take the first valid one
                result.jobTitle = line;
                usedLines.add(line);
            }
        }
    });
    
    return result;
};


// --- HTML TEMPLATES ---
const WelcomeScreenHTML = () => `
  <div class="flex flex-col items-center justify-center h-screen bg-gray-900 p-8 text-center bg-gradient-to-br from-gray-900 to-indigo-900/50">
    <div class="mb-8 pulse-slow-animation">
      <svg class="w-24 h-24 mx-auto text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" /><circle cx="12" cy="13" r="3" /></svg>
    </div>
    <h1 class="text-4xl md:text-5xl font-bold text-white mb-4 animate-fadeIn-1s">DOT Scanner</h1>
    <p class="text-lg text-gray-300 mb-10 max-w-xl mx-auto animate-fadeIn-1s">Scan business cards instantly. All data is stored securely in your browser.</p>
    <button id="start-scan-btn" class="px-8 py-4 bg-indigo-600 text-white font-bold text-lg rounded-full shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500 focus:ring-opacity-50 transition-all duration-300 transform hover:scale-105 animate-fadeIn-1s">Start Scanning</button>
  </div>`;

const LoadingIndicatorHTML = (message) => `
  <div class="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-gray-900 to-indigo-900/50 text-white">
    <div class="relative flex items-center justify-center w-20 h-20">
      <div class="absolute w-full h-full border-4 border-indigo-500/50 rounded-full"></div>
      <div class="absolute w-full h-full border-t-4 border-indigo-400 rounded-full animate-spin"></div>
    </div>
    <p class="mt-6 text-lg font-semibold text-gray-300 tracking-wider animate-text-pulse">${message}</p>
  </div>`;

const ErrorScreenHTML = (message) => `
  <div class="flex flex-col items-center justify-center h-screen bg-gray-900 p-4 text-center">
    <h2 class="text-2xl font-bold text-red-500 mb-4">An Error Occurred</h2>
    <p class="text-gray-300 mb-6 max-w-md">${message}</p>
    <button id="reset-app-btn" class="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700">Go Back</button>
  </div>`;

const PwaInstallBannerHTML = () => `
  <div class="bg-indigo-600 p-4 w-full max-w-lg mx-auto rounded-lg shadow-2xl flex items-center justify-between gap-4 animate-fadeIn-1s">
    <div class="flex items-center">
      <svg class="w-8 h-8 text-white flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M6 20v-2h12v2H6ZM12 4 6 10h3v4h6v-4h3l-6-6Z"/></svg>
      <div class="ml-4">
        <p class="font-bold text-white">Install DOT Scanner</p>
        <p class="text-sm text-indigo-200">Get a faster, offline-ready experience.</p>
      </div>
    </div>
    <div class="flex gap-2">
      <button id="pwa-install-btn" class="bg-white text-indigo-700 font-bold py-2 px-4 rounded-md text-sm">Install</button>
      <button id="pwa-dismiss-btn" class="bg-indigo-900/50 text-white font-bold py-2 px-4 rounded-md text-sm">Later</button>
    </div>
  </div>`;

const ScannerFabHTML = () => `
    <button id="scan-fab-btn" class="scanner-fab">
        <svg class="scanner-fab-icon w-6 h-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
    </button>`;

const CameraCaptureHTML = () => `
  <div class="fixed inset-0 bg-black/80 flex items-center justify-center z-50 animate-fadeIn-1s" id="camera-backdrop">
    <div class="relative w-full max-w-2xl h-[70vh] bg-black rounded-lg overflow-hidden shadow-2xl">
      <video id="camera-video" autoplay playsinline class="absolute top-0 left-0 w-full h-full object-cover"></video>
      <div class="absolute inset-0 flex items-center justify-center">
          <div class="w-full max-w-lg aspect-[85/55] relative scanner-cutout" id="scanner-cutout">
              <div class="absolute inset-0 pointer-events-none">
                <div class="absolute top-0 left-0 w-8 h-8 md:w-12 md:h-12 border-t-2 border-l-2 border-white/80 rounded-tl-2xl"></div>
                <div class="absolute top-0 right-0 w-8 h-8 md:w-12 md:h-12 border-t-2 border-r-2 border-white/80 rounded-tr-2xl"></div>
                <div class="absolute bottom-0 left-0 w-8 h-8 md:w-12 md:h-12 border-b-2 border-l-2 border-white/80 rounded-bl-2xl"></div>
                <div class="absolute bottom-0 right-0 w-8 h-8 md:w-12 md:h-12 border-b-2 border-r-2 border-white/80 rounded-br-2xl"></div>
                <div class="absolute top-0 left-0 right-0 h-full scan-line-container"><div class="w-full h-0.5 bg-indigo-400 shadow-[0_0_15px_5px_rgba(79,70,229,0.6)]"></div></div>
              </div>
          </div>
      </div>
      <div class="absolute bottom-4 left-0 right-0 z-10">
        <div class="w-full flex justify-center"><button id="capture-btn" class="w-16 h-16 bg-white/20 backdrop-blur-md border-2 border-white/50 rounded-full flex items-center justify-center transform active:scale-90" aria-label="Scan Card"><div class="w-12 h-12 bg-white rounded-full"></div></button></div>
      </div>
      <canvas id="camera-canvas" class="hidden"></canvas>
    </div>
  </div>`;
  
const ContactListHTML = (contacts, isCompact = false) => `
  <div class="${isCompact ? "py-8" : "min-h-screen p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-gray-900 to-indigo-900/50"}">
    <div class="max-w-4xl mx-auto">
      <header class="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
        <h1 class="text-4xl font-bold text-white">Saved Contacts</h1>
        <div class="flex gap-4">
          <button id="download-csv-btn" ${contacts.length === 0 ? 'disabled' : ''} class="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-500 disabled:cursor-not-allowed"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5 mr-2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg> Download CSV</button>
        </div>
      </header>
      ${contacts.length === 0 ? `
        <div class="text-center bg-black/20 rounded-lg p-12 border border-white/10">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mx-auto h-12 w-12 text-gray-500"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
          <h3 class="mt-2 text-lg font-medium text-white">No contacts saved</h3>
          <p class="mt-1 text-sm text-gray-400">Use the scan button to get started.</p>
        </div>` : `
        <div class="space-y-4">
          ${contacts.map((contact, index) => `
            <div class="contact-item-clickable bg-black/30 backdrop-blur-lg p-4 rounded-xl border border-white/10 flex justify-between items-center animate-fadeIn-1s cursor-pointer hover:border-indigo-500/50" data-index="${index}">
              <div class="flex-1 min-w-0">
                <p class="text-lg font-bold text-white truncate">${contact.name || 'No Name'}</p>
                <p class="text-sm text-gray-300 truncate">${contact.jobTitle || contact.company || 'No Details'}</p>
                <p class="text-sm text-indigo-400 truncate">${contact.email || ''}</p>
              </div>
              <div class="flex-shrink-0 flex gap-2 ml-4">
                <button class="edit-btn p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-full" data-index="${index}"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg></button>
                <button class="delete-btn p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-full" data-index="${index}"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg></button>
              </div>
            </div>
          `).join('')}
        </div>`}
    </div>
  </div>`;

const ContactPreviewModalHTML = (contact) => `
    <div class="w-full max-w-md bg-gray-800 rounded-2xl shadow-2xl p-6 border border-white/20 animate-fadeIn-1s" id="modal-content">
        <div class="flex justify-between items-start">
            <div>
            <h2 class="text-3xl font-bold text-white">${contact.name || 'No Name'}</h2>
            <p class="text-indigo-400 font-semibold">${contact.jobTitle || ''}</p>
            <p class="text-gray-300 mt-1">${contact.company || ''}</p>
            </div>
            <button id="modal-close-btn" class="text-gray-400 hover:text-white text-4xl leading-none">&times;</button>
        </div>
        <div class="mt-6 space-y-4 text-gray-200">
            ${contact.email ? `<div><strong>Email:</strong> <a href="mailto:${contact.email}" class="text-indigo-300 break-all">${contact.email}</a></div>` : ''}
            ${contact.phone1 ? `<div><strong>Phone:</strong> <a href="tel:${contact.phone1}" class="text-indigo-300">${contact.phone1}</a></div>` : ''}
            ${contact.phone2 ? `<div><strong>Phone 2:</strong> <a href="tel:${contact.phone2}" class="text-indigo-300">${contact.phone2}</a></div>` : ''}
            ${contact.website ? `<div><strong>Website:</strong> <a href="https://${contact.website}" target="_blank" class="text-indigo-300">${contact.website}</a></div>` : ''}
            ${contact.address ? `<div><strong>Address:</strong><br><pre class="font-sans whitespace-pre-wrap">${contact.address}</pre></div>` : ''}
        </div>
    </div>`;
    
const ContactEditorHTML = (contact, isNew) => `
  <div class="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900/40 to-gray-900 flex flex-col items-center p-4 font-sans">
    <div id="editor-container" class="w-full max-w-md bg-black/30 backdrop-blur-xl rounded-2xl shadow-2xl p-6 space-y-6 border border-white/20">
        <div>
          <h2 class="text-3xl font-bold text-center text-white">${isNew ? 'New Contact Details' : 'Edit Contact'}</h2>
          <p class="text-center text-gray-400 text-sm mt-2">${isNew ? 'Review the extracted info and save.' : 'Update the contact information.'}</p>
        </div>
        <div class="space-y-5">
          <div><label class="block text-sm font-medium text-gray-300 mb-1">Name</label><input type="text" id="edit-name" value="${contact.name || ''}" class="mt-1 block w-full bg-gray-800 border border-gray-600 rounded-md py-2 px-3 text-white focus:ring-2 focus:ring-indigo-500"></div>
          <div><label class="block text-sm font-medium text-gray-300 mb-1">Job Title</label><input type="text" id="edit-jobTitle" value="${contact.jobTitle || ''}" class="mt-1 block w-full bg-gray-800 border border-gray-600 rounded-md py-2 px-3 text-white focus:ring-2 focus:ring-indigo-500"></div>
          <div><label class="block text-sm font-medium text-gray-300 mb-1">Company</label><input type="text" id="edit-company" value="${contact.company || ''}" class="mt-1 block w-full bg-gray-800 border border-gray-600 rounded-md py-2 px-3 text-white focus:ring-2 focus:ring-indigo-500"></div>
          <div><label class="block text-sm font-medium text-gray-300 mb-1">Email</label><input type="email" id="edit-email" value="${contact.email || ''}" class="mt-1 block w-full bg-gray-800 border border-gray-600 rounded-md py-2 px-3 text-white focus:ring-2 focus:ring-indigo-500"></div>
          <div><label class="block text-sm font-medium text-gray-300 mb-1">Phone 1</label><input type="tel" id="edit-phone1" value="${contact.phone1 || ''}" class="mt-1 block w-full bg-gray-800 border border-gray-600 rounded-md py-2 px-3 text-white focus:ring-2 focus:ring-indigo-500"></div>
          <div id="phone2-container" class="${contact.phone2 ? '' : 'hidden'}"><label class="block text-sm font-medium text-gray-300 mb-1">Phone 2</label><input type="tel" id="edit-phone2" value="${contact.phone2 || ''}" class="mt-1 block w-full bg-gray-800 border border-gray-600 rounded-md py-2 px-3 text-white focus:ring-2 focus:ring-indigo-500"></div>
          <button id="add-phone2-btn" class="text-sm text-indigo-400 hover:text-indigo-300 w-full text-left py-1 ${contact.phone2 ? 'hidden' : ''}">+ Add another phone number</button>
          <div><label class="block text-sm font-medium text-gray-300 mb-1">Website</label><input type="url" id="edit-website" value="${contact.website || ''}" class="mt-1 block w-full bg-gray-800 border border-gray-600 rounded-md py-2 px-3 text-white focus:ring-2 focus:ring-indigo-500"></div>
          <div><label class="block text-sm font-medium text-gray-300 mb-1">Address</label><textarea id="edit-address" rows="3" class="mt-1 block w-full bg-gray-800 border border-gray-600 rounded-md py-2 px-3 text-white focus:ring-2 focus:ring-indigo-500">${contact.address || ''}</textarea></div>
        </div>
        <div class="flex flex-col gap-4">
            <button id="save-contact-btn" class="w-full inline-flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5 mr-2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></svg> ${isNew ? 'Save Contact' : 'Update Contact'}</button>
        </div>
        <div class="pt-6 border-t border-white/10">
            <button id="cancel-edit-btn" class="w-full flex items-center justify-center px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/10 rounded-lg">Cancel</button>
        </div>
    </div>
  </div>`;

const ConfirmationModalHTML = (title, message) => `
    <div class="w-full max-w-sm bg-gray-800 rounded-2xl shadow-2xl p-6 border border-white/20 animate-fadeIn-1s">
        <h2 class="text-2xl font-bold text-white">${title}</h2>
        <p class="text-gray-300 mt-2">${message}</p>
        <div class="flex gap-4 mt-6">
            <button id="confirm-btn" class="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg">Confirm</button>
            <button id="cancel-confirm-btn" class="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg">Cancel</button>
        </div>
    </div>`;

// --- RENDER & EVENT HANDLING ---
const root = document.getElementById('root');
const modalContainer = document.getElementById('modal-container');
const confirmationModalContainer = document.getElementById('confirmation-modal-container');
const scanFabContainer = document.getElementById('scan-fab-container');
const pwaInstallContainer = document.getElementById('pwa-install-banner');

function renderApp() {
    stopCamera();
    let content = '';
    AppState.isLoading ? root.innerHTML = LoadingIndicatorHTML("Analyzing Image...") : (() => {
        switch (AppState.appState) {
            case 'welcome': content = WelcomeScreenHTML(); scanFabContainer.innerHTML = ''; break;
            case 'list': content = ContactListHTML(AppState.contacts); scanFabContainer.innerHTML = ScannerFabHTML(); break;
            case 'capturing': content = ContactListHTML(AppState.contacts) + CameraCaptureHTML(); scanFabContainer.innerHTML = ''; break;
            case 'editing': content = ContactEditorHTML(AppState.editingContact.details, AppState.editingContact.index === null) + ContactListHTML(AppState.contacts, true); scanFabContainer.innerHTML = ScannerFabHTML(); break;
            case 'error': content = ErrorScreenHTML(AppState.error); scanFabContainer.innerHTML = ''; break;
        }
        root.innerHTML = content;
        attachAllListeners();
    })();
}

function attachAllListeners() {
    document.getElementById('start-scan-btn')?.addEventListener('click', handleStartScanning);
    document.getElementById('scan-fab-btn')?.addEventListener('click', handleStartScanning);
    document.getElementById('download-csv-btn')?.addEventListener('click', handleDownloadCSV);
    document.getElementById('reset-app-btn')?.addEventListener('click', handleResetApp);
    document.querySelectorAll('.contact-item-clickable').forEach(item => item.addEventListener('click', e => showContactPreview(e.currentTarget.dataset.index)));
    document.querySelectorAll('.edit-btn').forEach(btn => btn.addEventListener('click', e => { e.stopPropagation(); handleEditContact(e.currentTarget.dataset.index); }));
    document.querySelectorAll('.delete-btn').forEach(btn => btn.addEventListener('click', e => { e.stopPropagation(); handleDeleteContact(e.currentTarget.dataset.index); }));
    document.getElementById('save-contact-btn')?.addEventListener('click', handleSaveContact);
    document.getElementById('cancel-edit-btn')?.addEventListener('click', handleCancelEdit);
    document.getElementById('add-phone2-btn')?.addEventListener('click', () => {
      document.getElementById('phone2-container')?.classList.remove('hidden');
      document.getElementById('add-phone2-btn')?.classList.add('hidden');
    });
    if (AppState.appState === 'capturing') startCamera();
}

// --- MODAL & PREVIEW ---
function showContactPreview(index) {
    const contact = AppState.contacts[parseInt(index)];
    if (!contact) return;
    modalContainer.innerHTML = ContactPreviewModalHTML(contact);
    modalContainer.classList.remove('hidden');
    document.getElementById('modal-close-btn').addEventListener('click', hideContactPreview);
    modalContainer.addEventListener('click', e => { if (e.target === modalContainer) hideContactPreview(); });
}
function hideContactPreview() {
    modalContainer.classList.add('hidden');
    modalContainer.innerHTML = '';
}

function showExitConfirmation(onConfirm) {
    confirmationModalContainer.innerHTML = ConfirmationModalHTML('Discard Changes?', 'Are you sure you want to leave? Any unsaved changes will be lost.');
    confirmationModalContainer.classList.remove('hidden');
    document.getElementById('confirm-btn').onclick = () => {
        hideExitConfirmation();
        onConfirm();
    };
    document.getElementById('cancel-confirm-btn').onclick = hideExitConfirmation;
}
function hideExitConfirmation() {
    confirmationModalContainer.classList.add('hidden');
    confirmationModalContainer.innerHTML = '';
}

// --- GOOGLE FORM SUBMISSION (OPTIONAL) ---
async function submitToGoogleForm(details) {
    // This is an optional feature. To enable it, create a Google Form and follow the
    // instructions in the README.md file to get your form's URL and entry IDs.
    
    // TODO: Replace with your actual Google Form URL ending in /formResponse
    const formUrl = ""; // Example: "https://docs.google.com/forms/d/e/1FAIpQLSc.../formResponse"
    
    // If no formUrl is provided, silently skip submission.
    if (!formUrl) {
        console.log("Google Form URL not provided. Skipping submission.");
        return;
    }

    // TODO: Replace with the actual 'entry.XXXX' IDs from your Google Form source code.
    const keyMap = {
        name: 'entry.YOUR_NAME_ID',
        jobTitle: 'entry.YOUR_JOB_TITLE_ID',
        company: 'entry.YOUR_COMPANY_ID',
        email: 'entry.YOUR_EMAIL_ID',
        phone1: 'entry.YOUR_PHONE1_ID',
        website: 'entry.YOUR_WEBSITE_ID',
        address: 'entry.YOUR_ADDRESS_ID'
    };
    
    const formData = new URLSearchParams();
    formData.append(keyMap.name, details.name || '');
    formData.append(keyMap.jobTitle, details.jobTitle || '');
    formData.append(keyMap.company, details.company || '');
    formData.append(keyMap.email, details.email || '');
    formData.append(keyMap.phone1, details.phone1 || '');
    formData.append(keyMap.website, details.website || '');
    formData.append(keyMap.address, details.address || '');

    try {
        await fetch(formUrl, { method: 'POST', body: formData, mode: 'no-cors' });
        console.log("Form submitted successfully (in background).");
    } catch (error) {
        console.error("Error submitting to Google Form:", error);
    }
}

// --- CAMERA LOGIC ---
async function startCamera() {
    try {
      const video = document.getElementById('camera-video');
      if (!video) return;
      AppState.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } } });
      video.srcObject = AppState.stream;
      document.getElementById('capture-btn').addEventListener('click', handleCapture);
      document.getElementById('camera-backdrop').addEventListener('click', e => { if(e.target === e.currentTarget) showExitConfirmation(() => { AppState.appState = 'list'; renderApp(); }) });
    } catch (err) {
      handleCameraError("Could not access camera. Please check permissions.");
    }
}
function stopCamera() {
    if (AppState.stream) {
      AppState.stream.getTracks().forEach(track => track.stop());
      AppState.stream = null;
    }
}

// --- EVENT HANDLERS ---
const handleStartScanning = () => { AppState.appState = 'capturing'; renderApp(); };
const handleCancelEdit = () => { showExitConfirmation(() => { AppState.appState = 'list'; renderApp(); }); };
const handleResetApp = () => { AppState.appState = AppState.contacts.length > 0 ? 'list' : 'welcome'; AppState.error = null; renderApp(); };

const handleCapture = async () => {
    const video = document.getElementById('camera-video');
    const cutout = document.getElementById('scanner-cutout');
    const captureBtn = document.getElementById('capture-btn');
    if (!video || !cutout || !captureBtn) return;
    captureBtn.disabled = true;
    const videoRect = video.getBoundingClientRect();
    const cutoutRect = cutout.getBoundingClientRect();
    const scaleX = video.videoWidth / videoRect.width;
    const scaleY = video.videoHeight / videoRect.height;
    const cropX = (cutoutRect.left - videoRect.left) * scaleX;
    const cropY = (cutoutRect.top - videoRect.top) * scaleY;
    const cropWidth = cutoutRect.width * scaleX;
    const cropHeight = cutoutRect.height * scaleY;
    const cropCanvas = document.createElement('canvas');
    cropCanvas.width = cropWidth;
    cropCanvas.height = cropHeight;
    cropCanvas.getContext('2d').drawImage(video, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
    const imageDataUrl = preprocessImage(cropCanvas);
    AppState.isLoading = true;
    renderApp();
    try {
        const worker = await Tesseract.createWorker('eng');
        const { data: { text } } = await worker.recognize(imageDataUrl);
        await worker.terminate();
        AppState.rawText = text;
        AppState.editingContact = { details: extractContactDetails(text), index: null };
        AppState.appState = 'editing';
    } catch (err) {
        console.error(err);
        handleCameraError("Failed to analyze image. Please try again.");
    } finally {
        AppState.isLoading = false;
        stopCamera();
        renderApp();
    }
};

const handleSaveContact = () => {
    const details = {
        name: document.getElementById('edit-name')?.value,
        jobTitle: document.getElementById('edit-jobTitle')?.value,
        company: document.getElementById('edit-company')?.value,
        email: document.getElementById('edit-email')?.value,
        phone1: document.getElementById('edit-phone1')?.value,
        phone2: document.getElementById('edit-phone2')?.value,
        website: document.getElementById('edit-website')?.value,
        address: document.getElementById('edit-address')?.value,
    };
    const index = AppState.editingContact.index;
    if (index === null) {
        AppState.contacts.push(details);
    } else {
        AppState.contacts[index] = details;
    }
    localStorage.setItem('contacts', JSON.stringify(AppState.contacts));
    submitToGoogleForm(details); // Call the optional submission function
    AppState.appState = 'list';
    renderApp();
};

const handleEditContact = (index) => {
    AppState.editingContact = { details: AppState.contacts[index], index: parseInt(index) };
    AppState.rawText = '';
    AppState.appState = 'editing';
    renderApp();
};

const handleDeleteContact = (index) => {
    if (confirm('Are you sure you want to delete this contact?')) {
        AppState.contacts.splice(index, 1);
        localStorage.setItem('contacts', JSON.stringify(AppState.contacts));
        renderApp();
    }
};

const handleDownloadCSV = () => {
    if (AppState.contacts.length === 0) return;
    const csvString = generateCSV(AppState.contacts);
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'contacts.csv';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

const handleCameraError = (message) => {
    AppState.error = message;
    AppState.appState = 'error';
    AppState.isLoading = false;
    stopCamera();
    renderApp();
};

// --- PWA LOGIC ---
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    AppState.deferredPrompt = e;
    pwaInstallContainer.innerHTML = PwaInstallBannerHTML();
    pwaInstallContainer.classList.remove('hidden');
    document.getElementById('pwa-install-btn').addEventListener('click', async () => {
        pwaInstallContainer.classList.add('hidden');
        AppState.deferredPrompt.prompt();
        await AppState.deferredPrompt.userChoice;
        AppState.deferredPrompt = null;
    });
    document.getElementById('pwa-dismiss-btn').addEventListener('click', () => {
        pwaInstallContainer.classList.add('hidden');
    });
});

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(reg => console.log('Service worker registered.', reg))
            .catch(err => console.log('Service worker registration failed:', err));
    });
}

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    try {
        const savedContacts = localStorage.getItem('contacts');
        if (savedContacts) AppState.contacts = JSON.parse(savedContacts);
    } catch (e) {
        console.error("Could not load contacts:", e);
        AppState.contacts = [];
    }
    AppState.appState = AppState.contacts.length > 0 ? 'list' : 'welcome';
    renderApp();
});
