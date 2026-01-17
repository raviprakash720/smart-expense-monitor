// Your Firebase config (v8 style)
var firebaseConfig = {
  apiKey: "AIzaSyCp6khvNMwVc-FFXXkOohpwIuhrsnajCz8",
  authDomain: "smart-expense-monitor.firebaseapp.com",
  projectId: "smart-expense-monitor",
  storageBucket: "smart-expense-monitor.firebasestorage.app",
  messagingSenderId: "346184697759",
  appId: "1:346184697759:web:3bc15da6679414c1549faa",
  measurementId: "G-L04XZM0NVB"
};

// Initialize Firebase
try {
    firebase.initializeApp(firebaseConfig);
    console.log('Firebase initialized successfully');
    
    // Make auth and db available globally
    window.auth = firebase.auth();
    window.db = firebase.firestore();
    
    // Enable offline persistence with fallback options
    function enableFirestorePersistence() {
        // Try with multi-tab sync first
        db.enablePersistence({ synchronizeTabs: true })
          .then(() => {
              console.log('Firestore persistence enabled with multi-tab sync');
          })
          .catch(function(err) {
              console.log("Multi-tab persistence failed:", err.code);
              
              // Try with force ownership if multi-tab fails
              if (err.code === 'failed-precondition') {
                  db.enablePersistence({ experimentalForceOwningTab: true })
                    .then(() => {
                        console.log('Firestore persistence enabled with force ownership');
                    })
                    .catch(function(forceErr) {
                        console.log("Force ownership persistence failed:", forceErr.code);
                        console.log("Offline persistence disabled - continuing with online mode only");
                    });
              } else {
                  console.log("Offline persistence disabled - continuing with online mode only");
              }
          });
    }
    
    // Call the persistence function
    enableFirestorePersistence();
      
} catch (error) {
    console.error('Firebase initialization error:', error);
    alert('Failed to initialize Firebase. Please check your configuration.');
}
