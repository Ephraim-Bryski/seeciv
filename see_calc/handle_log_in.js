

CURRENT_USER = null


var firebase_log_in = firebase


const fb_config_log_in = {
  apiKey: "AIzaSyDUuFHtA_-CFs90xbX-Z1Ros3QGwegFvcg",
  authDomain: "test-7af03.firebaseapp.com",
  databaseURL: "https://test-7af03-default-rtdb.firebaseio.com",
  projectId: "test-7af03",
  storageBucket: "test-7af03.appspot.com",
  messagingSenderId: "772660129335",
  appId: "1:772660129335:web:79af91672aff96686159b2",
  measurementId: "G-D312DPNMBZ"
};

  // Initialize Firebase
firebase_log_in.initializeApp(fb_config_log_in);



// Check if the user is already logged in on page load
firebase_log_in.auth().onAuthStateChanged(function(user) {
	if (user) {
		// User is signed in
		// screw it, what's the chance two people will have the same email with different domains
		// it would be weird to show people's full email address in the url	
		CURRENT_USER = user.email.split("@")[0]

		$("#sign-in")[0].style.display = "none"
		$("#save-field")[0].style.display = ""
		$("#save-button")[0].style.display = ""
		$("#sign-out")[0].style.display = ""
		console.log("IN :D")
		console.log(user.email);

		// Do something with the logged-in user, e.g., display user info
	} else {
		CURRENT_USER = null
		// $("#sign-out")[0].style.display = "none"
		$("#sign-in")[0].style.display = ""
		// just temporary so i can save stuff without logging in
		// $("#save-field")[0].style.display = "none"
		// $("#save-button")[0].style.display = "none"
		// No user is signed in
		console.log("User is not logged in");
	}


	if (firebase_data){
		update_library()
	}

});



// Sign out the current user
function signOutUser() {
	firebase_log_in.auth().signOut().then(function() {
		// Sign-out successful.
		console.log("User signed out");
		// Perform any additional actions after sign-out if needed
	}).catch(function(error) {
		// An error happened.
	console.error(error);
	});
}



// Sign in with Google
function signInWithGoogle() {

	var provider = new firebase_log_in.auth.GoogleAuthProvider();
	firebase_log_in.auth().signInWithPopup(provider).then(function(result) {
		// User signed in successfully
		var user = result.user;
		console.log(user.email);

	}).catch(function(error) {
		// Handle errors
		console.error(error);
	});


}



// Add a button in your HTML to trigger the sign-in
