// Data Store
let invoices = [];
let currentInvoiceId = null;
let currentItems = [];
let currentUserId = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadUserInvoices();
  setupEventListeners();
  updateCalculations();
});

// Load user-specific invoices
window.loadUserInvoices = function(userId) {
  currentUserId = userId;
  const allInvoices = JSON.parse(localStorage.getItem('nova_invoices') || '[]');
  invoices = allInvoices.filter(inv => inv.userId === userId);
  renderInvoiceList();
  updateInvoiceCount();
};

function saveInvoices() {
  const allInvoices = JSON.parse(localStorage.getItem('nova_invoices') || '[]');
  const otherInvoices = allInvoices.filter(inv => inv.userId !== currentUserId);
  const updatedInvoices = [...otherInvoices, ...invoices];
  localStorage.setItem('nova_invoices', JSON.stringify(updatedInvoices));
  renderInvoiceList();
  updateInvoiceCount();
}

// Helper Functions
function generateInvoiceNumber() {
  const year = new Date().getFullYear();
  const count = invoices.length + 1;
  return `INV-${year}-${String(count).padStart(4, '0')}`;
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2
  }).format(amount);
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

// Render Invoice List
function renderInvoiceList() {
  const container = document.getElementById('invoiceList');
  const emptyState = document.getElementById('emptyInvoices');
  
  if (!container) return;
  
  if (invoices.length === 0) {
    if (emptyState) emptyState.classList.remove('hidden');
    container.innerHTML = '';
    return;
  }
  
  if (emptyState) emptyState.classList.add('hidden');
  container.innerHTML = invoices.map(invoice => `
    <div class="invoice-item ${currentInvoiceId === invoice.id ? 'active' : ''}" onclick="selectInvoice('${invoice.id}')">
      <div class="invoice-header">
        <span class="invoice-number">${invoice.invoiceNumber}</span>
        <span>${formatDate(invoice.date)}</span>
      </div>
      <div class="invoice-customer">${invoice.customer.name || 'Guest'}</div>
      <div class="invoice-amount">${formatCurrency(invoice.grandTotal)}</div>
    </div>
  `).join('');
}

function updateInvoiceCount() {
  const countEl = document.getElementById('invoiceCount');
  if (countEl) countEl.textContent = invoices.length;
}

// Search Functionality
const searchInput = document.getElementById('searchInput');
if (searchInput) {
  searchInput.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const filtered = invoices.filter(inv => 
      inv.invoiceNumber.toLowerCase().includes(term) ||
      inv.customer.name?.toLowerCase().includes(term) ||
      inv.customer.email?.toLowerCase().includes(term)
    );
    
    const container = document.getElementById('invoiceList');
    if (filtered.length === 0) {
      container.innerHTML = '<div class="empty-invoices" style="text-align:center;padding:40px;"><p>No matching invoices</p></div>';
    } else {
      container.innerHTML = filtered.map(invoice => `
        <div class="invoice-item" onclick="selectInvoice('${invoice.id}')">
          <div class="invoice-header">
            <span class="invoice-number">${invoice.invoiceNumber}</span>
            <span>${formatDate(invoice.date)}</span>
          </div>
          <div class="invoice-customer">${invoice.customer.name || 'Guest'}</div>
          <div class="invoice-amount">${formatCurrency(invoice.grandTotal)}</div>
        </div>
      `).join('');
    }
  });
}

// Select and Display Invoice
window.selectInvoice = function(id) {
  currentInvoiceId = id;
  const invoice = invoices.find(inv => inv.id === id);
  if (invoice) {
    displayInvoice(invoice);
    renderInvoiceList();
  }
};

