// backend/routes/contacto.js
import express from 'express';
import nodemailer from 'nodemailer';

const router = express.Router();

// Configuración del transporter de email
const transporter = nodemailer.createTransporter({
  service: 'gmail', // o el servicio que uses
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Ruta para enviar formulario de contacto
router.post('/contacto', async (req, res) => {
  try {
    const { nombre, email, asunto, mensaje } = req.body;

    // Validar campos requeridos
    if (!nombre || !email || !mensaje) {
      return res.status(400).json({
        success: false,
        error: 'Nombre, email y mensaje son obligatorios'
      });
    }

    // 1. Email para los administradores
    const adminMailOptions = {
      from: process.env.EMAIL_USER,
      to: 'admin@ecolibres.com', // Email de administradores
      subject: `Nuevo mensaje de contacto: ${asunto || 'Sin asunto'}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px;">
          <h2 style="color: #10B981;">Nuevo mensaje de contacto - EcoLibres</h2>
          <div style="background: #f9f9f9; padding: 20px; border-radius: 10px;">
            <p><strong>Nombre:</strong> ${nombre}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Asunto:</strong> ${asunto || 'No especificado'}</p>
            <p><strong>Mensaje:</strong></p>
            <p style="background: white; padding: 15px; border-radius: 5px; border-left: 4px solid #10B981;">
              ${mensaje}
            </p>
          </div>
          <p style="color: #666; margin-top: 20px;">
            Este mensaje fue enviado desde el formulario de contacto de EcoLibres.
          </p>
        </div>
      `
    };

    // 2. Email de confirmación para el usuario
    const userMailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: '✅ Hemos recibido tu mensaje - EcoLibres',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px;">
          <h2 style="color: #10B981;">¡Gracias por contactarnos, ${nombre}!</h2>
          <p>Hemos recibido tu mensaje y te responderemos en menos de 24 horas.</p>
          
          <div style="background: #f0f9ff; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <h3 style="color: #0369A1;">Resumen de tu mensaje:</h3>
            <p><strong>Asunto:</strong> ${asunto || 'Consulta general'}</p>
            <p><strong>Mensaje:</strong> ${mensaje}</p>
          </div>

          <p>Mientras tanto, puedes explorar nuestras aventuras en <a href="https://ecolibres.com" style="color: #10B981;">ecolibres.com</a></p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
            <p style="color: #666; font-size: 14px;">
              <strong>Equipo EcoLibres</strong><br>
              📧 hola@ecolibres.com<br>
              📱 +52 123 456 7890
            </p>
          </div>
        </div>
      `
    };

    // Enviar ambos emails
    await transporter.sendMail(adminMailOptions);
    await transporter.sendMail(userMailOptions);

    console.log(`📧 Formulario de contacto enviado por: ${nombre} (${email})`);

    res.status(200).json({
      success: true,
      message: 'Mensaje enviado correctamente. Te contactaremos en menos de 24 horas.'
    });

  } catch (error) {
    console.error('❌ Error enviando formulario de contacto:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor. Por favor intenta nuevamente.'
    });
  }
});

export default router;