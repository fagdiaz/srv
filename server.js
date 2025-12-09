const express = require('express');
const cors = require('cors');

const {
  productos,
  getProducts,
  addProduct,
  updateProduct,
  softDeleteProduct,
} = require('./model/productos');
const { usuarios, addUser, obtenerUsuario, googleLogin } = require('./model/usuarios');
const { addOrder, updateOrder, getOrders } = require('./model/pedidos');
const { addMessage, getMessages, getConversationsRoute, getUnreadRoute } = require('./model/chat');
const adminUsersRouter = require('./routes/adminUsers');


// Initialize Firebase
const app = express();
app.use(cors({
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization'
  ],
  credentials: true
}));
app.options('*', cors());
app.use(express.json());

app.post('/signup', addUser);
app.get('/usuarios', usuarios);
app.get('/obtenerUsuario', obtenerUsuario);
app.post('/google-login', googleLogin);

app.post('/productos', addProduct);
app.get('/productos', productos);
app.get('/products', getProducts);
app.put('/products/:id', updateProduct);
app.delete('/products/:id', softDeleteProduct);
// Rutas POST para compatibilidad/uso actual de FE
app.post('/products/update', updateProduct);
app.post('/products/soft-delete', softDeleteProduct);

app.post('/chat', addMessage);
app.get('/chat', getMessages);
app.get('/chat/conversaciones', getConversationsRoute);
app.get('/chat/unread', getUnreadRoute);

app.use(adminUsersRouter);


app.post('/addOrder', addOrder);
app.post('/updateOrder', updateOrder);
app.get('/orders', getOrders); // ?'^ nueva ruta

app.post('/signin', (req, res) => {
  const { email, password } = req.body;

  const jwt = require('jsonwebtoken');
  const secretKey = 'mi_clave_secreta';

  if (email === 'usuario@example.com' && password === 'password') {
    const token = jwt.sign({ email }, secretKey);
    res.json({ token });
  } else {
    res.status(401).json({ error: 'Credenciales inv\x81lidas' });
  }
});

app.get('/', (req, res) => {
  res.json('hola');
});

app.listen(3000, () => {
  console.log('Servidor Node.js iniciado en el puerto 3000');
});
