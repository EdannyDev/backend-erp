const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Quote = require('../models/quote');
const Client = require('../models/client');
const { authenticateToken, authorizeRoles } = require('../middlewares/auth');
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// Crear cotización (admin y employee)
router.post('/', authenticateToken, authorizeRoles('admin', 'employee'), async (req, res) => {
  const { client, items, status } = req.body;

  if (!client || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ mensaje: 'Cliente e items son obligatorios y no deben estar vacíos' });
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

    const total = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    const sortedItems = [...items]
      .map(item => ({
        product: item.product.toString(),
        quantity: item.quantity,
        price: item.price,
      }))
      .sort((a, b) => a.product.localeCompare(b.product));

    const possibleDuplicates = await Quote.find({
      client,
      createdAt: { $gte: fiveMinutesAgo },
      total,
    });

    for (const duplicate of possibleDuplicates) {
      const dupItems = duplicate.items.map(item => ({
        product: item.product.toString(),
        quantity: item.quantity,
        price: item.price,
      })).sort((a, b) => a.product.localeCompare(b.product));

      const isDuplicate = JSON.stringify(dupItems) === JSON.stringify(sortedItems);
      if (isDuplicate) {
        return res.status(409).json({ mensaje: 'Ya existe una cotización reciente con los mismos datos' });
      }
    }

    const newQuote = new Quote({
      client,
      items,
      total,
      status: status || 'pendiente',
    });

    await newQuote.save();
    res.status(201).json({ mensaje: 'Cotización creada exitosamente', cotizacion: newQuote });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al crear cotización', error: err.message });
  }
});

// Listar cotizaciones (admin y employee)
router.get('/', authenticateToken, authorizeRoles('admin', 'employee'), async (req, res) => {
  try {
    const quotes = await Quote.find()
      .populate('client', 'name')
      .sort({ createdAt: -1 });
    res.json(quotes);
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al obtener cotizaciones', error: err.message });
  }
});

// Obtener cotización por ID (admin y employee)
router.get('/:id', authenticateToken, authorizeRoles('admin', 'employee'), async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return res.status(400).json({ mensaje: 'ID de cotización inválido' });
  }

  try {
    const quote = await Quote.findById(id)
      .populate('client', 'name')
      .populate('items.product', 'name price');
    if (!quote) return res.status(404).json({ mensaje: 'Cotización no encontrada' });
    res.json(quote);
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al obtener cotización', error: err.message });
  }
});

// Actualizar cotización (solo admin)
router.put('/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  const { id } = req.params;
  const { client, items, status } = req.body;

  if (!isValidObjectId(id)) {
    return res.status(400).json({ mensaje: 'ID de cotización inválido' });
  }

  if (client && !isValidObjectId(client)) {
    return res.status(400).json({ mensaje: 'ID de cliente inválido' });
  }

  if (items && (!Array.isArray(items) || items.length === 0)) {
    return res.status(400).json({ mensaje: 'La lista de items debe ser un arreglo no vacío' });
  }

  if (items) {
    for (const item of items) {
      if (
        !item.product || !isValidObjectId(item.product) ||
        typeof item.quantity !== 'number' || item.quantity <= 0 ||
        typeof item.price !== 'number' || item.price < 0
      ) {
        return res.status(400).json({ mensaje: 'Cada item debe tener producto válido, cantidad positiva y precio correcto' });
      }
    }
  }

  try {
    if (client) {
      const clientExists = await Client.findById(client);
      if (!clientExists) {
        return res.status(404).json({ mensaje: 'Cliente no encontrado' });
      }
    }

    if (client && items) {
      const total = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);

      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const possibleDuplicates = await Quote.find({
        _id: { $ne: id },
        client,
        createdAt: { $gte: fiveMinutesAgo },
        total,
      });

      for (const duplicate of possibleDuplicates) {
        const sortedDupItems = [...duplicate.items].sort((a, b) => a.product.toString().localeCompare(b.product.toString()));
        const sortedItems = [...items].sort((a, b) => a.product.toString().localeCompare(b.product.toString()));

        const sameItems = JSON.stringify(sortedDupItems) === JSON.stringify(sortedItems);

        if (sameItems) {
          return res.status(409).json({ mensaje: 'Ya existe una cotización reciente con los mismos datos' });
        }
      }
    }

    const updateData = {};
    if (client) updateData.client = client;
    if (items) {
      updateData.items = items;
      updateData.total = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    }
    if (status) updateData.status = status;

    const updated = await Quote.findByIdAndUpdate(id, updateData, { new: true });
    if (!updated) return res.status(404).json({ mensaje: 'Cotización no encontrada' });

    res.json({ mensaje: 'Cotización actualizada', cotizacion: updated });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al actualizar cotización', error: err.message });
  }
});

// Eliminar cotización (solo admin)
router.delete('/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return res.status(400).json({ mensaje: 'ID de cotización inválido' });
  }

  try {
    const deleted = await Quote.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ mensaje: 'Cotización no encontrada' });

    res.json({ mensaje: 'Cotización eliminada' });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al eliminar cotización', error: err.message });
  }
});

module.exports = router;