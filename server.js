const express = require('express');
const cors = require('cors');

//var app = express();

const { productos , addProduct} = require('./model/productos')
const { usuarios, addUser } = require('./model/usuarios')



// Initialize Firebase
const app = express()
app.use(cors({
  allowedHeaders: '*',
  origin: '*',
  methods:['GET', 'POST']
}));
app.use(express.json());

app.post('/signup', addUser)
app.get('/usuarios', usuarios)


app.post('/productos', addProduct)
app.get('/productos', productos)



app.post('/signin', (req, res) => {
    const { email, password } = req.body;
  
    // Aquí debes agregar la lógica para validar el correo electrónico y la contraseña
    // y generar el token si son válidos
  
    // Ejemplo de generación de un token JWT usando el paquete 'jsonwebtoken'
    const jwt = require('jsonwebtoken');
    const secretKey = 'mi_clave_secreta';
  
    if (email === 'usuario@example.com' && password === 'password') {
      const token = jwt.sign({ email }, secretKey);
      res.json({ token });
    } else {
      res.status(401).json({ error: 'Credenciales inválidas' });
    }
});

  
app.get('/', (req, res) => {
  res.json("hola");
});

app.listen(3000, () => {
  console.log('Servidor Node.js iniciado en el puerto 3000');
});