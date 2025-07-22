const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Payment = require('../models/payment');
const Invoice = require('../models/invoice');
const { authenticateToken, authorizeRoles } = require('../middlewares/auth');
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// Registrar pago (admin y employee)
router.post('/', authenticateToken, authorizeRoles('admin', 'employee'), async (req, res) => {
  try {
    const { invoice, amount, method, paymentDate, paymentNumber } = req.body;

    if (!invoice || !amount || !method || !paymentNumber) {
      return res.status(400).json({ mensaje: 'Todos los campos obligatorios deben ser proporcionados' });
    }

    if (!isValidObjectId(invoice)) {
      return res.status(400).json({ mensaje: 'ID de factura inválido' });
    }

    if (typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ mensaje: 'El monto debe ser un número positivo' });
    }

    if (!['efectivo', 'tarjeta', 'transferencia'].includes(method.trim())) {
      return res.status(400).json({ mensaje: 'Método de pago inválido' });
    }

    const invoiceExists = await Invoice.findById(invoice);
    if (!invoiceExists) {
      return res.status(404).json({ mensaje: 'Factura no encontrada' });
    }

    const existingPayment = await Payment.findOne({ paymentNumber: paymentNumber.trim() });
    if (existingPayment) {
      return res.status(409).json({ mensaje: 'Ya existe un pago con ese número' });
    }

    const payment = new Payment({
      invoice,
      amount,
      method: method.trim(),
      paymentDate: paymentDate ? new Date(paymentDate) : Date.now(),
      paymentNumber: paymentNumber.trim()
    });

    await payment.save();

    res.status(201).json({ mensaje: 'Pago registrado', pago: payment });

  } catch (err) {
    res.status(500).json({ mensaje: 'Error al registrar pago', error: err.message });
  }
});

// Obtener todos los pagos (admin y employee)
router.get('/', authenticateToken, authorizeRoles('admin', 'employee'), async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate('invoice', 'total dueDate paid')
      .sort({ createdAt: -1 });
    res.json(payments);
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al obtener pagos', error: err.message });
  }
});

// Obtener pago por ID (admin y employee)
router.get('/:id', authenticateToken, authorizeRoles('admin', 'employee'), async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ mensaje: 'ID de pago inválido' });
    }

    const payment = await Payment.findById(id).populate('invoice', 'total dueDate paid');
    if (!payment) {
      return res.status(404).json({ mensaje: 'Pago no encontrado' });
    }

    res.json(payment);

  } catch (err) {
    res.status(500).json({ mensaje: 'Error al obtener pago', error: err.message });
  }
});

// Actualizar pago (solo admin)
router.put('/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { invoice, amount, method, paymentDate, paymentNumber } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ mensaje: 'ID de pago inválido' });
    }

    if (!invoice || !amount || !method || !paymentNumber) {
      return res.status(400).json({ mensaje: 'Todos los campos obligatorios deben ser proporcionados' });
    }

    if (!isValidObjectId(invoice)) {
      return res.status(400).json({ mensaje: 'ID de factura inválido' });
    }

    if (typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ mensaje: 'El monto debe ser un número positivo' });
    }

    if (!['efectivo', 'tarjeta', 'transferencia'].includes(method.trim())) {
      return res.status(400).json({ mensaje: 'Método de pago inválido' });
    }

    const invoiceExists = await Invoice.findById(invoice);
    if (!invoiceExists) {
      return res.status(404).json({ mensaje: 'Factura no encontrada' });
    }

    const duplicatePayment = await Payment.findOne({ paymentNumber: paymentNumber.trim(), _id: { $ne: id } });
    if (duplicatePayment) {
      return res.status(409).json({ mensaje: 'Ya existe otro pago con ese número' });
    }

    const updatedPayment = await Payment.findByIdAndUpdate(
      id,
      {
        invoice,
        amount,
        method: method.trim(),
        paymentDate: paymentDate ? new Date(paymentDate) : Date.now(),
        paymentNumber: paymentNumber.trim()
      },
      { new: true }
    );

    if (!updatedPayment) {
      return res.status(404).json({ mensaje: 'Pago no encontrado' });
    }

    res.json({ mensaje: 'Pago actualizado', pago: updatedPayment });

  } catch (err) {
    res.status(500).json({ mensaje: 'Error al actualizar pago', error: err.message });
  }
});

// Eliminar pago (solo admin)
router.delete('/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ mensaje: 'ID de pago inválido' });
    }

    const deleted = await Payment.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ mensaje: 'Pago no encontrado' });
    }

    res.json({ mensaje: 'Pago eliminado' });

  } catch (err) {
    res.status(500).json({ mensaje: 'Error al eliminar pago', error: err.message });
  }
});

module.exports = router;