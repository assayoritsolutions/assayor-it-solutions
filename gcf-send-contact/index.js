const {google} = require('googleapis');

function makeRawEmail({to, from, subject, body}) {
  const message =
    `From: ${from}\r\n` +
    `To: ${to}\r\n` +
    `Subject: ${subject}\r\n` +
    `Content-Type: text/plain; charset="UTF-8"\r\n` +
    `\r\n` +
    `${body}`;
  return Buffer.from(message)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

async function getAuthClient() {
  const keyJson = process.env.SERVICE_ACCOUNT_KEY_JSON;
  if (!keyJson) throw new Error('SERVICE_ACCOUNT_KEY_JSON not set');

  const key = typeof keyJson === 'string' ? JSON.parse(keyJson) : keyJson;

  const client = new google.auth.JWT({
    email: key.client_email,
    key: key.private_key,
    scopes: ['https://www.googleapis.com/auth/gmail.send'],
    subject: process.env.EMAIL_IMPERSONATE // email to impersonate, e.g. sales@assayor.com
  });

  await client.authorize();
  return client;
}

exports.sendContactEmail = async (req, res) => {
  // CORS preflight
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).send('');

  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const data = req.body || {};
  const name = data.name || 'Website Visitor';
  const fromEmail = data.email || 'noreply@assayor.com';
  const subject = `Website Inquiry from ${name}`;
  const body = [
    data.message || '',
    '',
    `Name: ${name}`,
    `Email: ${data.email || ''}`,
    `Phone: ${data.phone || ''}`,
    `Website: ${data.website || ''}`
  ].join('\n');

  try {
    const auth = await getAuthClient();
    const gmail = google.gmail({version: 'v1', auth});

    const raw = makeRawEmail({
      to: process.env.TO_EMAIL || 'sales@assayor.com',
      from: process.env.EMAIL_IMPERSONATE || 'sales@assayor.com',
      subject,
      body
    });

    await gmail.users.messages.send({ userId: 'me', requestBody: { raw } });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};
