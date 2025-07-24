// firebase/config.js must already be initialized
const db = firebase.firestore();

// DOM Elements
const cropForm = document.getElementById("cropForm");
const cropsList = document.getElementById("cropsList");
const ordersList = document.getElementById("ordersList");
const chatDot = document.getElementById("chatDot");
const newMsgBadge = document.getElementById("newMsgBadge");

firebase.auth().onAuthStateChanged(user => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  const userId = user.uid;

  // 1️⃣ Handle Crop Upload
  cropForm.addEventListener("submit", e => {
    e.preventDefault();

    const name = cropForm.cropName.value.trim();
    const region = cropForm.region.value.trim();
    const price = cropForm.price.value.trim();
    const image = cropForm.cropImage.value.trim(); // optional image URL

    if (!name || !region || !price) {
      alert("Please fill in all required fields.");
      return;
    }

    db.collection("crops").add({
      name,
      region,
      price,
      image: image || null,
      farmerId: userId,
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
      cropForm.reset();
    });
  });

  // 2️⃣ Display Farmer’s Crops
  db.collection("crops").where("farmerId", "==", userId)
    .orderBy("timestamp", "desc")
    .onSnapshot(snapshot => {
      cropsList.innerHTML = "";
      if (snapshot.empty) {
        cropsList.innerHTML = "<p>No crops uploaded yet.</p>";
        return;
      }

      snapshot.forEach(doc => {
        const crop = doc.data();
        const div = document.createElement("div");
        div.className = "crop-item";
        div.innerHTML = `
          <strong>${crop.name}</strong> (${crop.region})<br>
          Price: ${crop.price}<br>
          ${crop.image ? `<img src="${crop.image}" alt="${crop.name}" width="100">` : ""}
        `;
        cropsList.appendChild(div);
      });
    });

  // 3️⃣ Show Orders Related to This Farmer's Crops
  db.collection("orders").where("farmerId", "==", userId)
    .orderBy("timestamp", "desc")
    .onSnapshot(snapshot => {
      ordersList.innerHTML = "";
      if (snapshot.empty) {
        ordersList.innerHTML = "<p>No orders received yet.</p>";
        return;
      }

      snapshot.forEach(doc => {
        const order = doc.data();
        const div = document.createElement("div");
        div.className = "order-item";
        div.innerHTML = `
          <strong>${order.cropName}</strong><br>
          Ordered by: ${order.buyerName || "Unknown"}<br>
          Date: ${new Date(order.timestamp?.toDate()).toLocaleString()}
        `;
        ordersList.appendChild(div);
      });
    });

  // 4️⃣ Real-Time Message Notification
  db.collection("messages")
    .where("to", "==", userId)
    .orderBy("timestamp", "desc")
    .onSnapshot(snapshot => {
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
      } else {
        newMsgBadge.style.display = "none";
        chatDot.style.display = "none";
      }
    });
});