function displayInvoice(invoice) {
  const previewContainer = document.getElementById('invoicePreview');
  const emptyPreview = document.getElementById('emptyPreview');
  
  if (!previewContainer) return;
  
  emptyPreview.classList.add('hidden');
  previewContainer.classList.remove('hidden');
  
  const itemsHtml = invoice.items.map(item => `
    <tr>
      <td>${item.name}</td>
      <td>${item.quantity}</td>
      <td>${formatCurrency(item.price)}</td>
      <td>${formatCurrency(item.quantity * item.price)}</td>
    </tr>
  `).join('');
  
  previewContainer.innerHTML = `
    <div class="invoice-card">
      <div class="invoice-header">
        <div class="company-info">
          <h2>NOVA INVOICE</h2>
          <p>GST: 27AAACN1234E1Z5</p>
          <p>123 Business Street, Bangalore - 560001</p>
          <p>Email: hello@nova.com | Phone: +91 80 1234 5678</p>
        </div>
        <div class="invoice-details">
          <div class="invoice-title">INVOICE</div>
          <p><strong>${invoice.invoiceNumber}</strong></p>
          <p>Date: ${formatDate(invoice.date)}</p>
          <p>Due Date: ${formatDate(new Date(new Date(invoice.date).setDate(new Date(invoice.date).getDate() + 15)))}</p>
        </div>
      </div>
      
      <div class="billing-section">
        <div class="bill-to">
          <h4>Bill To:</h4>
          <p><strong>${invoice.customer.name || 'N/A'}</strong></p>
          <p>${invoice.customer.email || ''}</p>
          <p>${invoice.customer.phone || ''}</p>
          <p>${invoice.customer.address || ''}</p>
          ${invoice.customer.gst ? `<p>GST: ${invoice.customer.gst}</p>` : ''}
        </div>
        <div class="invoice-meta">
          <h4>Payment Details</h4>
          <p><strong>Payment Method:</strong> ${invoice.paymentMethod}</p>
          <p><strong>Payment Status:</strong> Pending</p>
          <p><strong>Terms:</strong> Due on receipt</p>
        </div>
      </div>
      
      <table class="items-table">
        <thead>
          <tr><th>Item Description</th><th>Quantity</th><th>Unit Price</th><th>Total</th></tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
      </table>
      
      <div class="payment-info">
        <h4>Bank Transfer Details</h4>
        <p><strong>UPI:</strong> nova@okhdfcbank | <strong>Account:</strong> 1234567890 (HDFC Bank)</p>
      </div>
      
      <div class="summary-section">
        <div class="summary-box">
          <div class="summary-row"><span>Subtotal:</span><span>${formatCurrency(invoice.subtotal)}</span></div>
          <div class="summary-row"><span>CGST (${invoice.cgstRate}%):</span><span>${formatCurrency(invoice.cgst)}</span></div>
          <div class="summary-row"><span>SGST (${invoice.sgstRate}%):</span><span>${formatCurrency(invoice.sgst)}</span></div>
          ${invoice.discount > 0 ? `<div class="summary-row"><span>Discount (${invoice.discountPercent}%):</span><span>-${formatCurrency(invoice.discount)}</span></div>` : ''}
          <div class="grand-total-row"><span>Grand Total:</span><span>${formatCurrency(invoice.grandTotal)}</span></div>
        </div>
      </div>
      
      <div class="print-btn">
        <button class="btn-primary" onclick="printInvoice()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
            <path d="M6 9V3h12v6"/>
            <rect x="6" y="15" width="12" height="6" rx="2"/>
          </svg>
          Print Invoice
        </button>
      </div>
      
      <div style="margin-top: 2rem; text-align: center; color: #94a3b8; font-size: 0.7rem;">
        Thank you for your business! For inquiries, contact support@nova.com
      </div>
    </div>
  `;
}

