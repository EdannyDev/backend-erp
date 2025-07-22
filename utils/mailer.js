require('dotenv').config();
const nodemailer = require('nodemailer');
const { google } = require('googleapis');

const CLIENT_ID = process.env.GMAIL_CLIENT_ID;
const CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.GMAIL_REFRESH_TOKEN;
const REDIRECT_URI = 'https://developers.google.com/oauthplayground';

const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

async function sendTempPasswordMail(user, tempPassword) {
  try {
    const accessToken = await oAuth2Client.getAccessToken();

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: process.env.GMAIL_SENDER,
        clientId: CLIENT_ID,
        clientSecret: CLIENT_SECRET,
        refreshToken: REFRESH_TOKEN,
        accessToken: accessToken.token,
      },
    });

    const mailOptions = {
      from: `"Techno Support" <${process.env.GMAIL_SENDER}>`,
      to: user.email,
      subject: 'Contraseña Temporal',
      html: `
        <div style="font-family: sans-serif; padding: 40px 20px;">
          <div style="max-width: 600px; margin: auto; background-color: #fcfcfc; padding: 30px; border-radius: 8px; border: 1px solid #ddd; box-shadow: 0 0 10px rgba(0,0,0,0.03);">

            <p style="color: #444;">Hola <strong>${user.name}</strong>,</p>

            <p style="color: #444; line-height: 1.5;">
              Has solicitado una contraseña temporal para acceder a tu cuenta. Aquí está tu nueva clave:
            </p>

            <div style="font-size: 20px; font-weight: bold; color: #d32f2f; padding: 10px 0; text-align: center;">
              ${tempPassword}
            </div>

            <p style="color: #555; font-size: 14px;">
              Esta contraseña será válida durante los próximos <strong>5 minutos</strong>. Por seguridad, te recomendamos cambiarla tan pronto como inicies sesión.
            </p>

            <p style="color: #888; font-size: 12px; margin-top: 30px; text-align: center;">
              Este es un mensaje automático de Techno Support. No respondas a este correo.
            </p>
          </div>
        </div>
      `,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Correo enviado:', result);
    return result;
  } catch (error) {
    console.error('Error al enviar correo:', error);
    throw error;
  }
}

module.exports = sendTempPasswordMail;