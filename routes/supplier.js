const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Supplier = require('../models/supplier');
const { authenticateToken, authorizeRoles } = require('../middlewares/auth');
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// Crear proveedor (solo admin)
router.post('/', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  const { name, contactName, email, phone, address, rfc } = req.body;

  if (!name || !contactName || !email || !phone || !address || !rfc) {
    return res.status(400).json({ mensaje: 'Todos los campos son obligatorios' });
  }

  try {
    const existing = await Supplier.findOne({ rfc: rfc.trim().toUpperCase() });
    if (existing) {
      return res.status(409).json({ mensaje: 'Ya existe un proveedor con ese RFC' });
    }

    const supplier = new Supplier({
      name: name.trim(),
      contactName: contactName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      address: address.trim(),
      rfc: rfc.trim().toUpperCase(),
    });

    await supplier.save();
    res.status(201).json({ mensaje: 'Proveedor creado exitosamente', proveedor: supplier });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al crear proveedor', error: err.message });
  }
});

// Obtener todos los proveedores (admin y employee)
router.get('/', authenticateToken, authorizeRoles('admin', 'employee'), async (_req, res) => {
  try {
    const suppliers = await Supplier.find();
    res.json(suppliers);
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al obtener proveedores', error: err.message });
  }
});

// Obtener proveedor por ID (admin y employee)
router.get('/:id', authenticateToken, authorizeRoles('admin', 'employee'), async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return res.status(400).json({ mensaje: 'ID de proveedor no válido' });
  }

  try {
    const supplier = await Supplier.findById(id);
    if (!supplier) {
      return res.status(404).json({ mensaje: 'Proveedor no encontrado' });
    }
    res.json(supplier);
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al obtener proveedor', error: err.message });
  }
});

// Actualizar proveedor (solo admin)
router.put('/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return res.status(400).json({ mensaje: 'ID de proveedor no válido' });
  }

  try {
    const updated = await Supplier.findByIdAndUpdate(
      id,
      {
        ...req.body,
        rfc: req.body.rfc?.trim().toUpperCase(),
        email: req.body.email?.trim().toLowerCase(),
        name: req.body.name?.trim(),
        contactName: req.body.contactName?.trim(),
        phone: req.body.phone?.trim(),
        address: req.body.address?.trim(),
      },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ mensaje: 'Proveedor no encontrado' });
    }

    res.json({ mensaje: 'Proveedor actualizado', proveedor: updated });
  } catch (err) {
    res.status(400).json({ mensaje: 'Error al actualizar proveedor', error: err.message });
  }
});

// Eliminar proveedor (solo admin)
router.delete('/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return res.status(400).json({ mensaje: 'ID de proveedor no válido' });
  }

  try {
    const deleted = await Supplier.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ mensaje: 'Proveedor no encontrado' });
    }
    res.json({ mensaje: 'Proveedor eliminado correctamente' });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al eliminar proveedor', error: err.message });
  }
});

module.exports = router;