const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Product = require('../models/product');
const { authenticateToken, authorizeRoles } = require('../middlewares/auth');
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// Crear producto (solo admin)
router.post('/', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  const { name, description, price, category, stock, warehouse } = req.body;

  if (!name || !description || price == null || !category || stock == null || !warehouse) {
    return res.status(400).json({ mensaje: 'Todos los campos son obligatorios' });
  }

  try {
    const newProduct = new Product({
      name: name.trim(),
      description: description.trim(),
      price: parseFloat(price),
      category,
      stock: parseInt(stock),
      warehouse
    });

    await newProduct.save();
    res.status(201).json({ mensaje: 'Producto creado exitosamente', producto: newProduct });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al crear el producto', error: err.message });
  }
});

// Obtener todos los productos (admin y employee)
router.get('/', authenticateToken, authorizeRoles('admin', 'employee'), async (_req, res) => {
  try {
    const products = await Product.find()
      .populate('category', 'name')
      .populate('warehouse', 'name')
      .sort({ name: 1 });

    res.json(products);
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al obtener los productos', error: err.message });
  }
});

// Obtener un producto por ID (admin y employee)
router.get('/:id', authenticateToken, authorizeRoles('admin', 'employee'), async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return res.status(400).json({ mensaje: 'ID de producto no válido' });
  }

  try {
    const product = await Product.findById(id)
      .populate('category', 'name')
      .populate('warehouse', 'name');

    if (!product) {
      return res.status(404).json({ mensaje: 'Producto no encontrado' });
    }

    res.json(product);
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al obtener el producto', error: err.message });
  }
});

// Actualizar producto (solo admin)
router.put('/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  const { id } = req.params;
  const { name, description, price, category, stock, warehouse } = req.body;

  if (!isValidObjectId(id)) {
    return res.status(400).json({ mensaje: 'ID de producto no válido' });
  }

  if (!name || !description || price == null || !category || stock == null || !warehouse) {
    return res.status(400).json({ mensaje: 'Todos los campos son obligatorios' });
  }

  try {
    const updated = await Product.findByIdAndUpdate(
      id,
      {
        name: name.trim(),
        description: description.trim(),
        price: parseFloat(price),
        category,
        stock: parseInt(stock),
        warehouse
      },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ mensaje: 'Producto no encontrado' });
    }

    res.json({ mensaje: 'Producto actualizado', producto: updated });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al actualizar el producto', error: err.message });
  }
});

// Eliminar producto (solo admin)
router.delete('/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return res.status(400).json({ mensaje: 'ID de producto no válido' });
  }

  try {
    const deleted = await Product.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ mensaje: 'Producto no encontrado' });
    }

    res.json({ mensaje: 'Producto eliminado correctamente' });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al eliminar el producto', error: err.message });
  }
});

module.exports = router;