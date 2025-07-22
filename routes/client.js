const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Client = require('../models/client');
const { authenticateToken, authorizeRoles } = require('../middlewares/auth');
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// Crear cliente (admin y employee)
router.post('/', authenticateToken, authorizeRoles('admin', 'employee'), async (req, res) => {
  const { name, email, phone, address } = req.body;

  if (!name || !email || !phone || !address) {
    return res.status(400).json({ mensaje: 'Todos los campos son obligatorios' });
  }

  try {
    const existingClient = await Client.findOne({ email: email.trim() });
    if (existingClient) {
      return res.status(409).json({ mensaje: 'Ya existe un cliente con ese correo electrónico' });
    }

    const newClient = new Client({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      address: address.trim()
    });

    await newClient.save();
    res.status(201).json({ mensaje: 'Cliente creado exitosamente', cliente: newClient });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al crear cliente', error: err.message });
  }
});

// Obtener todos los clientes (admin y employee)
router.get('/', authenticateToken, authorizeRoles('admin', 'employee'), async (req, res) => {
  try {
    const clients = await Client.find();
    res.json(clients);
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al obtener clientes', error: err.message });
  }
});

// Obtener cliente por ID (admin y employee)
router.get('/:id', authenticateToken, authorizeRoles('admin', 'employee'), async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    return res.status(400).json({ mensaje: 'ID de cliente inválido' });
  }

  try {
    const client = await Client.findById(req.params.id);
    if (!client) return res.status(404).json({ mensaje: 'Cliente no encontrado' });

    res.json(client);
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al obtener cliente', error: err.message });
  }
});

// Actualizar cliente (admin y employee)
router.put('/:id', authenticateToken, authorizeRoles('admin', 'employee'), async (req, res) => {
  const { name, email, phone, address } = req.body;

  if (!isValidObjectId(req.params.id)) {
    return res.status(400).json({ mensaje: 'ID de cliente inválido' });
  }

  if (!name || !email || !phone || !address) {
    return res.status(400).json({ mensaje: 'Todos los campos son obligatorios' });
  }

  try {
    const existingClient = await Client.findOne({
      email: email.trim(),
      _id: { $ne: req.params.id }
    });

    if (existingClient) {
      return res.status(409).json({ mensaje: 'Ya existe otro cliente con ese correo electrónico' });
    }

    const updatedClient = await Client.findByIdAndUpdate(
      req.params.id,
      {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        address: address.trim()
      },
      { new: true, runValidators: true }
    );

    if (!updatedClient) return res.status(404).json({ mensaje: 'Cliente no encontrado' });

    res.json({ mensaje: 'Cliente actualizado correctamente', cliente: updatedClient });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al actualizar cliente', error: err.message });
  }
});

// Eliminar cliente (solo admin)
router.delete('/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    return res.status(400).json({ mensaje: 'ID de cliente inválido' });
  }

  try {
    const deletedClient = await Client.findByIdAndDelete(req.params.id);
    if (!deletedClient) return res.status(404).json({ mensaje: 'Cliente no encontrado' });

    res.json({ mensaje: 'Cliente eliminado exitosamente' });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al eliminar cliente', error: err.message });
  }
});

module.exports = router;