const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Transaction = require('../models/transaction');
const Account = require('../models/account');
const { authenticateToken, authorizeRoles } = require('../middlewares/auth');
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// Crear transacción contable (solo admin)
router.post('/', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  const { date, description, lines } = req.body;

  if (!description?.trim() || !Array.isArray(lines) || lines.length < 2) {
    return res.status(400).json({
      mensaje: 'La descripción y al menos dos líneas contables son requeridas.',
    });
  }

  let totalDebit = 0;
  let totalCredit = 0;

  try {
    for (const [index, line] of lines.entries()) {
      const { account, debit = 0, credit = 0 } = line;

      if (!isValidObjectId(account)) {
        return res.status(400).json({ mensaje: `ID de cuenta no válido en la línea ${index + 1}` });
      }

      const accountExists = await Account.findById(account);
      if (!accountExists) {
        return res.status(404).json({ mensaje: `Cuenta no encontrada en la línea ${index + 1}` });
      }

      if ((debit > 0 && credit > 0) || (debit === 0 && credit === 0)) {
        return res.status(400).json({
          mensaje: `Cada línea debe tener un valor en débito o crédito, pero no ambos. Error en línea ${index + 1}`,
        });
      }

      totalDebit += debit;
      totalCredit += credit;
    }

    if (totalDebit !== totalCredit) {
      return res.status(400).json({
        mensaje: `La transacción no está cuadrada. Débitos: ${totalDebit}, Créditos: ${totalCredit}`,
      });
    }

    const transaction = new Transaction({
      date: date || new Date(),
      description: description.trim(),
      lines,
      createdBy: req.user.id,
    });

    await transaction.save();

    res.status(201).json({
      mensaje: 'Transacción registrada exitosamente.',
      transaccion: transaction,
    });
  } catch (err) {
    res.status(500).json({
      mensaje: 'Error al registrar la transacción.',
      error: err.message,
    });
  }
});

// Obtener todas las transacciones (admin y empleados)
router.get('/', authenticateToken, authorizeRoles('admin', 'employee'), async (_req, res) => {
  try {
    const transacciones = await Transaction.find().populate('lines.account createdBy');
    res.json(transacciones);
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al obtener transacciones', error: err.message });
  }
});

// Obtener transacción por ID
router.get('/:id', authenticateToken, authorizeRoles('admin', 'employee'), async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return res.status(400).json({ mensaje: 'ID de transacción no válido' });
  }

  try {
    const transaccion = await Transaction.findById(id).populate('lines.account createdBy');

    if (!transaccion) {
      return res.status(404).json({ mensaje: 'Transacción no encontrada' });
    }

    res.json(transaccion);
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al obtener la transacción', error: err.message });
  }
});

// Eliminar transacción (opcional, solo admin)
router.delete('/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return res.status(400).json({ mensaje: 'ID de transacción no válido' });
  }

  try {
    const eliminado = await Transaction.findByIdAndDelete(id);
    if (!eliminado) {
      return res.status(404).json({ mensaje: 'Transacción no encontrada' });
    }

    res.json({ mensaje: 'Transacción eliminada correctamente' });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al eliminar transacción', error: err.message });
  }
});

module.exports = router;