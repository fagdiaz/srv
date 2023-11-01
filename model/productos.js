const { db } = require("../util/admin");

exports.productos = async (req, res) => {
    const productosRef = db.collection('productos');
    try{
            productosRef.get().then((snapshot) => {
            const data = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));
            console.log(data);
            return res.status(201).json(data);
        })
    } catch (error) {
        return res
        .status(500)
        .json({ general: "Something went wrong, please try again"});          
    }
};

exports.addProduct = async (req, res) => {
    const productosRef = db.collection('productos');
    const product = req.body.product;
    try {
        const result = await productosRef.add(product);
        res.status(200).json({ res: "ok", id: result.id });
    } catch (error) {
        res.status(500).json({ res: "fail", err: error })
        console.log("Ocurrió un error", error)
    }
}