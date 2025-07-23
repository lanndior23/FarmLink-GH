document.addEventListener('DOMContentLoaded', () => {
  loadWeather();
  loadCrops();

  const searchInput = document.getElementById('searchInput');
  searchInput.addEventListener('input', () => {
    const keyword = searchInput.value.toLowerCase();
    filterCrops(keyword);
});

let allCrops = [];

function loadCrops() {
  // Simulated crop data; replace with Firestore later
  allCrops = [
    { name: 'Tomatoes', region: 'Volta', price: 'GH₵100/basket' },
    { name: 'Cassava', region: 'Ashanti', price: 'GH₵60/sack' },
    { name: 'Plantain', region: 'Eastern', price: 'GH₵80/bunch' },
  ];
  displayCrops(allCrops);
}

function displayCrops(crops) {
  const cropList = document.getElementById('cropList');
  cropList.innerHTML = '';
  crops.forEach(crop => {
    cropList.innerHTML += `
      <div class="crop-card">
        <h3>${crop.name}</h3>
        <p><strong>Region:</strong> ${crop.region}</p>
        <p><strong>Price:</strong> ${crop.price}</p>
      </div>
    `;
  });
}

function filterCrops(keyword) {
  const filtered = allCrops.filter(crop =>
    crop.name.toLowerCase().includes(keyword) ||
    crop.region.toLowerCase().includes(keyword)
  );
  displayCrops(filtered);
}

function loadWeather() {
  const apiKey = "8ec390ef850bf6e41bf133f862f651c0"; // OpenWeather API key

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      position => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`)
          .then(res => res.json())
          .then(data => {
            const weatherDiv = document.getElementById('weather');
            weatherDiv.innerHTML = `
              <h4>🌤 Weather in ${data.name}</h4>
              <p>${data.weather[0].main}, ${data.main.temp}°C</p>
            `;
          })
          .catch(() => {
            document.getElementById('weather').innerHTML = 'Weather unavailable.';
          });
      },
      () => {
        // If location denied, fallback to Accra
        fetch(`https://api.openweathermap.org/data/2.5/weather?q=Accra&appid=${apiKey}&units=metric`)
          .then(res => res.json())
          .then(data => {
            const weatherDiv = document.getElementById('weather');
            weatherDiv.innerHTML = `
              <h4>🌤 Weather in ${data.name}</h4>
              <p>${data.weather[0].main}, ${data.main.temp}°C</p>
            `;
          })
          .catch(() => {
            document.getElementById('weather').innerHTML = 'Weather unavailable.';
          });
      }
    );
  } else {
    // If geolocation not supported, fallback to Accra
    fetch(`https://api.openweathermap.org/data/2.5/weather?q=Accra&appid=${apiKey}&units=metric`)
      .then(res => res.json())
      .then(data => {
        const weatherDiv = document.getElementById('weather');
        weatherDiv.innerHTML = `
          <h4>🌤 Weather in ${data.name}</h4>
          <p>${data.weather[0].main}, ${data.main.temp}°C</p>
        `;
      })
      .catch(() => {
        document.getElementById('weather').innerHTML = 'Weather unavailable.';
      });
  }
}

 // Load weather for default region on page load
  loadWeatherByCity(document.getElementById('regionSelect').value);

  // Change weather when region changes
  document.getElementById('regionSelect').addEventListener('change', function() {
    loadWeatherByCity(this.value);
  });
});

