const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Settings = require('../models/settings');
const { authenticateToken, authorizeRoles } = require('../middlewares/auth');

// Función para obtener o crear configuración
const getConfig = async () => {
  let config = await Settings.findOne();
  if (!config) {
    config = new Settings();
    await config.save();
  }
  return config;
};

// GET configuración general (admin)
router.get('/', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const config = await getConfig();
    res.json({ mensaje: 'Configuración obtenida', config });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al obtener configuración', error: err.message });
  }
});

// PUT actualizar configuración general (admin)
router.put('/', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const data = req.body;
    let config = await Settings.findOne();

    if (config) {
      Object.assign(config, data);
      await config.save();
      return res.json({ mensaje: 'Configuración actualizada', config });
    }

    const nueva = new Settings(data);
    await nueva.save();
    res.status(201).json({ mensaje: 'Configuración creada', config: nueva });

  } catch (err) {
    res.status(500).json({ mensaje: 'Error al guardar configuración', error: err.message });
  }
});

// PUT actualizar datos de empresa (admin)
router.put('/company', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  const { name, legalName, taxId, address, phone, email, website, logoUrl } = req.body;

  if (!name || !taxId) {
    return res.status(400).json({ mensaje: 'El nombre y taxId de la empresa son obligatorios' });
  }

  try {
    const config = await getConfig();
    config.company = { name, legalName, taxId, address, phone, email, website, logoUrl };
    await config.save();
    res.json({ mensaje: 'Datos de empresa actualizados', company: config.company });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al actualizar datos de empresa', error: err.message });
  }
});

// PUT actualizar moneda (admin)
router.put('/currency', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  const { code, symbol, decimalSeparator = '.', thousandSeparator = ',' } = req.body;

  if (!code || !symbol) {
    return res.status(400).json({ mensaje: 'Código y símbolo son obligatorios para la moneda' });
  }

  try {
    const config = await getConfig();
    config.currency = { code, symbol, decimalSeparator, thousandSeparator };
    await config.save();
    res.json({ mensaje: 'Moneda actualizada', currency: config.currency });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al actualizar moneda', error: err.message });
  }
});

// POST agregar impuesto (admin)
router.post('/taxes', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  const { name, rate, appliesTo = 'global' } = req.body;

  if (!name || rate == null || isNaN(rate) || rate < 0) {
    return res.status(400).json({ mensaje: 'Nombre y tasa válidos son obligatorios para el impuesto' });
  }

  try {
    const config = await getConfig();

    const duplicado = config.taxes.find(t => t.name.toLowerCase() === name.toLowerCase());
    if (duplicado) {
      return res.status(409).json({ mensaje: 'El impuesto ya existe' });
    }

    config.taxes.push({ name, rate, appliesTo });
    await config.save();
    res.status(201).json({ mensaje: 'Impuesto agregado', taxes: config.taxes });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al agregar impuesto', error: err.message });
  }
});

// DELETE eliminar impuesto por nombre (admin)
router.delete('/taxes/:name', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  const name = req.params.name;

  try {
    const config = await getConfig();
    const index = config.taxes.findIndex(t => t.name.toLowerCase() === name.toLowerCase());

    if (index === -1) {
      return res.status(404).json({ mensaje: 'Impuesto no encontrado' });
    }

    config.taxes.splice(index, 1);
    await config.save();
    res.json({ mensaje: 'Impuesto eliminado', taxes: config.taxes });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al eliminar impuesto', error: err.message });
  }
});

// PUT actualizar configuración de notificaciones (admin)
router.put('/notifications', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  const { emailEnabled, smtpHost, smtpPort, smtpUser, smtpPass } = req.body;

  try {
    const config = await getConfig();
    config.notifications = { emailEnabled, smtpHost, smtpPort, smtpUser, smtpPass };
    await config.save();
    res.json({ mensaje: 'Configuración de notificaciones actualizada' });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al actualizar notificaciones', error: err.message });
  }
});

module.exports = router;