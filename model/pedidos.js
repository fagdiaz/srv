const { db } = require("../util/admin");

exports.addOrder = async (req, res) => {

    const pedidosRef = db.collection('pedidos');
    const order = req.body.checkoutForm;
    const carrito = req.body.carrito;
    const uid = req.body.uid;

    order.carrito = carrito;
    order.uid = uid;
    order.status = 'creado';
    
    try {
        const result = await pedidosRef.add(order);
        res.status(200).json({ res: "ok", id: result.id });
    } catch (error) {
        res.status(500).json({ res: "fail", err: error })
        console.log("Ocurrió un error", error)
    }
}

exports.updateOrder = async(req, res) => {
    const idPedido = req.body.idPedido;
    const status = req.body.status;

        //buscar el pedido
        //const pedidosRef = db.collection('pedidos');
        const pedidosRef = db.collection("pedidos")

        const queryRef = pedidosRef.where('uid', '==', idPedido);
        const pedido = (await queryRef.get()).docs[0].data()
        const pedidoId = (await queryRef.get()).docs[0].id
        console.log("pedido", pedidoId)
        pedido.status = status
        console.log("pedido detalle", pedido)
        

        // Set the 'capital' field of the city
        const respuesta = pedidosRef.doc(pedidoId)
        const resp = await respuesta.update({status:status});
        res.status(201).json({res:resp})
        

       }
      


