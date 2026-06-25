// =============================================
//   RT INVOICE — Dashboard App Logic
//   Design & Developed by Rishbah Shah
// =============================================

let invoices       = [];
let currentInvoiceId = null;
let currentItems   = [];
let currentUserId  = null;

// ---- Init ----
document.addEventListener('DOMContentLoaded', () => {
  setupModalListeners();
  setupItemListeners();
  setupTaxListeners();
  setupSearch();
  setupHamburger();
  updateCalculations();
});

// ---- Load user invoices (called by auth.js after login check) ----
window.loadUserInvoices = function(userId) {
  currentUserId = userId;
  const all = JSON.parse(localStorage.getItem('rt_invoices') || '[]');
  invoices = all.filter(inv => inv.userId === userId);
  renderInvoiceList();
  updateInvoiceCount();
};

// ---- Persist ----
function saveInvoices() {
  const all    = JSON.parse(localStorage.getItem('rt_invoices') || '[]');
  const others = all.filter(inv => inv.userId !== currentUserId);
  localStorage.setItem('rt_invoices', JSON.stringify([...others, ...invoices]));
  renderInvoiceList();
  updateInvoiceCount();
}

// ---- Helpers ----
function generateInvoiceNumber() {
  const year  = new Date().getFullYear();
  const count = String(invoices.length + 1).padStart(4, '0');
  return `RT-${year}-${count}`;
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', minimumFractionDigits: 2
  }).format(amount);
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric'
  });
}

// ---- Render Invoice List ----
function renderInvoiceList() {
  const container  = document.getElementById('invoiceList');
  const emptyState = document.getElementById('emptyInvoices');
  if (!container) return;

  if (invoices.length === 0) {
    emptyState?.classList.remove('hidden');
    container.innerHTML = '';
    return;
  }
  emptyState?.classList.add('hidden');

  container.innerHTML = invoices.map(inv => `
    <div class="inv-card ${currentInvoiceId === inv.id ? 'active' : ''}"
         onclick="selectInvoice('${inv.id}')">
      <div class="inv-card-top">
        <span class="inv-num">${inv.invoiceNumber}</span>
        <span class="inv-date">${formatDate(inv.date)}</span>
      </div>
      <div class="inv-customer">${inv.customer.name || 'Guest'}</div>
      <div class="inv-amount">${formatCurrency(inv.grandTotal)}</div>
    </div>
  `).join('');
}

function updateInvoiceCount() {
  const el = document.getElementById('invoiceCount');
  if (el) el.textContent = invoices.length;
}

// ---- Search ----
function setupSearch() {
  const input = document.getElementById('searchInput');
  if (!input) return;
  input.addEventListener('input', e => {
    const term     = e.target.value.toLowerCase();
    const filtered = invoices.filter(inv =>
      inv.invoiceNumber.toLowerCase().includes(term) ||
      (inv.customer.name  || '').toLowerCase().includes(term) ||
      (inv.customer.email || '').toLowerCase().includes(term)
    );
    const container  = document.getElementById('invoiceList');
    const emptyState = document.getElementById('emptyInvoices');
    if (!container) return;
    if (filtered.length === 0) {
      emptyState?.classList.remove('hidden');
      container.innerHTML = '';
    } else {
      emptyState?.classList.add('hidden');
      container.innerHTML = filtered.map(inv => `
        <div class="inv-card" onclick="selectInvoice('${inv.id}')">
          <div class="inv-card-top">
            <span class="inv-num">${inv.invoiceNumber}</span>
            <span class="inv-date">${formatDate(inv.date)}</span>
          </div>
          <div class="inv-customer">${inv.customer.name || 'Guest'}</div>
          <div class="inv-amount">${formatCurrency(inv.grandTotal)}</div>
        </div>
      `).join('');
    }
  });
}

// ---- Select Invoice ----
window.selectInvoice = function(id) {
  currentInvoiceId = id;
  const inv = invoices.find(i => i.id === id);
  if (inv) { displayInvoice(inv); renderInvoiceList(); }

  // Close sidebar on mobile
  document.querySelector('.sidebar')?.classList.remove('open');
};

