// Needs env vars: RESEND_API_KEY, FROM_EMAIL (on a domain verified in Resend), NOTIFY_EMAIL (your team inbox)
const FREE = /^(gmail|googlemail|yahoo|ymail|rocketmail|hotmail|outlook|live|msn|aol|icloud|me|mac|proton|protonmail|pm|gmx|mail|zoho|yandex|rediffmail|rediff|inbox|hey|fastmail)\.(com|net|org|in|co\.in|co\.uk|co|me|fr|de|it|ca|com\.au)$/i;
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const send = (to, subject, html, reply_to) => fetch('https://api.resend.com/emails', {
  method: 'POST',
  headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ from: `Opika <${process.env.FROM_EMAIL}>`, to, subject, html, reply_to })
}).then(r => { if (!r.ok) throw new Error('send failed'); });

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();
  const { name = '', phone = '', email = '', message = '', website = '' } = req.body || {};
  if (website) return res.status(200).json({ ok: true }); // honeypot: bots fill this
  const domain = email.split('@')[1] || '';
  if (!name.trim() || !phone.trim() || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || FREE.test(domain))
    return res.status(400).json({ error: 'Please use your name, phone and a work email.' });
  try {
    await send(email, 'We got your note', `<p>Hi ${esc(name.trim().split(' ')[0])},</p><p>Thank you for reaching out to Opika. We will get back to you within one business day.</p><p>Want to talk sooner? <a href="https://calendly.com/aniket-opika/you">Pick a time</a>.</p><p>Opika</p>`);
    await send(process.env.NOTIFY_EMAIL, `New Opika lead: ${name}`, `<p><b>${esc(name)}</b><br>${esc(email)}<br>${esc(phone)}</p><p>${esc(message) || 'No message'}</p>`, email);
    res.status(200).json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Could not send' });
  }
};
