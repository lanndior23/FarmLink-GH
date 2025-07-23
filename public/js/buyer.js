// Firestore references
const db = firebase.firestore();
const auth = firebase.auth();

// Load Available Crops from Firestore
function loadAvailableCrops() {
  const cropGrid = document.getElementById("availableCrops");
  cropGrid.innerHTML = `<p>Loading crops...</p>`;

  db.collection("crops").get()
    .then(snapshot => {
      cropGrid.innerHTML = "";
      if (snapshot.empty) {
        cropGrid.innerHTML = `<p>No crops available right now.</p>`;
        return;
      }

      snapshot.forEach(doc => {
        const crop = doc.data();
        const cropCard = document.createElement("div");
        cropCard.className = "crop-card";
        cropCard.innerHTML = `
          <h4>${crop.name}</h4>
          <p>Price: GHS ${crop.price}</p>
          <p>Farmer: ${crop.farmerName}</p>
          <button onclick="orderCrop('${doc.id}', '${crop.farmerId}', '${crop.name}', ${crop.price})">Order</button>
        `;
        cropGrid.appendChild(cropCard);
      });
    })
    .catch(error => {
      cropGrid.innerHTML = `<p>Failed to load crops. Try again later.</p>`;
      console.error("Error loading crops:", error);
    });
}

// Order Crop (Placeholder Logic)
function orderCrop(cropId, farmerId, cropName, cropPrice) {
  const buyer = auth.currentUser;
  if (!buyer) return alert("Login required to order");

  const orderData = {
    cropId,
    cropName,
    cropPrice,
    buyerId: buyer.uid,
    buyerEmail: buyer.email,
    farmerId,
    status: "pending",
    timestamp: firebase.firestore.FieldValue.serverTimestamp()
  };

  db.collection("orders").add(orderData)
    .then(() => {
      alert(`Order placed for ${cropName}. You can now chat with the farmer.`);
      openChatWithFarmer(farmerId);
    })
    .catch(err => {
      console.error("Order failed", err);
      alert("Failed to place order. Try again.");
    });
}

// Open Chat Interface
function openChatWithFarmer(farmerId) {
  const buyerId = auth.currentUser.uid;
  const chatId = [buyerId, farmerId].sort().join("_");

  const chatBox = document.getElementById("chatBox");
  chatBox.style.display = "block";
  const chatWindow = document.getElementById("chatWindow");
  const chatInput = document.getElementById("chatInput");

  // Listen for real-time messages
  db.collection("chats").doc(chatId).collection("messages")
    .orderBy("timestamp")
    .onSnapshot(snapshot => {
      chatWindow.innerHTML = "";
      snapshot.forEach(doc => {
        const msg = doc.data();
        const bubble = document.createElement("div");
        bubble.className = msg.sender === buyerId ? "msg-bubble me" : "msg-bubble other";
        bubble.textContent = msg.text;
        chatWindow.appendChild(bubble);
      });
      chatWindow.scrollTop = chatWindow.scrollHeight;
    });

  // Send Message
  document.getElementById("sendBtn").onclick = () => {
    const text = chatInput.value.trim();
    if (!text) return;
    db.collection("chats").doc(chatId).collection("messages").add({
      sender: buyerId,
      text,
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
    chatInput.value = "";
  };
}

// Init on page load
window.addEventListener("DOMContentLoaded", () => {
  loadAvailableCrops();
});
