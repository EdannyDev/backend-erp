const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Invoice = require('../models/invoice');
const Client = require('../models/client');
const { authenticateToken, authorizeRoles } = require('../middlewares/auth');
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// Crear factura (admin y employee)
router.post('/', authenticateToken, authorizeRoles('admin', 'employee'), async (req, res) => {
  const { client, items, total, invoiceNumber, dueDate } = req.body;

  if (!client || !items || !Array.isArray(items) || items.length === 0 || !total || !invoiceNumber || !dueDate) {
    return res.status(400).json({ mensaje: 'Todos los campos obligatorios deben ser proporcionados' });
  }

  if (!isValidObjectId(client)) {
    return res.status(400).json({ mensaje: 'ID de cliente inválido' });
  }

  for (const item of items) {
    if (
      !item.product || !isValidObjectId(item.product) ||
      typeof item.quantity !== 'number' || item.quantity <= 0 ||
      typeof item.price !== 'number' || item.price < 0
    ) {
      return res.status(400).json({ mensaje: 'Cada item debe tener producto válido, cantidad positiva y precio correcto' });
    }
  }

  try {
    const clientExists = await Client.findById(client);
    if (!clientExists) {
      return res.status(404).json({ mensaje: 'Cliente no encontrado' });
    }

    const existingInvoice = await Invoice.findOne({ invoiceNumber });
    if (existingInvoice) {
      return res.status(409).json({ mensaje: 'Ya existe una factura con ese número' });
    }

    const calculatedTotal = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    if (calculatedTotal !== total) {
      return res.status(400).json({ mensaje: 'El total no coincide con la suma de los items' });
    }

    const newInvoice = new Invoice({ client, items, total, invoiceNumber: invoiceNumber.trim(), dueDate });
    await newInvoice.save();
    res.status(201).json({ mensaje: 'Factura creada', factura: newInvoice });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al crear factura', error: err.message });
  }
});

// Obtener todas las facturas (admin y employee)
router.get('/', authenticateToken, authorizeRoles('admin', 'employee'), async (req, res) => {
  try {
    const invoices = await Invoice.find()
      .populate('client', 'name')
      .populate('items.product', 'name price');
    res.json(invoices);
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al obtener facturas', error: err.message });
  }
});

// Obtener factura por ID (admin y employee)
router.get('/:id', authenticateToken, authorizeRoles('admin', 'employee'), async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return res.status(400).json({ mensaje: 'ID de factura inválido' });
  }

  try {
    const invoice = await Invoice.findById(id)
      .populate('client', 'name')
      .populate('items.product', 'name price'); // <-- Aquí también
    if (!invoice) return res.status(404).json({ mensaje: 'Factura no encontrada' });
    res.json(invoice);
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al obtener factura', error: err.message });
  }
});

// Actualizar factura (solo admin)
router.put('/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  const { id } = req.params;
  const { client, items, total, invoiceNumber, dueDate, paid } = req.body;

  if (!isValidObjectId(id)) {
    return res.status(400).json({ mensaje: 'ID de factura inválido' });
  }

  if (!client || !items || !Array.isArray(items) || items.length === 0 || !total || !invoiceNumber || !dueDate) {
    return res.status(400).json({ mensaje: 'Todos los campos obligatorios deben ser proporcionados' });
  }

  if (!isValidObjectId(client)) {
    return res.status(400).json({ mensaje: 'ID de cliente inválido' });
  }

  for (const item of items) {
    if (
      !item.product || !isValidObjectId(item.product) ||
      typeof item.quantity !== 'number' || item.quantity <= 0 ||
      typeof item.price !== 'number' || item.price < 0
    ) {
      return res.status(400).json({ mensaje: 'Cada item debe tener producto válido, cantidad positiva y precio correcto' });
    }
  }

  try {
    const clientExists = await Client.findById(client);
    if (!clientExists) {
      return res.status(404).json({ mensaje: 'Cliente no encontrado' });
    }

    const duplicateInvoice = await Invoice.findOne({ invoiceNumber, _id: { $ne: id } });
    if (duplicateInvoice) {
      return res.status(409).json({ mensaje: 'Ya existe otra factura con ese número' });
    }

    const calculatedTotal = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    if (calculatedTotal !== total) {
      return res.status(400).json({ mensaje: 'El total no coincide con la suma de los items' });
    }

    const updateData = {
      client,
      items,
      total,
      invoiceNumber: invoiceNumber.trim(),
      dueDate,
    };

    if (typeof paid === 'boolean') {
      updateData.paid = paid;
    }

    const updatedInvoice = await Invoice.findByIdAndUpdate(id, updateData, { new: true });
    if (!updatedInvoice) return res.status(404).json({ mensaje: 'Factura no encontrada' });

    res.json({ mensaje: 'Factura actualizada', factura: updatedInvoice });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al actualizar factura', error: err.message });
  }
});

// Eliminar factura (solo admin)
router.delete('/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return res.status(400).json({ mensaje: 'ID de factura inválido' });
  }

  try {
    const deletedInvoice = await Invoice.findByIdAndDelete(id);
    if (!deletedInvoice) return res.status(404).json({ mensaje: 'Factura no encontrada' });
    res.json({ mensaje: 'Factura eliminada' });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al eliminar factura', error: err.message });
  }
});

module.exports = router;