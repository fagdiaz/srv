const express = require('express');
const cors = require('cors');

const { productos, addProduct } = require('./model/productos');
const { usuarios, addUser, obtenerUsuario, googleLogin } = require('./model/usuarios');
const { addOrder, updateOrder, getOrders } = require('./model/pedidos');
const { addMessage, getMessages, getConversationsRoute } = require('./model/chat');

// Initialize Firebase
const app = express();
app.use(cors({
  allowedHeaders: '*',
  origin: '*',
  methods: ['GET', 'POST']
}));
app.use(express.json());

app.post('/signup', addUser);
app.get('/usuarios', usuarios);
app.get('/obtenerUsuario', obtenerUsuario);
app.post('/google-login', googleLogin);

app.post('/productos', addProduct);
app.get('/productos', productos);

app.post('/chat', addMessage);
app.get('/chat', getMessages);
app.get('/chat/conversaciones', getConversationsRoute);

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
