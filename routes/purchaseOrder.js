const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const PurchaseOrder = require('../models/purchaseOrder');
const Supplier = require('../models/supplier');
const Product = require('../models/product');
const { authenticateToken, authorizeRoles } = require('../middlewares/auth');
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

async function generatePurchaseOrderCode() {
  const count = await PurchaseOrder.countDocuments();
  const nextNumber = count + 1;
  const code = `OC-${String(nextNumber).padStart(5, '0')}`;
  const exists = await PurchaseOrder.findOne({ code });
  if (exists) {
    return generatePurchaseOrderCode();
  }
  return code;
}

// Crear orden de compra (solo admin)
router.post('/', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  const { supplier, items, expectedDate } = req.body;

  if (!supplier || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ mensaje: 'Proveedor e items son obligatorios' });
  }

  if (!isValidObjectId(supplier)) {
    return res.status(400).json({ mensaje: 'ID de proveedor inválido' });
  }

  try {
    const supplierExists = await Supplier.findById(supplier);
    if (!supplierExists) {
      return res.status(404).json({ mensaje: 'Proveedor no encontrado' });
    }

    for (const item of items) {
      if (!item.product || !isValidObjectId(item.product)) {
        return res.status(400).json({ mensaje: 'ID de producto inválido en items' });
      }

      const productExists = await Product.findById(item.product);
      if (!productExists) {
        return res.status(404).json({ mensaje: `Producto no encontrado: ${item.product}` });
      }

      if (item.quantity < 1 || item.unitPrice < 0) {
        return res.status(400).json({ mensaje: 'Cantidad o precio inválido en items' });
      }
    }
    const totalAmount = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const code = await generatePurchaseOrderCode();
    const newOrder = new PurchaseOrder({
      code,
      supplier,
      items,
      totalAmount,
      expectedDate
    });
    await newOrder.save();
    res.status(201).json({ mensaje: 'Orden de compra creada exitosamente', orden: newOrder });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al crear orden de compra', error: err.message });
  }
});

// Listar todas las órdenes (admin y employee)
router.get('/', authenticateToken, authorizeRoles('admin', 'employee'), async (_req, res) => {
  try {
    const orders = await PurchaseOrder.find()
      .populate('supplier', 'name')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al obtener órdenes', error: err.message });
  }
});

// Obtener orden por ID (admin y employee)
router.get('/:id', authenticateToken, authorizeRoles('admin', 'employee'), async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return res.status(400).json({ mensaje: 'ID de orden inválido' });
  }

  try {
    const order = await PurchaseOrder.findById(id).populate('supplier', 'name');
    if (!order) {
      return res.status(404).json({ mensaje: 'Orden no encontrada' });
    }

    res.json(order);
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al obtener orden', error: err.message });
  }
});

// Actualizar orden (solo admin)
router.put('/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  const { id } = req.params;
  const { supplier, items, status, expectedDate } = req.body;

  if (!isValidObjectId(id)) {
    return res.status(400).json({ mensaje: 'ID de orden inválido' });
  }

  if (supplier && !isValidObjectId(supplier)) {
    return res.status(400).json({ mensaje: 'ID de proveedor inválido' });
  }

  try {
    if (supplier) {
      const supplierExists = await Supplier.findById(supplier);
      if (!supplierExists) {
        return res.status(404).json({ mensaje: 'Proveedor no encontrado' });
      }
    }

    if (items && (!Array.isArray(items) || items.length === 0)) {
      return res.status(400).json({ mensaje: 'La lista de items debe ser un arreglo no vacío' });
    }

    if (items) {
      for (const item of items) {
        if (!item.product || !isValidObjectId(item.product)) {
          return res.status(400).json({ mensaje: 'ID de producto inválido en items' });
        }

        const productExists = await Product.findById(item.product);
        if (!productExists) {
          return res.status(404).json({ mensaje: `Producto no encontrado: ${item.product}` });
        }

        if (item.quantity < 1 || item.unitPrice < 0) {
          return res.status(400).json({ mensaje: 'Cantidad o precio inválido en items' });
        }
      }
    }

    let totalAmount;
    if (items) {
      totalAmount = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    }

    const updated = await PurchaseOrder.findByIdAndUpdate(
      id,
      {
        ...(supplier && { supplier }),
        ...(items && { items }),
        ...(typeof totalAmount === 'number' && { totalAmount }),
        ...(status && { status }),
        ...(expectedDate && { expectedDate }),
      },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ mensaje: 'Orden no encontrada' });
    }

    res.json({ mensaje: 'Orden actualizada correctamente', orden: updated });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al actualizar orden', error: err.message });
  }
});

// Eliminar orden (solo admin)
router.delete('/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return res.status(400).json({ mensaje: 'ID de orden inválido' });
  }

  try {
    const deleted = await PurchaseOrder.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ mensaje: 'Orden no encontrada' });
    }

    res.json({ mensaje: 'Orden eliminada exitosamente' });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al eliminar orden', error: err.message });
  }
});

module.exports = router;