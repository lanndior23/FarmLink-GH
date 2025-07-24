const db = firebase.firestore();

firebase.auth().onAuthStateChanged(user => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  const userId = user.uid;

  const cropList = document.getElementById("cropList");

  // Fetch all available crops
  db.collection("crops").orderBy("timestamp", "desc").onSnapshot(snapshot => {
    cropList.innerHTML = "";
    snapshot.forEach(doc => {
      const crop = doc.data();
      const cropId = doc.id;

      const div = document.createElement("div");
      div.className = "crop-card";
      div.innerHTML = `
        <div style="display:flex; align-items:center;">
          ${crop.image ? `<img src="${crop.image}" alt="${crop.name}"/>` : ""}
          <div>
            <h3>${crop.name}</h3>
            <p>Region: ${crop.region}</p>
            <p>Price: ${crop.price}</p>
            <button class="order-btn" data-id="${cropId}" data-farmer="${crop.farmerId}" data-name="${crop.name}">Order</button>
          </div>
        </div>
      `;

      cropList.appendChild(div);
    });

    // Listen to all order buttons
    document.querySelectorAll(".order-btn").forEach(button => {
      button.addEventListener("click", e => {
        const cropId = e.target.dataset.id;
        const farmerId = e.target.dataset.farmer;
        const cropName = e.target.dataset.name;

        const confirmOrder = confirm(`Order 1 unit of ${cropName}?`);
        if (!confirmOrder) return;

        db.collection("orders").add({
          cropId,
          cropName,
          buyerId: userId,
          farmerId,
          timestamp: firebase.firestore.FieldValue.serverTimestamp()
        }).then(() => {
          alert("Order placed successfully!");
        }).catch(err => {
          console.error("Error placing order:", err);
          alert("Failed to place order.");
        });
      });
    });
  });
});