// ---- Display Invoice ----
function displayInvoice(inv) {
  const wrapper      = document.getElementById('invoicePreview');
  const emptyPreview = document.getElementById('emptyPreview');
  if (!wrapper) return;

  emptyPreview?.classList.add('hidden');
  wrapper.classList.remove('hidden');

  const dueDate = new Date(new Date(inv.date).getTime() + 15 * 86400000);

  const itemRows = inv.items.map(item => `
    <tr>
      <td>${item.name}</td>
      <td>${item.quantity}</td>
      <td>${formatCurrency(item.price)}</td>
      <td>${formatCurrency(item.quantity * item.price)}</td>
    </tr>
  `).join('');

  wrapper.innerHTML = `
    <div class="invoice-preview-wrapper">
      <div class="inv-paper">

        <!-- Header bar -->
        <div class="inv-paper-top">
          <div>
            <div class="inv-co-name">RT <span>Invoice</span></div>
            <div class="inv-co-details">
              GST: 27AABCR1234F1Z5<br>
              123 Business Avenue, Surat, Gujarat - 395001<br>
              contact@rtinvoice.com &nbsp;|&nbsp; +91 98765 43210
            </div>
          </div>
          <div class="inv-title-block">
            <div class="inv-word">INVOICE</div>
            <div class="inv-num-tag">${inv.invoiceNumber}</div>
            <div class="inv-date-tag">Date: ${formatDate(inv.date)}</div>
            <div class="inv-date-tag">Due: ${formatDate(dueDate)}</div>
          </div>
        </div>

        <!-- Body -->
        <div class="inv-paper-body">

          <!-- Billing grid -->
          <div class="inv-billing-grid">
            <div>
              <div class="inv-section-label">Bill To</div>
              <div class="inv-client-name">${inv.customer.name || 'N/A'}</div>
              <div class="inv-client-detail">
                ${inv.customer.email   ? inv.customer.email   + '<br>' : ''}
                ${inv.customer.phone   ? inv.customer.phone   + '<br>' : ''}
                ${inv.customer.address ? inv.customer.address + '<br>' : ''}
                ${inv.customer.gst     ? 'GST: ' + inv.customer.gst    : ''}
              </div>
            </div>
            <div>
              <div class="inv-section-label">Payment Details</div>
              <div class="inv-client-detail">
                <strong>Method:</strong> ${inv.paymentMethod}<br>
                <strong>Status:</strong> Pending<br>
                <strong>Terms:</strong> Due within 15 days
              </div>
              <div class="inv-payment-badge" style="margin-top:12px">
                💳 ${inv.paymentMethod}
              </div>
            </div>
          </div>

          <!-- Items -->
          <table class="inv-table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>${itemRows}</tbody>
          </table>

          <!-- Summary -->
          <div class="inv-summary-row">
            <div class="inv-summary-box">
              <div class="inv-sum-line"><span>Subtotal</span><span>${formatCurrency(inv.subtotal)}</span></div>
              <div class="inv-sum-line"><span>CGST (${inv.cgstRate}%)</span><span>${formatCurrency(inv.cgst)}</span></div>
              <div class="inv-sum-line"><span>SGST (${inv.sgstRate}%)</span><span>${formatCurrency(inv.sgst)}</span></div>
              ${inv.discount > 0 ? `<div class="inv-sum-line"><span>Discount (${inv.discountPercent}%)</span><span>−${formatCurrency(inv.discount)}</span></div>` : ''}
              <div class="inv-sum-total"><span>Grand Total</span><span>${formatCurrency(inv.grandTotal)}</span></div>
            </div>
          </div>

          <!-- Bank info -->
          <div style="background:var(--surface);border-radius:var(--r-md);padding:14px 18px;margin-bottom:24px;font-size:13px;color:var(--ink-soft);">
            <strong style="font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);">Bank / UPI Details</strong><br style="margin-bottom:6px">
            UPI: <strong>rtinvoice@okhdfcbank</strong> &nbsp;|&nbsp; A/C: <strong>9876543210</strong> (HDFC Bank, Surat)
          </div>

          <!-- Action Buttons -->
          <div class="inv-actions">
            <button class="btn-secondary" onclick="deleteInvoice('${inv.id}')">
              🗑️ Delete
            </button>
            <button class="btn-primary" onclick="printInvoice('${inv.id}')">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
                <path d="M6 9V3h12v6"/><rect x="6" y="15" width="12" height="6" rx="2"/>
              </svg>
              Print Invoice
            </button>
          </div>
        </div>

        <!-- Footer -->
        <div class="inv-footer">
          <div class="inv-footer-brand">RT Invoice</div>
          <div class="inv-footer-credit">
            © ${new Date().getFullYear()} RT Invoice &nbsp;·&nbsp; Design &amp; Developed by <strong>Rishbah Shah</strong>
          </div>
        </div>

      </div>
    </div>
  `;
}

