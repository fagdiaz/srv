const { db } = require("../util/admin");

exports.usuarios = async (req, res) => {
    const usuariosRef = db.collection('usuarios');
    try{
            usuariosRef.get().then((snapshot) => {
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

exports.addUser = async (req, res) => {
    const usuariosRef = db.collection('usuarios');
    const user = req.body.user;
    const uid = req.body.uid;
    //rol usuario // rol admin

    


    user.rol = "admin";

    try {
        usuariosRef.doc(uid).set(user); 
        res.status(200).json({ res: "ok", err: "" });
    } catch (error) {
        res.status(500).json({ res: "fail", err: error });
        console.log("Ocurrió un error", error);
    }
}

exports.obtenerUsuario = async (req, res) => {
   // const uid = req.body.uid;
    console.log("llego")
    //console.log("UID", uid)
    return res.json({res:"ok"})
}