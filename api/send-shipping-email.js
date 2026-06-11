const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, paymentId, size, amount } = req.body;

  if (!email || !name) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const { data, error } = await resend.emails.send({
      from: 'Daymn Wear <onboarding@resend.dev>',
      to: email,
      subject: 'Your Mumbai Cap is on its way',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
        </head>
        <body style="margin:0;padding:0;background:#0A0806;font-family:'Space Grotesk',Arial,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#0A0806;padding:40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
                  <tr>
                    <td style="padding:40px;background:#0A0806;border-bottom:1px solid rgba(242,237,228,0.06);">
                      <p style="margin:0;font-size:11px;letter-spacing:0.3em;text-transform:uppercase;color:#E8610A;font-family:monospace;">Daymn Wear</p>
                      <p style="margin:8px 0 0;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:rgba(242,237,228,0.3);font-family:monospace;">Wear the Story</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:50px 40px;background:#1C1712;">
                      <p style="margin:0 0 16px;font-size:11px;letter-spacing:0.3em;text-transform:uppercase;color:#E8610A;font-family:monospace;">Drop 001 — Mumbai</p>
                      <h1 style="margin:0 0 16px;font-size:36px;font-weight:900;color:#F2EDE4;font-family:Georgia,serif;line-height:1.1;">Your cap is<br><em style="color:#E8610A;">on its way.</em></h1>
                      <p style="margin:0;font-size:14px;line-height:1.8;color:rgba(242,237,228,0.5);">Hey ${name}, your Mumbai cap has been shipped. Thank you for being part of Drop 001.</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:0 40px;background:#1C1712;">
                      <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid rgba(242,237,228,0.08);">
                        <tr>
                          <td style="padding:16px 20px;border-bottom:1px solid rgba(242,237,228,0.06);">
                            <p style="margin:0;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:rgba(242,237,228,0.3);font-family:monospace;">Payment ID</p>
                            <p style="margin:4px 0 0;font-size:12px;color:#F2EDE4;font-family:monospace;">${paymentId || ''}</p>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding:16px 20px;border-bottom:1px solid rgba(242,237,228,0.06);">
                            <p style="margin:0;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:rgba(242,237,228,0.3);font-family:monospace;">Product</p>
                            <p style="margin:4px 0 0;font-size:13px;color:#F2EDE4;">Mumbai Cap — Drop 001</p>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding:16px 20px;border-bottom:1px solid rgba(242,237,228,0.06);">
                            <p style="margin:0;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:rgba(242,237,228,0.3);font-family:monospace;">Size</p>
                            <p style="margin:4px 0 0;font-size:13px;color:#F2EDE4;">${size || 'One Size'}</p>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding:16px 20px;">
                            <p style="margin:0;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:rgba(242,237,228,0.3);font-family:monospace;">Amount Paid</p>
                            <p style="margin:4px 0 0;font-size:13px;color:#E8610A;font-weight:600;">₹${Number(amount || 0).toLocaleString('en-IN')}</p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:40px;background:#1C1712;">
                      <p style="margin:0 0 16px;font-size:13px;line-height:1.9;color:rgba(242,237,228,0.5);">For any queries reply to this email or reach us at <a href="mailto:hello@daymnwear.com" style="color:#E8610A;text-decoration:none;">hello@daymnwear.com</a></p>
                      <p style="margin:0;font-size:13px;line-height:1.9;color:rgba(242,237,228,0.5);">Track your order at <a href="https://daymnwear.com/track.html" style="color:#E8610A;text-decoration:none;">daymnwear.com/track.html</a></p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:30px 40px;background:#0A0806;border-top:1px solid rgba(242,237,228,0.06);">
                      <p style="margin:0;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:rgba(242,237,228,0.2);font-family:monospace;">© 2025 Daymn Wear. Made in India.</p>
                      <p style="margin:8px 0 0;font-size:10px;font-style:italic;color:rgba(242,237,228,0.15);font-family:Georgia,serif;">Wear the Story.</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `
    });

    if (error) {
      console.error('Resend error:', error);
      return res.status(400).json({ error });
    }

    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: err.message });
  }
};