// ---- Delete Invoice ----
window.deleteInvoice = function(id) {
  if (!confirm('Delete this invoice? This cannot be undone.')) return;
  invoices = invoices.filter(i => i.id !== id);
  saveInvoices();
  currentInvoiceId = null;
  document.getElementById('invoicePreview')?.classList.add('hidden');
  document.getElementById('emptyPreview')?.classList.remove('hidden');
  showToast('Invoice deleted', 'warning');
};

// ---- Print Invoice ----
window.printInvoice = function(id) {
  const inv = invoices.find(i => i.id === id);
  if (!inv) return;

  const dueDate = new Date(new Date(inv.date).getTime() + 15 * 86400000);

  const itemRows = inv.items.map(item => `
    <tr>
      <td>${item.name}</td>
      <td style="text-align:center">${item.quantity}</td>
      <td style="text-align:right">${formatCurrency(item.price)}</td>
      <td style="text-align:right;font-weight:600">${formatCurrency(item.quantity * item.price)}</td>
    </tr>
  `).join('');

  const win = window.open('', '_blank');
  win.document.write(`<!DOCTYPE html><html lang="en"><head>
    <meta charset="UTF-8">
    <title>${inv.invoiceNumber} — RT Invoice</title>
    <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap" rel="stylesheet">
    <style>
      * { margin:0;padding:0;box-sizing:border-box; }
      body { font-family:'DM Sans',sans-serif; color:#0a0a12; background:#fff; padding:40px; }
      .header { display:flex; justify-content:space-between; align-items:flex-start; padding:32px 40px; background:#0a0a12; border-radius:16px 16px 0 0; margin-bottom:0; }
      .co-name { font-family:'Syne',sans-serif; font-size:26px; font-weight:800; color:#fff; }
      .co-name span { color:#06b6d4; }
      .co-details { font-size:12px; color:rgba(255,255,255,.5); line-height:1.8; margin-top:6px; }
      .inv-block { text-align:right; }
      .inv-word { font-family:'Syne',sans-serif; font-size:36px; font-weight:800; color:rgba(255,255,255,.12); letter-spacing:.1em; }
      .inv-num { font-size:14px; font-weight:700; color:#fff; margin-top:4px; }
      .inv-date { font-size:12px; color:rgba(255,255,255,.5); margin-top:3px; }
      .body { padding:32px 40px; }
      .billing { display:grid; grid-template-columns:1fr 1fr; gap:32px; margin-bottom:28px; padding-bottom:24px; border-bottom:1px solid #e4e4ef; }
      .sec-label { font-size:10px; font-weight:700; color:#7f7f9a; text-transform:uppercase; letter-spacing:.1em; margin-bottom:8px; }
      .client-name { font-size:15px; font-weight:700; margin-bottom:6px; }
      .client-detail { font-size:12.5px; color:#3b3b52; line-height:1.8; }
      table { width:100%; border-collapse:collapse; margin-bottom:24px; }
      th { padding:9px 12px; background:#f5f5fb; font-size:11px; font-weight:700; color:#7f7f9a; text-transform:uppercase; letter-spacing:.08em; text-align:left; border-bottom:1.5px solid #e4e4ef; }
      td { padding:11px 12px; font-size:13px; color:#3b3b52; border-bottom:1px solid #e4e4ef; }
      .sum-box { width:300px; margin-left:auto; background:#f5f5fb; border-radius:12px; padding:16px 20px; }
      .sum-line { display:flex; justify-content:space-between; font-size:13px; color:#3b3b52; padding:4px 0; }
      .sum-total { display:flex; justify-content:space-between; font-family:'Syne',sans-serif; font-size:18px; font-weight:700; color:#6c4ef2; border-top:2px solid #e4e4ef; margin-top:8px; padding-top:12px; }
      .bank-box { background:#f5f5fb; border-radius:10px; padding:14px 18px; margin:24px 0; font-size:13px; color:#3b3b52; }
      .footer { text-align:center; font-size:11px; color:#7f7f9a; padding-top:20px; border-top:1px solid #e4e4ef; margin-top:20px; }
    </style>
  </head><body>
    <div class="header">
      <div>
        <div class="co-name">RT <span>Invoice</span></div>
        <div class="co-details">GST: 27AABCR1234F1Z5<br>123 Business Avenue, Surat, Gujarat - 395001<br>contact@rtinvoice.com | +91 98765 43210</div>
      </div>
      <div class="inv-block">
        <div class="inv-word">INVOICE</div>
        <div class="inv-num">${inv.invoiceNumber}</div>
        <div class="inv-date">Date: ${formatDate(inv.date)}</div>
        <div class="inv-date">Due: ${formatDate(dueDate)}</div>
      </div>
    </div>
    <div class="body">
      <div class="billing">
        <div>
          <div class="sec-label">Bill To</div>
          <div class="client-name">${inv.customer.name || 'N/A'}</div>
          <div class="client-detail">
            ${inv.customer.email   ? inv.customer.email   + '<br>' : ''}
            ${inv.customer.phone   ? inv.customer.phone   + '<br>' : ''}
            ${inv.customer.address ? inv.customer.address + '<br>' : ''}
            ${inv.customer.gst     ? 'GST: ' + inv.customer.gst    : ''}
          </div>
        </div>
        <div>
          <div class="sec-label">Payment</div>
          <div class="client-detail">
            Method: ${inv.paymentMethod}<br>
            Status: Pending<br>
            Terms: Due within 15 days
          </div>
        </div>
      </div>
      <table>
        <thead><tr><th>Description</th><th>Qty</th><th style="text-align:right">Unit Price</th><th style="text-align:right">Total</th></tr></thead>
        <tbody>${itemRows}</tbody>
      </table>
      <div class="sum-box">
        <div class="sum-line"><span>Subtotal</span><span>${formatCurrency(inv.subtotal)}</span></div>
        <div class="sum-line"><span>CGST (${inv.cgstRate}%)</span><span>${formatCurrency(inv.cgst)}</span></div>
        <div class="sum-line"><span>SGST (${inv.sgstRate}%)</span><span>${formatCurrency(inv.sgst)}</span></div>
        ${inv.discount > 0 ? `<div class="sum-line"><span>Discount (${inv.discountPercent}%)</span><span>−${formatCurrency(inv.discount)}</span></div>` : ''}
        <div class="sum-total"><span>Grand Total</span><span>${formatCurrency(inv.grandTotal)}</span></div>
      </div>
      <div class="bank-box"><strong style="font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:#7f7f9a">Bank / UPI Details</strong><br>UPI: rtinvoice@okhdfcbank &nbsp;|&nbsp; A/C: 9876543210 (HDFC Bank, Surat)</div>
      <div class="footer">
        © ${new Date().getFullYear()} RT Invoice &nbsp;·&nbsp; Design &amp; Developed by <strong>Rishbah Shah</strong>
      </div>
    </div>
    <script>window.onload = () => { window.print(); setTimeout(() => window.close(), 600); };<\/script>
  </body></html>`);
  win.document.close();
};

