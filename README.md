🚀ERP - Backend

📌Descripción
Este proyecto es el backend de un sistema ERP (Enterprise Resource Planning) diseñado para ser flexible, adaptable y escalable, combinando funcionalidades de diferentes tipos de ERP para ajustarse a las necesidades de cualquier empresa.
El sistema proporciona una API robusta que gestiona los módulos principales de un ERP moderno: finanzas, inventario, ventas, compras, clientes, proveedores, recursos humanos y más.

Funcionalidades principales:
-Gestión de usuarios y roles con autenticación JWT.
-Módulo de finanzas: cuentas, transacciones, pagos e informes.
-Módulo de inventario: productos, categorías, almacenes y órdenes de compra/recepción.
-Módulo de ventas: facturas, cotizaciones y clientes.
-Módulo de recursos humanos: empleados, nómina y asistencia.
-Generación de reportes centralizados.
-Envío de notificaciones y correos electrónicos vía Gmail API.

🛠️Tecnologías utilizadas
-Node.js
-Express (Framework para APIs REST)
-MongoDB / Mongoose (Base de datos NoSQL y modelado de datos)
-JWT (Autenticación y autorización)
-bcryptjs (Encriptación de contraseñas)
-crypto (Generación de tokens y seguridad)
-dotenv (Manejo de variables de entorno)
-CORS (Control de acceso entre frontend y backend)
-Nodemailer & Google APIs (Envío de correos electrónicos)

⚙️Instalación y ejecución

1.-Clonar el repositorio:
git clone https://github.com/EdannyDev/backend-erp.git

2.-Instalar dependencias:
npm install

3.-Crear un archivo .env en la raíz del proyecto con las siguientes variables:
MONGO_URI=mongodb://localhost:27017/erpDB
PORT=5000
JWT_SECRET=<tu_secreto_jwt>
GMAIL_CLIENT_ID=<tu_client_id_google>
GMAIL_CLIENT_SECRET=<tu_client_secret_google>
GMAIL_REFRESH_TOKEN=<tu_refresh_token_google>
GMAIL_SENDER=<tu_email_gmail>

4.-Ejecutar el servidor:
npm start

5.-La API estará disponible en:
http://localhost:5000

✨Endpoints principales
Usuarios: /api/user
Finanzas: /api/account, /api/payment, /api/transaction
Inventario: /api/product, /api/category, /api/warehouse, /api/purchaseOrder, /api/receiving
Ventas: /api/invoice, /api/quote, /api/client
Recursos Humanos: /api/employee, /api/attendance, /api/payroll
Proveedores: /api/supplier
Configuración: /api/settings
Reportes: /api/report

🔗Enlaces útiles
Frontend: https://github.com/EdannyDev/erp-app.git
