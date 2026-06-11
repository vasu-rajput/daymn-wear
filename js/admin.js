let allOrders = [];

async function loadDashboard() {
  try {
    allOrders = await window.DaymnDB.getAllOrders();

    let sold = 0;
    try {
      sold = await window.DaymnDB.getInventory();
    } catch(e) {
      console.warn('Inventory fetch failed, defaulting to 0:', e);
    }

    const remaining = 100 - sold;
    const revenue = allOrders.length * 1999;
    const shipped = allOrders.filter(o => o.shipped).length;

    document.getElementById('stat-orders').textContent = allOrders.length;
    document.getElementById('stat-revenue').textContent = '₹' + revenue.toLocaleString('en-IN');
    document.getElementById('stat-remaining').textContent = remaining;
    document.getElementById('stat-shipped').textContent = shipped;

    const banner = document.getElementById('low-stock-banner');
    if (banner) {
      banner.style.display = remaining < 20 ? 'block' : 'none';
      const bannerText = document.getElementById('low-stock-text');
      if (bannerText) bannerText.textContent = '⚠ Low stock — ' + remaining + ' caps remaining. Time to plan Drop 002.';
    }

    renderTable();
  } catch(e) {
    console.error('Dashboard load failed:', e);
  }
}

function renderTable() {
  const tbody = document.getElementById('orders-tbody');
  if (!tbody) return;

  tbody.innerHTML = allOrders.map((order, i) => `
    <tr style="background:${i % 2 === 0 ? '#0A0806' : '#1C1712'}">
      <td style="padding:1rem;font-family:Space Mono,monospace;font-size:0.7rem;color:rgba(242,237,228,0.4)">${i + 1}</td>
      <td style="padding:1rem;font-size:0.8rem;color:#F2EDE4">${order.name || ''}</td>
      <td style="padding:1rem;font-size:0.8rem;color:rgba(242,237,228,0.6)">${order.email || ''}</td>
      <td style="padding:1rem;font-size:0.8rem;color:rgba(242,237,228,0.6)">${order.phone || ''}</td>
      <td style="padding:1rem;font-size:0.8rem;color:#E8610A;font-weight:600">${order.size || ''}</td>
      <td style="padding:1rem;font-size:0.75rem;color:rgba(242,237,228,0.6)">${order.address || ''}</td>
      <td style="padding:1rem;font-size:0.8rem;color:rgba(242,237,228,0.6)">${order.pincode || ''}</td>
      <td style="padding:1rem;font-family:Space Mono,monospace;font-size:0.65rem;color:rgba(242,237,228,0.4)">${order.payment_id || ''}</td>
      <td style="padding:1rem;font-size:0.75rem;color:rgba(242,237,228,0.4)">${new Date(order.created_at).toLocaleDateString('en-IN')}</td>
      <td style="padding:1rem;">
        <button
          onclick="toggleShipped('${order.id}', this)"
          style="
            padding:0.4rem 0.8rem;
            font-size:0.6rem;
            letter-spacing:0.15em;
            text-transform:uppercase;
            cursor:pointer;
            font-family:Space Grotesk,sans-serif;
            background:${order.shipped ? '#E8610A' : 'transparent'};
            color:${order.shipped ? '#0A0806' : '#E8610A'};
            border:1px solid #E8610A;
            white-space:nowrap;
          "
        >${order.shipped ? 'Shipped ✓' : 'Mark Shipped'}</button>
      </td>
    </tr>
  `).join('');
}

async function toggleShipped(orderId) {
  try {
    await window.DaymnDB.updateShipped(orderId);
    const order = allOrders.find(o => String(o.id) === String(orderId));
    if (!order) return;

    order.shipped = !order.shipped;

    if (order.shipped) {
      try {
        const response = await fetch('/api/send-shipping-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: order.name,
            email: order.email,
            paymentId: order.payment_id,
            size: order.size,
            amount: order.amount
          })
        });

        const result = await response.json();

        if (result.success) {
          showAdminNotification('Marked as shipped. Email sent to ' + order.email);
        } else {
          showAdminNotification('Marked as shipped. Email failed — check Resend dashboard.');
        }
      } catch(e) {
        console.error('Email send failed:', e);
        showAdminNotification('Marked as shipped. Email could not be sent.');
      }
    }

    const shipped = allOrders.filter(o => o.shipped).length;
    document.getElementById('stat-shipped').textContent = shipped;
    renderTable();
  } catch(e) {
    console.error('Update failed:', e);
  }
}

function showAdminNotification(message) {
  const existing = document.getElementById('admin-notification');
  if (existing) existing.remove();

  const notification = document.createElement('div');
  notification.id = 'admin-notification';
  notification.style.cssText = `
    position:fixed;
    bottom:2rem;
    right:2rem;
    background:#1C1712;
    border:1px solid #E8610A;
    color:#F2EDE4;
    padding:1rem 1.5rem;
    font-family:Space Grotesk,sans-serif;
    font-size:0.8rem;
    z-index:1000;
    max-width:320px;
    line-height:1.6;
  `;
  notification.textContent = message;
  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 4000);
}

function exportCSV() {
  const headers = ['#','Name','Email','Phone','Size','Address','Pincode','Payment ID','Date','Shipped'];
  const rows = allOrders.map((o, i) => [
    i + 1,
    o.name,
    o.email,
    o.phone,
    o.size,
    '"' + (o.address || '').replace(/"/g, '""') + '"',
    o.pincode,
    o.payment_id,
    new Date(o.created_at).toLocaleDateString('en-IN'),
    o.shipped ? 'Yes' : 'No'
  ]);
  const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'daymn-orders.csv';
  a.click();
  URL.revokeObjectURL(url);
}

window.toggleShipped = toggleShipped;
window.exportCSV = exportCSV;

document.addEventListener('DOMContentLoaded', function() {
  const overlay = document.getElementById('password-overlay') || document.getElementById('admin-overlay');
  const dashboard = document.getElementById('admin-dashboard');
  const input = document.getElementById('admin-password');
  const enterBtn = document.getElementById('enter-admin');
  const errorMsg = document.getElementById('password-error');

  function checkPassword() {
    if (input.value === 'daymn2025') {
      overlay.style.display = 'none';
      if (dashboard) dashboard.hidden = false;
      loadDashboard();
    } else {
      input.style.animation = 'none';
      input.offsetHeight;
      input.style.animation = 'shake 0.3s ease';
      if (errorMsg) errorMsg.style.display = 'block';
      input.value = '';
    }
  }

  if (enterBtn) enterBtn.addEventListener('click', checkPassword);
  if (input) {
    input.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') checkPassword();
    });
  }
});
