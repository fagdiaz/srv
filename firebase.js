{/*
const firebaseConfig = {
  apiKey: "AIzaSyBS2iLJtZUjdcSc-qGbhvyQtWMR4Drb_xQ",
  authDomain: "api-superprof.firebaseapp.com",
  projectId: "api-superprof",
  storageBucket: "api-superprof.appspot.com",
  messagingSenderId: "550232318202",
  appId: "1:550232318202:web:7d87f3f772e367ab182943",
  measurementId: "G-H4KM3ZCY1H"
};*/}
const firebaseConfig = {

  apiKey: "AIzaSyC9uk6RPuERTLj9HCXUToCOmhIfjkqS3ok",

  authDomain: "rusticoslanus-84470.firebaseapp.com",

  projectId: "rusticoslanus-84470",

  storageBucket: "rusticoslanus-84470.appspot.com",

  messagingSenderId: "261854181198",

  appId: "1:261854181198:web:4a0405bf75420df955901f"

};


firebase.initializeApp(firebaseConfig); //initialize firebase app 

module.exports = { firebase }; //export the app