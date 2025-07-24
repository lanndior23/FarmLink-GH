// Initialize Firebase (make sure firebase.initializeApp(...) is already done in firebase/config.js)
const auth = firebase.auth();
const db = firebase.firestore();

// On Auth State Change
auth.onAuthStateChanged(async user => {
  if (user) {
    const userId = user.uid;

    // Fetch user role
    const userDoc = await db.collection("users").doc(userId).get();
    const userData = userDoc.data();

    // Redirect if not a buyer
    if (userData.role !== "buyer") {
      alert("Unauthorized access – Only buyers can access this page.");
      return window.location.href = "login.html";
    }

    // Display buyer name
    document.getElementById("welcomeBuyer").textContent = `Welcome, ${userData.fullName}`;

    // Load Crops
    loadCrops();

    // Real-time message notifications
    const messagesCount = document.getElementById("messagesCount");
    const newMsgBadge = document.getElementById("newMsgBadge");
    const chatDot = document.getElementById("chatDot");

    db.collection("messages")
      .where("to", "==", userId)
      .orderBy("timestamp", "desc")
      .onSnapshot(snapshot => {
        messagesCount.textContent = snapshot.size;

        if (!snapshot.empty) {
          const latestMsg = snapshot.docs[0];
          const latestMsgId = latestMsg.id;
          const lastSeenId = localStorage.getItem("lastSeenMessageId");

          if (latestMsgId !== lastSeenId) {
            newMsgBadge.style.display = "inline-block";
            chatDot.style.display = "inline";
          } else {
            newMsgBadge.style.display = "none";
            chatDot.style.display = "none";
          }
        }
      });

  } else {
    // If not logged in
    window.location.href = "login.html";
  }
});

// Load crops from Firestore
function loadCrops() {
  const cropList = document.getElementById("cropList");
  cropList.innerHTML = "<p>Loading crops...</p>";

  db.collection("crops").orderBy("timestamp", "desc").get()
    .then(snapshot => {
      cropList.innerHTML = "";

      if (snapshot.empty) {
        cropList.innerHTML = "<p>No crops available at the moment.</p>";
        return;
      }

      snapshot.forEach(doc => {
        const crop = doc.data();

        const cropCard = document.createElement("div");
        cropCard.className = "crop-card";
        cropCard.innerHTML = `
          <img src="${crop.image || 'assets/default_crop.jpg'}" alt="${crop.name}" class="crop-img"/>
          <h3>${crop.name}</h3>
          <p>Region: ${crop.region}</p>
          <p>Price: ${crop.price}</p>
          <button onclick="orderCrop('${doc.id}')">Place Order</button>
        `;

        cropList.appendChild(cropCard);
      });
    })
    .catch(error => {
      console.error("Error loading crops:", error);
      cropList.innerHTML = "<p>Error loading crops. Please try again.</p>";
    });
}

// Handle order click
function orderCrop(cropId) {
  // Redirect to order page or show modal
  window.location.href = `order.html?crop=${cropId}`;
}
