const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/user');
const sendTempPasswordMail = require('../utils/mailer');
const { authenticateToken, authorizeRoles } = require('../middlewares/auth');

// Registrar usuario
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ mensaje: 'El correo ya está registrado' });
    }

    const domain = email.split('@')[1];
    const role = domain === 'techno.io' ? 'admin' : 'employee';
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({ name, email, password: hashedPassword, role });
    await newUser.save();

    res.status(201).json({ mensaje: 'Usuario creado exitosamente' });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error del servidor al registrar usuario' });
  }
});

// Inicio de sesión
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    if (user.tempPassword && user.tempPasswordExpires < new Date()) {
      user.tempPassword = null;
      user.tempPasswordExpires = null;
      await user.save();
    }

    let isMatch = await bcrypt.compare(password, user.password);
    let isTemp = false;

    if (!isMatch && user.tempPassword && user.tempPasswordExpires > new Date()) {
      isMatch = await bcrypt.compare(password, user.tempPassword);
      isTemp = isMatch;
    }
    if (!isMatch) return res.status(400).json({ mensaje: 'Credenciales incorrectas' });
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    const response = {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    };

    if (isTemp) {
      response.mensaje = 'Iniciando sesión. Por favor actualiza tu contraseña temporal. Ya que caducará en 5 minutos.';
    }

    res.json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: 'Error del servidor al iniciar sesión' });
  }
});

// Generar contraseña de acceso temporal
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ mensaje: 'Usuario no encontrado' });

    const tempPassword = crypto.randomBytes(4).toString('hex');
    const hashedTempPassword = await bcrypt.hash(tempPassword, 10);

    user.tempPassword = hashedTempPassword;
    user.tempPasswordExpires = new Date(Date.now() + 5 * 60 * 1000);
    await user.save();

    if (user.role === 'employee') {
      await sendTempPasswordMail(user, tempPassword);
      return res.json({ mensaje: 'Correo enviado con la contraseña temporal' });
    }

    res.json({
      mensaje: 'Los administradores pueden generar su contraseña de acceso directo aquí.',
      tempPassword
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al procesar la solicitud' });
  }
});

// Obtener todos los usuarios (admin)
router.get('/list', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user.id } }).select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al obtener los usuarios' });
  }
});

// Obtener un usuario por ID (admin)
router.get('/list/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al obtener el usuario' });
  }
});

// Actualizar usuario (admin, excepto a sí mismo)
router.put('/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  const { id } = req.params;
  if (req.user.id === id) {
    return res.status(403).json({ mensaje: 'No puedes actualizar tu propio usuario desde esta ruta' });
  }

  try {
    const { password, ...allowedFields } = req.body;
    if (password) {
      return res.status(403).json({ mensaje: 'No puedes modificar la contraseña desde esta ruta' });
    }

    const updatedUser = await User.findByIdAndUpdate(id, allowedFields, { new: true }).select('-password');
    if (!updatedUser) return res.status(404).json({ mensaje: 'Usuario no encontrado' });

    res.json({ mensaje: 'Usuario actualizado correctamente', usuario: updatedUser });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al actualizar el usuario' });
  }
});

// Eliminar usuario (admin, excepto a sí mismo)
router.delete('/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  if (req.user.id === req.params.id) {
    return res.status(403).json({ mensaje: 'No puedes eliminar tu propio usuario desde esta ruta' });
  }

  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser) return res.status(404).json({ mensaje: 'Usuario no encontrado' });

    res.json({ mensaje: 'Usuario eliminado correctamente' });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al eliminar el usuario' });
  }
});

// Obtener su propio perfil
router.get('/profile/:id', authenticateToken, async (req, res) => {
  if (req.user.id !== req.params.id) {
    return res.status(403).json({ mensaje: 'No tienes permiso para ver este perfil' });
  }

  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al obtener el perfil' });
  }
});

// Actualizar su propio perfil
router.put('/profile/:id', authenticateToken, async (req, res) => {
  if (req.user.id !== req.params.id) {
    return res.status(403).json({ mensaje: 'No tienes permiso para actualizar este perfil' });
  }

  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ mensaje: 'Usuario no encontrado' });

    const { name, email, password, role } = req.body;
    if (role) {
      return res.status(403).json({ mensaje: 'No puedes modificar tu rol' });
    }

    if (name) user.name = name;
    if (email) user.email = email;
    if (password) user.password = await bcrypt.hash(password, 10);

    await user.save();
    res.json({ mensaje: 'Perfil actualizado correctamente', usuario: user });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al actualizar el perfil' });
  }
});

// Eliminar su propia cuenta
router.delete('/profile/:id', authenticateToken, async (req, res) => {
  if (req.user.id !== req.params.id) {
    return res.status(403).json({ mensaje: 'No tienes permiso para eliminar esta cuenta' });
  }

  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ mensaje: 'Cuenta eliminada correctamente' });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al eliminar la cuenta' });
  }
});

module.exports = router;