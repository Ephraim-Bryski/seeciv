// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBrjMcMVh5Qe4i1wI28Hu6cWtlBLn-1Fpc",
  authDomain: "see-calc-8d690.firebaseapp.com",
  databaseURL: "https://see-calc-8d690-default-rtdb.firebaseio.com",
  projectId: "see-calc-8d690",
  storageBucket: "see-calc-8d690.appspot.com",
  messagingSenderId: "712428414817",
  appId: "1:712428414817:web:13ebddba5db433e5960720",
  measurementId: "G-GP5ZDNCTXX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);




var ui = new firebaseui.auth.AuthUI(firebase.auth());

ui.start('#firebaseui-auth-container', {
signInOptions: [
// List of OAuth providers supported.
firebase.auth.GoogleAuthProvider.PROVIDER_ID,
firebase.auth.FacebookAuthProvider.PROVIDER_ID,
firebase.auth.TwitterAuthProvider.PROVIDER_ID,
firebase.auth.GithubAuthProvider.PROVIDER_ID
],
// Other config options...
});
console.log("HI")