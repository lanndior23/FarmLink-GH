const auth = firebase.auth();
const db = firebase.firestore();

document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const name = document.getElementById('name').value;
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const role = document.querySelector('input[name="role"]:checked').value;

  try {
    // Create user in Firebase Auth
    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
    const user = userCredential.user;

    // Store additional user data in Firestore
    await db.collection('users').doc(user.uid).set({
      name: name,
      email: email,
      role: role,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    // Redirect after registration based on role
    if (role === 'farmer') {
      window.location.href = 'farmer_dashboard.html';
    } else if (role === 'buyer') {
      window.location.href = 'buyer_dashboard.html';
    }

  } catch (error) {
    console.error("Registration error:", error);
    alert("Error creating account: " + error.message);
  }
});
