
const firebaseConfig = {
  apiKey: "AIzaSyBS2iLJtZUjdcSc-qGbhvyQtWMR4Drb_xQ",
  authDomain: "api-superprof.firebaseapp.com",
  projectId: "api-superprof",
  storageBucket: "api-superprof.appspot.com",
  messagingSenderId: "550232318202",
  appId: "1:550232318202:web:7d87f3f772e367ab182943",
  measurementId: "G-H4KM3ZCY1H"
};

firebase.initializeApp(firebaseConfig); //initialize firebase app 

module.exports = { firebase }; //export the app