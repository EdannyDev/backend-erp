const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Category = require('../models/category');
const { authenticateToken, authorizeRoles } = require('../middlewares/auth');
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// Crear categoría (solo admin)
router.post('/', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  const { name, description } = req.body;

  if (!name || !description) {
    return res.status(400).json({ mensaje: 'Nombre y descripción son requeridos' });
  }

  try {
    const exists = await Category.findOne({ name: name.trim() });
    if (exists) {
      return res.status(409).json({ mensaje: 'Ya existe una categoría con ese nombre' });
    }

    const newCategory = new Category({
      name: name.trim(),
      description: description.trim(),
    });

    await newCategory.save();
    res.status(201).json({ mensaje: 'Categoría creada exitosamente', categoria: newCategory });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al crear la categoría', error: err.message });
  }
});

// Listar todas (admin y employee)
router.get('/', authenticateToken, authorizeRoles('admin', 'employee'), async (req, res) => {
  try {
    const categories = await Category.find();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al obtener las categorías', error: err.message });
  }
});

// Obtener una por ID (admin y employee)
router.get('/:id', authenticateToken, authorizeRoles('admin', 'employee'), async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    return res.status(400).json({ mensaje: 'ID de categoría inválido' });
  }

  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ mensaje: 'Categoría no encontrada' });

    res.json(category);
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al obtener la categoría', error: err.message });
  }
});

// Actualizar categoría (solo admin)
router.put('/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  const { name, description } = req.body;

  if (!isValidObjectId(req.params.id)) {
    return res.status(400).json({ mensaje: 'ID de categoría inválido' });
  }

  if (!name || !description) {
    return res.status(400).json({ mensaje: 'Nombre y descripción son requeridos' });
  }

  try {
    const duplicate = await Category.findOne({
      name: name.trim(),
      _id: { $ne: req.params.id },
    });

    if (duplicate) {
      return res.status(409).json({ mensaje: 'Ya existe otra categoría con ese nombre' });
    }

    const updated = await Category.findByIdAndUpdate(
      req.params.id,
      {
        name: name.trim(),
        description: description.trim(),
      },
      { new: true, runValidators: true }
    );

    if (!updated) return res.status(404).json({ mensaje: 'Categoría no encontrada' });

    res.json({ mensaje: 'Categoría actualizada exitosamente', categoria: updated });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al actualizar la categoría', error: err.message });
  }
});

// Eliminar categoría (solo admin)
router.delete('/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    return res.status(400).json({ mensaje: 'ID de categoría inválido' });
  }

  try {
    const deleted = await Category.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ mensaje: 'Categoría no encontrada' });

    res.json({ mensaje: 'Categoría eliminada exitosamente' });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al eliminar la categoría', error: err.message });
  }
});

module.exports = router;