// Print Function
window.printInvoice = function() {
  const printContent = document.getElementById('invoicePreview').innerHTML;
  
  const printWindow = window.open('', '_blank');
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Invoice Print</title>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', sans-serif; padding: 2rem; background: white; color: #0f172a; }
        @media print { body { padding: 0; } .print-btn { display: none; } }
        .invoice-card { max-width: 100%; margin: 0 auto; }
        .invoice-header { display: flex; justify-content: space-between; margin-bottom: 2rem; padding-bottom: 1.5rem; border-bottom: 2px solid #e2e8f0; }
        .company-info h2 { font-size: 1.5rem; color: #6366f1; margin-bottom: 0.5rem; }
        .invoice-title { font-size: 2rem; font-weight: 700; }
        .billing-section { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-bottom: 2rem; }
        .items-table { width: 100%; border-collapse: collapse; margin-bottom: 2rem; }
        .items-table th, .items-table td { padding: 0.75rem; text-align: left; border-bottom: 1px solid #e2e8f0; }
        .items-table th { background: #f8fafc; font-weight: 600; }
        .payment-info { background: #f8fafc; padding: 1rem; border-radius: 12px; margin-bottom: 2rem; }
        .summary-section { display: flex; justify-content: flex-end; }
        .summary-box { width: 320px; }
        .summary-row { display: flex; justify-content: space-between; padding: 0.5rem 0; }
        .grand-total-row { font-weight: 700; color: #6366f1; border-top: 2px solid #e2e8f0; margin-top: 0.5rem; padding-top: 0.75rem; }
      </style>
    </head>
    <body>${printContent}<script>window.onload = () => { window.print(); setTimeout(() => window.close(), 500); };<\/script></body></html>
  `);
  printWindow.document.close();
};

// Modal Management
const modal = document.getElementById('invoiceModal');
const createBtn = document.getElementById('createInvoiceBtn');
const emptyCreateBtn = document.getElementById('emptyCreateBtn');
const closeModal = document.getElementById('closeModalBtn');

function openModal() {
  if (modal) {
    modal.classList.add('active');
    resetModal();
    document.getElementById('step1').classList.add('active');
    document.getElementById('step2').classList.remove('active');
    document.getElementById('modalTitle').textContent = 'Create New Invoice';
  }
}

function closeModalFunc() {
  if (modal) {
    modal.classList.remove('active');
  }
}

function resetModal() {
  document.getElementById('custName').value = '';
  document.getElementById('custEmail').value = '';
  document.getElementById('custPhone').value = '';
  document.getElementById('custAddress').value = '';
  document.getElementById('custGst').value = '';
  document.getElementById('cgstRate').value = '2.5';
  document.getElementById('sgstRate').value = '2.5';
  document.getElementById('discountRate').value = '0';
  currentItems = [];
  renderItemsTable();
  updateCalculations();
}

if (createBtn) createBtn.addEventListener('click', openModal);
if (emptyCreateBtn) emptyCreateBtn.addEventListener('click', openModal);
if (closeModal) closeModal.addEventListener('click', closeModalFunc);

// Step Navigation
document.getElementById('nextToStep2')?.addEventListener('click', () => {
  const name = document.getElementById('custName').value.trim();
  const email = document.getElementById('custEmail').value.trim();
  if (!name || !email) {
    showToast('Please enter customer name and email', 'error');
    return;
  }
  document.getElementById('step1').classList.remove('active');
  document.getElementById('step2').classList.add('active');
  document.getElementById('modalTitle').textContent = 'Add Items & Payment';
});

document.getElementById('backToStep1')?.addEventListener('click', () => {
  document.getElementById('step2').classList.remove('active');
  document.getElementById('step1').classList.add('active');
  document.getElementById('modalTitle').textContent = 'Create New Invoice';
});

// Items Management
function renderItemsTable() {
  const tbody = document.getElementById('itemsTableBody');
  if (!tbody) return;
  
  tbody.innerHTML = currentItems.map((item, index) => `
    <tr>
      <td>${item.name}</td>
      <td>${item.quantity}</td>
      <td>${formatCurrency(item.price)}</td>
      <td>${formatCurrency(item.quantity * item.price)}</td>
      <td><button class="delete-item" onclick="removeItem(${index})">🗑️</button></td>
    </tr>
  `).join('');
  updateCalculations();
}

window.removeItem = function(index) {
  currentItems.splice(index, 1);
  renderItemsTable();
};

document.getElementById('addItemButton')?.addEventListener('click', () => {
  const name = document.getElementById('itemName').value.trim();
  const qty = parseInt(document.getElementById('itemQty').value);
  const price = parseFloat(document.getElementById('itemPrice').value);
  
  if (!name || !qty || !price) {
    showToast('Please fill all item fields', 'error');
    return;
  }
  
  currentItems.push({ name, quantity: qty, price });
  renderItemsTable();
  
  document.getElementById('itemName').value = '';
  document.getElementById('itemQty').value = '1';
  document.getElementById('itemPrice').value = '';
  showToast('Item added successfully', 'success');
});

// Calculations
function updateCalculations() {
  const subtotal = currentItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  const cgstRate = parseFloat(document.getElementById('cgstRate')?.value) || 0;
  const sgstRate = parseFloat(document.getElementById('sgstRate')?.value) || 0;
  const discountPercent = parseFloat(document.getElementById('discountRate')?.value) || 0;
  
  const cgst = subtotal * (cgstRate / 100);
  const sgst = subtotal * (sgstRate / 100);
  const discount = subtotal * (discountPercent / 100);
  const grandTotal = subtotal + cgst + sgst - discount;
  
  document.getElementById('summarySubtotal').textContent = formatCurrency(subtotal);
  document.getElementById('summaryCgst').textContent = formatCurrency(cgst);
  document.getElementById('summarySgst').textContent = formatCurrency(sgst);
  document.getElementById('summaryDiscount').textContent = formatCurrency(discount);
  document.getElementById('summaryGrandTotal').textContent = formatCurrency(grandTotal);
  document.getElementById('cgstLabel').textContent = cgstRate;
  document.getElementById('sgstLabel').textContent = sgstRate;
  
  return { subtotal, cgst, sgst, discount, grandTotal };
}

// Real-time calculation listeners
['cgstRate', 'sgstRate', 'discountRate'].forEach(id => {
  const el = document.getElementById(id);
  if (el) {
    el.addEventListener('input', updateCalculations);
  }
});

// Generate Invoice
document.getElementById('generateInvoiceBtn')?.addEventListener('click', () => {
  if (currentItems.length === 0) {
    showToast('Please add at least one item', 'error');
    return;
  }
  
  const name = document.getElementById('custName').value.trim();
  const email = document.getElementById('custEmail').value.trim();
  const phone = document.getElementById('custPhone').value;
  const address = document.getElementById('custAddress').value;
  const gst = document.getElementById('custGst').value;
  const cgstRate = parseFloat(document.getElementById('cgstRate').value);
  const sgstRate = parseFloat(document.getElementById('sgstRate').value);
  const discountPercent = parseFloat(document.getElementById('discountRate').value);
  const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked')?.value || 'UPI';
  
  const { subtotal, cgst, sgst, discount, grandTotal } = updateCalculations();
  
  const newInvoice = {
    id: Date.now().toString(),
    userId: currentUserId,
    invoiceNumber: generateInvoiceNumber(),
    date: new Date().toISOString(),
    customer: { name, email, phone, address, gst },
    items: currentItems,
    paymentMethod,
    subtotal,
    cgstRate,
    sgstRate,
    cgst,
    sgst,
    discountPercent,
    discount,
    grandTotal
  };
  
  invoices.unshift(newInvoice);
  saveInvoices();
  selectInvoice(newInvoice.id);
  closeModalFunc();
  
  showToast(`✓ Invoice ${newInvoice.invoiceNumber} generated successfully! Total: ${formatCurrency(grandTotal)}`, 'success');
});

// Setup Event Listeners
function setupEventListeners() {
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModalFunc();
    });
  }
  
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal?.classList.contains('active')) closeModalFunc();
  });
}