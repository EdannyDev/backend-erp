const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const accountRoutes = require('./routes/account');
const attendanceRoutes = require('./routes/attendance');
const categoryRoutes = require('./routes/category');
const clientRoutes = require('./routes/client');
const employeeRoutes = require('./routes/employee');
const invoiceRoutes = require('./routes/invoice');
const paymentRoutes = require('./routes/payment');
const payrollRoutes = require('./routes/payroll');
const productRoutes = require('./routes/product');
const purchaseOrderRoutes = require('./routes/purchaseOrder');
const quoteRoutes = require('./routes/quote');
const receivingRoutes = require('./routes/receiving');
const settingsRoutes = require('./routes/settings');
const reportRoutes = require('./routes/report');
const supplierRoutes = require('./routes/supplier');
const transactionRoutes = require('./routes/transaction');
const userRoutes = require('./routes/user');
const warehouseRoutes = require('./routes/warehouse');

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// Conexión a MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Conexión a MongoDB exitosa'))
  .catch((err) => console.error('Error en la conexión de MongoDB:', err));

// Ruta inicial del servidor
app.get('/', async (req, res) => {
  res.json({ mensaje: 'Bienvenido al servidor backend del ERP' });
});

// Rutas API
app.use('/api/account', accountRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/category', categoryRoutes);
app.use('/api/client', clientRoutes);
app.use('/api/employee', employeeRoutes);
app.use('/api/invoice', invoiceRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/product', productRoutes);
app.use('/api/purchaseOrder', purchaseOrderRoutes);
app.use('/api/quote', quoteRoutes);
app.use('/api/receiving', receivingRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/report', reportRoutes);
app.use('/api/supplier', supplierRoutes);
app.use('/api/transaction', transactionRoutes);
app.use('/api/user', userRoutes);
app.use('/api/warehouse', warehouseRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Servidor corriendo en el puerto: ${PORT}`));