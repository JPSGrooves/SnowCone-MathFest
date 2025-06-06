// Only run this when Vite env is available
if (import.meta.env && import.meta.env.VITE_SECRET_KEY) {
  console.log("🔐 VITE_SECRET_KEY:", import.meta.env.VITE_SECRET_KEY);
} else {
  console.log("🚨 No VITE_SECRET_KEY found. Is .env missing?");
}

// Basic DOM just to make sure it's alive
document.body.innerHTML += "<p>✅ JavaScript loaded!</p>";
