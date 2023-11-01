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

exports.addUser = async (req,res) => {
    const usuariosRef = db.collection('usuarios');
    const user = req.body.user;
    try {
        usuariosRef.doc("123").set(user); 
        res.status()       
    } catch (error) {
        console.log("ocurrio un error", error)
    }


}