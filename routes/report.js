const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Account = require('../models/account');
const Transaction = require('../models/transaction');
const { authenticateToken, authorizeRoles } = require('../middlewares/auth');

// Balance General: activos, pasivos y capital
router.get('/balance-sheet', authenticateToken, authorizeRoles('admin', 'employee'), async (_req, res) => {
  try {
    const cuentas = await Account.find({ type: { $in: ['activo', 'pasivo', 'capital'] } });
    const transacciones = await Transaction.find().populate('lines.account');

    const saldos = {};

    cuentas.forEach((c) => {
      saldos[c._id.toString()] = 0;
    });

    transacciones.forEach((t) => {
      t.lines.forEach((l) => {
        const accId = l.account._id.toString();
        if (saldos.hasOwnProperty(accId)) {
          saldos[accId] += (l.debit || 0) - (l.credit || 0);
        }
      });
    });

    const resultado = {
      activo: [],
      pasivo: [],
      capital: [],
      totalActivo: 0,
      totalPasivo: 0,
      totalCapital: 0
    };

    cuentas.forEach((c) => {
      const saldo = saldos[c._id.toString()] || 0;
      resultado[c.type].push({
        id: c._id,
        code: c.code,
        name: c.name,
        saldo
      });
      resultado[`total${capitalize(c.type)}`] += saldo;
    });

    res.json(resultado);
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al generar balance general', error: err.message });
  }
});

// Estado de Resultados: ingresos, gastos y utilidad neta
router.get('/income-statement', authenticateToken, authorizeRoles('admin', 'employee'), async (_req, res) => {
  try {
    const cuentas = await Account.find({ type: { $in: ['ingreso', 'gasto'] } });
    const transacciones = await Transaction.find().populate('lines.account');

    const saldos = {};
    cuentas.forEach((c) => {
      saldos[c._id.toString()] = 0;
    });

    transacciones.forEach((t) => {
      t.lines.forEach((l) => {
        const accId = l.account._id.toString();
        if (saldos.hasOwnProperty(accId)) {
          const isIngreso = l.account.type === 'ingreso';
          const isGasto = l.account.type === 'gasto';

          if (isIngreso) saldos[accId] += (l.credit || 0) - (l.debit || 0);
          if (isGasto) saldos[accId] += (l.debit || 0) - (l.credit || 0);
        }
      });
    });

    const resultado = {
      ingreso: [],
      gasto: [],
      totalIngreso: 0,
      totalGasto: 0,
      utilidadNeta: 0
    };

    cuentas.forEach((c) => {
      const saldo = saldos[c._id.toString()] || 0;
      resultado[c.type].push({
        id: c._id,
        code: c.code,
        name: c.name,
        saldo
      });
      resultado[`total${capitalize(c.type)}`] += saldo;
    });

    resultado.utilidadNeta = resultado.totalIngreso - resultado.totalGasto;

    res.json(resultado);
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al generar estado de resultados', error: err.message });
  }
});

// Función auxiliar
function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

module.exports = router;