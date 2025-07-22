const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Warehouse = require('../models/warehouse');
const { authenticateToken, authorizeRoles } = require('../middlewares/auth');
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// Crear almacén (solo admin)
router.post('/', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  const { name, location } = req.body;

  if (!name || !location) {
    return res.status(400).json({ mensaje: 'Nombre y ubicación del almacén son obligatorios' });
  }

  try {
    const exists = await Warehouse.findOne({ name: name.trim() });
    if (exists) {
      return res.status(409).json({ mensaje: 'Ya existe un almacén con ese nombre' });
    }

    const newWarehouse = new Warehouse({
      name: name.trim(),
      location: location.trim(),
    });

    await newWarehouse.save();
    res.status(201).json({ mensaje: 'Almacén creado correctamente', almacen: newWarehouse });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al crear el almacén', error: err.message });
  }
});

// Listar todos (admin y employee)
router.get('/', authenticateToken, authorizeRoles('admin', 'employee'), async (_req, res) => {
  try {
    const warehouses = await Warehouse.find();
    res.json(warehouses);
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al obtener los almacenes', error: err.message });
  }
});

// Obtener uno por ID (admin y employee)
router.get('/:id', authenticateToken, authorizeRoles('admin', 'employee'), async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    return res.status(400).json({ mensaje: 'ID de almacén inválido' });
  }

  try {
    const warehouse = await Warehouse.findById(req.params.id);
    if (!warehouse) {
      return res.status(404).json({ mensaje: 'Almacén no encontrado' });
    }

    res.json(warehouse);
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al obtener el almacén', error: err.message });
  }
});

// Actualizar (solo admin)
router.put('/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  const { name, location } = req.body;

  if (!isValidObjectId(req.params.id)) {
    return res.status(400).json({ mensaje: 'ID de almacén inválido' });
  }

  if (!name || !location) {
    return res.status(400).json({ mensaje: 'Nombre y ubicación son requeridos' });
  }

  try {
    const duplicate = await Warehouse.findOne({
      name: name.trim(),
      _id: { $ne: req.params.id },
    });

    if (duplicate) {
      return res.status(409).json({ mensaje: 'Ya existe otro almacén con ese nombre' });
    }

    const updated = await Warehouse.findByIdAndUpdate(
      req.params.id,
      {
        name: name.trim(),
        location: location.trim(),
      },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ mensaje: 'Almacén no encontrado' });
    }

    res.json({ mensaje: 'Almacén actualizado correctamente', almacen: updated });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al actualizar el almacén', error: err.message });
  }
});

// Eliminar (solo admin)
router.delete('/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    return res.status(400).json({ mensaje: 'ID de almacén inválido' });
  }

  try {
    const deleted = await Warehouse.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ mensaje: 'Almacén no encontrado' });
    }

    res.json({ mensaje: 'Almacén eliminado correctamente' });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al eliminar el almacén', error: err.message });
  }
});

module.exports = router;