// =====================
// MODAL
// =====================
const modal = document.getElementById('invoiceModal');

function openModal() {
  if (!modal) return;
  modal.classList.add('active');
  resetModal();
  showStep(1);
  document.getElementById('modalTitle').textContent = 'New Invoice — Customer Info';
}

function closeModalFn() {
  modal?.classList.remove('active');
}

function resetModal() {
  ['custName','custEmail','custPhone','custAddress','custGst'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  document.getElementById('cgstRate').value     = '2.5';
  document.getElementById('sgstRate').value     = '2.5';
  document.getElementById('discountRate').value = '0';
  currentItems = [];
  renderItemsTable();
  updateCalculations();
}

function showStep(n) {
  document.querySelectorAll('.modal-step').forEach(s => s.classList.remove('active'));
  document.getElementById('step' + n)?.classList.add('active');
  // update step dots & line
  for (let i = 1; i <= 2; i++) {
    const dot  = document.getElementById('stepDot' + i);
    const fill = document.getElementById('stepFill' + i);
    if (dot) {
      dot.classList.remove('active','done');
      if (i < n)  dot.classList.add('done');
      if (i === n) dot.classList.add('active');
    }
    if (fill) fill.style.width = i < n ? '100%' : '0%';
  }
}

function setupModalListeners() {
  document.getElementById('createInvoiceBtn')?.addEventListener('click', openModal);
  document.getElementById('emptyCreateBtn')?.addEventListener('click', openModal);
  document.getElementById('closeModalBtn')?.addEventListener('click', closeModalFn);

  modal?.addEventListener('click', e => { if (e.target === modal) closeModalFn(); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modal?.classList.contains('active')) closeModalFn();
  });

  document.getElementById('nextToStep2')?.addEventListener('click', () => {
    const name  = document.getElementById('custName').value.trim();
    const email = document.getElementById('custEmail').value.trim();
    if (!name || !email) { showToast('Name and email are required', 'error'); return; }
    showStep(2);
    document.getElementById('modalTitle').textContent = 'New Invoice — Items & Payment';
  });

  document.getElementById('backToStep1')?.addEventListener('click', () => {
    showStep(1);
    document.getElementById('modalTitle').textContent = 'New Invoice — Customer Info';
  });

  document.getElementById('generateInvoiceBtn')?.addEventListener('click', generateInvoice);
}

