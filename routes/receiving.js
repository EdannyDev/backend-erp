const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Receiving = require('../models/receiving');
const PurchaseOrder = require('../models/purchaseOrder');
const Warehouse = require('../models/warehouse');
const Product = require('../models/product');
const { authenticateToken, authorizeRoles } = require('../middlewares/auth');
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// Registrar recepción (admin y employee)
router.post('/', authenticateToken, authorizeRoles('admin', 'employee'), async (req, res) => {
  const { purchaseOrder, warehouse, receivedItems, receivedDate } = req.body;

  if (!purchaseOrder || !warehouse || !Array.isArray(receivedItems) || receivedItems.length === 0) {
    return res.status(400).json({ mensaje: 'Orden de compra, almacén e items recibidos son obligatorios' });
  }

  if (!isValidObjectId(purchaseOrder) || !isValidObjectId(warehouse)) {
    return res.status(400).json({ mensaje: 'ID de orden o almacén inválido' });
  }

  for (const item of receivedItems) {
    if (!item.product || !isValidObjectId(item.product) || !item.quantity || item.quantity < 1) {
      return res.status(400).json({ mensaje: 'Cada item debe tener un producto válido y cantidad mínima de 1' });
    }
  }

  try {
    const orderExists = await PurchaseOrder.findById(purchaseOrder);
    if (!orderExists) return res.status(400).json({ mensaje: 'Orden de compra no válida' });

    const warehouseExists = await Warehouse.findById(warehouse);
    if (!warehouseExists) return res.status(400).json({ mensaje: 'Almacén no válido' });

    const duplicate = await Receiving.findOne({ purchaseOrder });
    if (duplicate) return res.status(409).json({ mensaje: 'Ya se registró una recepción para esta orden de compra' });

    const receiving = new Receiving({
      purchaseOrder,
      warehouse,
      receivedItems,
      receivedDate: receivedDate || new Date(),
      receivedBy: req.user.id,
    });

    await receiving.save();

    res.status(201).json({ mensaje: 'Recepción registrada exitosamente', recepcion: receiving });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al registrar recepción', error: err.message });
  }
});

// Obtener todas las recepciones
router.get('/', authenticateToken, authorizeRoles('admin', 'employee'), async (_req, res) => {
  try {
    const receivings = await Receiving.find({ isDeleted: { $ne: true } })
      .populate('purchaseOrder', 'code status')
      .populate('warehouse', 'name')
      .populate('receivedBy', 'name')
      .populate('receivedItems.product', 'name');

    res.json(receivings);
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al obtener recepciones', error: err.message });
  }
});

// Obtener una recepción por ID
router.get('/:id', authenticateToken, authorizeRoles('admin', 'employee'), async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return res.status(400).json({ mensaje: 'ID de recepción inválido' });
  }

  try {
    const receiving = await Receiving.findOne({ _id: id, isDeleted: { $ne: true } })
      .populate('purchaseOrder', 'code status')
      .populate('warehouse', 'name')
      .populate('receivedBy', 'name')
      .populate('receivedItems.product', 'name');

    if (!receiving) return res.status(404).json({ mensaje: 'Recepción no encontrada' });

    res.json(receiving);
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al obtener recepción', error: err.message });
  }
});

// Eliminar recepción (soft-delete)
router.delete('/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return res.status(400).json({ mensaje: 'ID inválido' });
  }

  try {
    const deleted = await Receiving.findByIdAndUpdate(id, { isDeleted: true }, { new: true });

    if (!deleted) {
      return res.status(404).json({ mensaje: 'Recepción no encontrada' });
    }

    res.json({ mensaje: 'Recepción eliminada correctamente' });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al eliminar recepción', error: err.message });
  }
});

// Hard delete (solo para desarrollo)
router.delete('/hard-delete/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return res.status(400).json({ mensaje: 'ID inválido' });
  }

  try {
    await Receiving.findByIdAndDelete(id);
    res.json({ mensaje: 'Recepción eliminada permanentemente' });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al eliminar recepción', error: err.message });
  }
});

module.exports = router;