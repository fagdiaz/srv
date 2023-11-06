exports.addOrder = async (req, res) => {

    const pedidosRef = db.collection('pedidos');
    const order = req.body.checkoutForm;
    try {
        const result = await pedidosRef.add(order);
        res.status(200).json({ res: "ok", id: result.id });
    } catch (error) {
        res.status(500).json({ res: "fail", err: error })
        console.log("Ocurrió un error", error)
    }
}