function loadWeatherByCity(city) {
  const apiKey = "8ec390ef850bf6e41bf133f862f651c0";
  fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`)
    .then(res => res.json())
    .then(data => {
      const weatherDiv = document.getElementById('weather');
      weatherDiv.innerHTML = `
        <h4>🌤 Weather in ${data.name}</h4>
        <p>${data.weather[0].main}, ${data.main.temp}°C</p>
      `;
    })
    .catch(() => {
      document.getElementById('weather').innerHTML = 'Weather unavailable.';
    });
}

// Firebase Login
const auth = firebase.auth();
const db = firebase.firestore();

const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
      const userCredential = await auth.signInWithEmailAndPassword(email, password);
      const user = userCredential.user;
      const userId = user.uid;

      // Get role from Firestore
      const userDoc = await db.collection('users').doc(userId).get();

      if (!userDoc.exists) {
        alert("User data not found in Firestore.");
        return;
      }

      const userData = userDoc.data();
      const role = userData.role;

      console.log("User logged in:", email);
      console.log("UID:", userId);
      console.log("Role from Firestore:", role);

      // REDIRECT BASED ON ROLE
      if (role === 'farmer') {
        window.location.href = 'farmer_dashboard.html';
      } else if (role === 'buyer') {
        window.location.href = 'buyer_dashboard.html';
      } else {
        alert("Role is not recognized. Contact admin.");
      }

    } catch (error) {
      console.error("Login error:", error);
      alert("Login failed: " + error.message);
    }
  });

  // Remove onAuthStateChanged redirect from login page to prevent refresh loop
}

// Only run dashboard auth logic on dashboard.html
if (window.location.pathname.endsWith('farmer_dashboard.html')) {
  // Firebase Auth State Handling
  firebase.auth().onAuthStateChanged(async user => {
    if (!user) {
      window.location.href = 'login.html';
      return;
    }

    try {
      const db = firebase.firestore();
      const userDoc = await db.collection('users').doc(user.uid).get();

      if (!userDoc.exists) {
        throw new Error("User data not found.");
      }

      const userData = userDoc.data();
      const role = userData.role;
      const name = userData.name || "User";

      document.getElementById('dashboardTitle').innerText = `Welcome, ${name} (${role})`;

      if (role === 'farmer') {
        document.getElementById('farmerSection').style.display = 'block';
        loadFarmerCrops(user.uid);

        document.getElementById('postCropForm').addEventListener('submit', async (e) => {
          e.preventDefault();
          await postCrop(user.uid);
        });

      } else if (role === 'buyer') {
        document.getElementById('buyerSection').style.display = 'block';
        loadAllCrops();
      }
    } catch (error) {
      console.error("Error loading dashboard:", error);
      alert("Failed to load dashboard. Try again.");
    }
  });
}

// 🔁 Post New Crop (Farmer Only)
async function postCrop(userId) {
  const name = document.getElementById('cropName').value;
  const region = document.getElementById('cropRegion').value;
  const price = document.getElementById('cropPrice').value;
  const availability = document.getElementById('cropAvailability').value;

  const cropData = {
    name,
    region,
    price,
    availability,
    userId,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  };

  try {
    await firebase.firestore().collection('crops').add(cropData);
    alert('Crop posted successfully!');
    loadFarmerCrops(userId);
    document.getElementById('postCropForm').reset();
  } catch (err) {
    console.error("Error posting crop:", err);
    alert("Failed to post crop.");
  }
}

// 📥 Load Crops for Farmer
async function loadFarmerCrops(userId) {
  const container = document.getElementById('farmerCrops');
  container.innerHTML = '';

  try {
    const snapshot = await firebase.firestore()
      .collection('crops')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();

    if (snapshot.empty) {
      container.innerHTML = '<p>No crops posted yet.</p>';
      return;
    }

    snapshot.forEach(doc => {
      const crop = doc.data();
      container.innerHTML += `
        <div class="crop-card">
          <h3>${crop.name}</h3>
          <p><strong>Region:</strong> ${crop.region}</p>
          <p><strong>Price:</strong> ${crop.price}</p>
          <p><strong>Status:</strong> ${crop.availability}</p>
          <button onclick="deleteCrop('${doc.id}')">🗑 Delete</button>
        </div>
      `;
    });
  } catch (err) {
    console.error("Error loading crops:", err);
    container.innerHTML = '<p>Failed to load crops.</p>';
  }
}

// 🌍 Load All Crops for Buyers
async function loadAllCrops() {
  const container = document.getElementById('allCrops');
  container.innerHTML = '';

  try {
    const snapshot = await firebase.firestore()
      .collection('crops')
      .orderBy('createdAt', 'desc')
      .get();

    if (snapshot.empty) {
      container.innerHTML = '<p>No crops available right now.</p>';
      return;
    }

    snapshot.forEach(doc => {
      const crop = doc.data();
      container.innerHTML += `
        <div class="crop-card">
          <h3>${crop.name}</h3>
          <p><strong>Region:</strong> ${crop.region}</p>
          <p><strong>Price:</strong> ${crop.price}</p>
          <p><strong>Status:</strong> ${crop.availability}</p>
        </div>
      `;
    });
  } catch (err) {
    console.error("Error loading crops:", err);
    container.innerHTML = '<p>Failed to load crops.</p>';
  }
}

// ❌ Delete Crop
async function deleteCrop(cropId) {
  if (!confirm("Are you sure you want to delete this crop?")) return;

  try {
    await firebase.firestore().collection('crops').doc(cropId).delete();
    alert("Crop deleted.");
    location.reload();
  } catch (err) {
    console.error("Error deleting crop:", err);
    alert("Failed to delete crop.");
  }
}

// 🚪 Logout Function
function logoutUser() {
  firebase.auth().signOut().then(() => {
    window.location.href = 'login.html';
  }).catch(error => {
    console.error("Logout error:", error);
    alert("Error logging out.");
  });
}

// 🔐 Replace with your actual OpenWeather API key
const weatherApiKey = "8ec390ef850bf6e41bf133f862f651c0";

// 🔍 Use browser's location or default to Accra, Ghana
function getWeather() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(position => {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;
      fetchWeather(lat, lon);
    }, () => {
      // If user denies location, fallback to Accra
      fetchWeather(5.6037, -0.1870);
    });
  } else {
    fetchWeather(5.6037, -0.1870); // Default to Accra
  }
}

function fetchWeather(lat, lon) {
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${weatherApiKey}`;

  fetch(url)
    .then(response => response.json())
    .then(data => {
      const weatherDiv = document.getElementById("weather");
      const temp = data.main.temp;
      const condition = data.weather[0].description;
      const location = data.name;

      weatherDiv.innerHTML = `
        <h3>🌦️ Weather Update</h3>
        <p><strong>Location:</strong> ${location}</p>
        <p><strong>Temperature:</strong> ${temp}°C</p>
        <p><strong>Condition:</strong> ${condition}</p>
      `;
    })
    .catch(error => {
      console.error("Error fetching weather:", error);
      document.getElementById("weather").innerHTML = "<p>Unable to load weather info.</p>";
    });
}

// Call it on page load
getWeather();
function fetchWeather(lat, lon) {
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${weatherApiKey}`;

  fetch(url)
    .then(response => response.json())
    .then(data => {
      const weatherDiv = document.getElementById("weather");
      const temp = data.main.temp;
      const condition = data.weather[0].description;
      const location = data.name;

      weatherDiv.innerHTML = `
        <h3>🌦️ Weather Update</h3>
        <p><strong>Location:</strong> ${location}</p>
        <p><strong>Temperature:</strong> ${temp}°C</p>
        <p><strong>Condition:</strong> ${condition}</p>
      `;
    })
    .catch(error => {
      console.error("Error fetching weather:", error);
      document.getElementById("weather").innerHTML = "<p>Unable to load weather info.</p>";
    });
}

// Call it on page load
getWeather();
