const auth = firebase.auth();
const db = firebase.firestore();

const urlParams = new URLSearchParams(window.location.search);
const to = urlParams.get("to");  // This must exist

if (!to) {
  alert("❌ No chat user specified.");
  throw new Error("Chat target UID not specified.");
}

auth.onAuthStateChanged(async user => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  const from = user.uid;

  // Optionally show names
  const toUserDoc = await db.collection("users").doc(to).get();
  const toUser = toUserDoc.exists ? toUserDoc.data() : { fullName: "Unknown" };
  document.getElementById("chatHeader").textContent = `Chat with ${toUser.fullName}`;

  // Send message
  document.getElementById("sendMessage").addEventListener("click", () => {
    const messageInput = document.getElementById("messageInput");
    const text = messageInput.value.trim();

    if (text === "") return;

    db.collection("messages").add({
      from,
      to,
      text,
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });

    messageInput.value = "";
  });

  // Listen for messages
  db.collection("messages")
    .where("from", "in", [from, to])
    .where("to", "in", [from, to])
    .orderBy("timestamp")
    .onSnapshot(snapshot => {
      const chatBox = document.getElementById("chatBox");
      chatBox.innerHTML = "";

      snapshot.forEach(doc => {
        const msg = doc.data();
        const msgDiv = document.createElement("div");
        msgDiv.textContent = `${msg.from === from ? "You" : toUser.fullName}: ${msg.text}`;
        chatBox.appendChild(msgDiv);
      });

      chatBox.scrollTop = chatBox.scrollHeight;
    });
});
