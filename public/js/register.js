const auth = firebase.auth();
const db = firebase.firestore();

document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const name = document.getElementById('name').value;
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const role = document.querySelector('input[name="role"]:checked').value; // e.g., from radio buttons

  firebase.auth().createUserWithEmailAndPassword(email, password)
    .then((userCredential) => {
      const user = userCredential.user;
      return firebase.firestore().collection("users").doc(user.uid).set({
        name: name,
        email: email,
        role: role, // <-- Make sure this is set correctly!
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
        // ...other fields...
    })
    .then(() => {
      // Redirect after registration based on role
      if (role === 'farmer') {
        window.location.href = 'farmer_dashboard.html';
      } else if (role === 'buyer') {
        window.location.href = 'buyer_dashboard.html';
      }
    })
    .catch((error) => {
      console.error("Registration error:", error);
      alert("Error creating account: " + error.message);
    });
});
});