// =====================
// ITEMS
// =====================
function setupItemListeners() {
  document.getElementById('addItemButton')?.addEventListener('click', addItem);
  document.getElementById('itemPrice')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') addItem();
  });
}

function addItem() {
  const name  = document.getElementById('itemName').value.trim();
  const qty   = parseInt(document.getElementById('itemQty').value);
  const price = parseFloat(document.getElementById('itemPrice').value);
  if (!name || !qty || isNaN(price) || price < 0) {
    showToast('Please fill in all item fields', 'error'); return;
  }
  currentItems.push({ name, quantity: qty, price });
  renderItemsTable();
  document.getElementById('itemName').value  = '';
  document.getElementById('itemQty').value   = '1';
  document.getElementById('itemPrice').value = '';
  document.getElementById('itemName').focus();
  showToast('Item added ✓', 'success');
}

function renderItemsTable() {
  const tbody = document.getElementById('itemsTableBody');
  if (!tbody) return;
  tbody.innerHTML = currentItems.map((item, i) => `
    <tr>
      <td>${item.name}</td>
      <td>${item.quantity}</td>
      <td>${formatCurrency(item.price)}</td>
      <td>${formatCurrency(item.quantity * item.price)}</td>
      <td><button class="delete-item" onclick="removeItem(${i})">🗑️</button></td>
    </tr>
  `).join('');
  updateCalculations();
}

window.removeItem = function(index) {
  currentItems.splice(index, 1);
  renderItemsTable();
};

// =====================
// CALCULATIONS
// =====================
function setupTaxListeners() {
  ['cgstRate','sgstRate','discountRate'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', updateCalculations);
  });
}

function updateCalculations() {
  const subtotal       = currentItems.reduce((s, i) => s + i.quantity * i.price, 0);
  const cgstRate       = parseFloat(document.getElementById('cgstRate')?.value)     || 0;
  const sgstRate       = parseFloat(document.getElementById('sgstRate')?.value)     || 0;
  const discountPercent = parseFloat(document.getElementById('discountRate')?.value) || 0;

  const cgst     = subtotal * (cgstRate / 100);
  const sgst     = subtotal * (sgstRate / 100);
  const discount = subtotal * (discountPercent / 100);
  const grand    = subtotal + cgst + sgst - discount;

  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set('summarySubtotal',  formatCurrency(subtotal));
  set('summaryCgst',      formatCurrency(cgst));
  set('summarySgst',      formatCurrency(sgst));
  set('summaryDiscount',  formatCurrency(discount));
  set('summaryGrandTotal',formatCurrency(grand));
  set('cgstLabel',  cgstRate);
  set('sgstLabel',  sgstRate);

  return { subtotal, cgstRate, sgstRate, cgst, sgst, discountPercent, discount, grandTotal: grand };
}

// =====================
// GENERATE INVOICE
// =====================
function generateInvoice() {
  if (currentItems.length === 0) {
    showToast('Add at least one item', 'error'); return;
  }

  const get = id => document.getElementById(id)?.value?.trim() || '';
  const name            = get('custName');
  const email           = get('custEmail');
  const phone           = get('custPhone');
  const address         = get('custAddress');
  const gst             = get('custGst');
  const paymentMethod   = document.querySelector('input[name="paymentMethod"]:checked')?.value || 'UPI';
  const calc            = updateCalculations();

  const newInv = {
    id: Date.now().toString(),
    userId: currentUserId,
    invoiceNumber: generateInvoiceNumber(),
    date: new Date().toISOString(),
    customer: { name, email, phone, address, gst },
    items: [...currentItems],
    paymentMethod,
    ...calc
  };

  invoices.unshift(newInv);
  saveInvoices();
  selectInvoice(newInv.id);
  closeModalFn();
  showToast(`${newInv.invoiceNumber} created — ${formatCurrency(calc.grandTotal)}`, 'success');
}

// =====================
// HAMBURGER (mobile)
// =====================
function setupHamburger() {
  const btn     = document.getElementById('hamburgerBtn');
  const sidebar = document.querySelector('.sidebar');
  if (!btn || !sidebar) return;
  btn.addEventListener('click', () => sidebar.classList.toggle('open'));
  document.addEventListener('click', e => {
    if (!sidebar.contains(e.target) && e.target !== btn) {
      sidebar.classList.remove('open');
    }
  });
}