// Global error handler
window.addEventListener('error', function(event) {
    console.error('Global JavaScript error:', event.error);
});

// DOM Elements
const loginSection = document.getElementById('loginSection');
const signupSection = document.getElementById('signupSection');
const uploadBillSection = document.getElementById('uploadBillSection');
const dashboardSection = document.getElementById('dashboardSection');
const addExpenseSection = document.getElementById('addExpenseSection');
const bottomNav = document.getElementById('bottomNav');

const avatarBtn = document.getElementById('avatarBtn');
const profileDropdown = document.getElementById('profileDropdown');

const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const expenseForm = document.getElementById('expenseForm');

const expensesList = document.getElementById('expensesList');
const totalSpentEl = document.getElementById('totalSpent');
const foodTotalEl = document.getElementById('foodTotal');
const travelTotalEl = document.getElementById('travelTotal');
const utilitiesTotalEl = document.getElementById('utilitiesTotal');
const othersTotalEl = document.getElementById('othersTotal');

const aiInsightsBtn = document.getElementById('aiInsightsBtn');
const aiInsightsContainer = document.getElementById('aiInsights');

const uploadArea = document.getElementById('uploadArea');
const billInput = document.getElementById('billInput');
const imagePreview = document.getElementById('imagePreview');
const previewImage = document.getElementById('previewImage');

const userEmailEl = document.getElementById('userEmail');
const userIdEl = document.getElementById('userId');
const logoutBtn = document.getElementById('logoutBtn');

const navItems = document.querySelectorAll('.nav-item');

// Global variables
let currentUser = null;
let unsubscribeFromExpenses = null;

// --- Auth Handling ---

firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        currentUser = user;
        showApp();
        loadExpenses();
        updateProfile();
    } else {
        currentUser = null;
        showAuth();
        if (unsubscribeFromExpenses) unsubscribeFromExpenses();
    }
});

function showAuth() {
    loginSection.classList.remove('hidden');
    loginSection.classList.add('active');
    signupSection.classList.add('hidden');
    uploadBillSection.classList.add('hidden');
    dashboardSection.classList.add('hidden');
    addExpenseSection.classList.add('hidden');
    bottomNav.classList.add('hidden');
    document.querySelector('.header').classList.add('hidden');
}

function showApp() {
    loginSection.classList.add('hidden');
    signupSection.classList.add('hidden');
    bottomNav.classList.remove('hidden');
    document.querySelector('.header').classList.remove('hidden');
    showSection('dashboardSection');
}

function updateProfile() {
    if (currentUser) {
        userEmailEl.textContent = currentUser.email;
        userIdEl.textContent = currentUser.uid;
    }
}

// Profile Dropdown Toggle
avatarBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    profileDropdown.classList.toggle('active');
});

document.addEventListener('click', () => {
    profileDropdown.classList.remove('active');
});

profileDropdown.addEventListener('click', (e) => {
    e.stopPropagation();
});

// --- Navigation ---

function showSection(sectionId) {
    const sections = [uploadBillSection, dashboardSection, addExpenseSection];
    sections.forEach(sec => {
        sec.classList.remove('active');
        sec.classList.add('hidden');
    });

    const activeSection = document.getElementById(sectionId);
    if (activeSection) {
        activeSection.classList.remove('hidden');
        activeSection.classList.add('active');
    }

    navItems.forEach(item => {
        if (item.getAttribute('data-section') === sectionId) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    if (sectionId === 'dashboardSection') {
        loadExpenses(); 
    }
}

navItems.forEach(item => {
    item.addEventListener('click', () => {
        showSection(item.getAttribute('data-section'));
    });
});

// Auth form switching
document.getElementById('showSignup').addEventListener('click', (e) => {
    e.preventDefault();
    loginSection.classList.add('hidden');
    signupSection.classList.remove('hidden');
    signupSection.classList.add('active');
});

document.getElementById('showLogin').addEventListener('click', (e) => {
    e.preventDefault();
    signupSection.classList.add('hidden');
    loginSection.classList.remove('hidden');
    loginSection.classList.add('active');
});

// --- Firebase Operations ---

loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const pass = document.getElementById('loginPassword').value;
    firebase.auth().signInWithEmailAndPassword(email, pass)
        .catch(err => alert(err.message));
});

signupForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('signupEmail').value;
    const pass = document.getElementById('signupPassword').value;
    firebase.auth().createUserWithEmailAndPassword(email, pass)
        .catch(err => alert(err.message));
});

logoutBtn.addEventListener('click', () => {
    firebase.auth().signOut()
        .then(() => {
            profileDropdown.classList.remove('active');
        })
        .catch(err => alert(err.message));
});

// --- Expense Management ---

expenseForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!currentUser) return;

    const expense = {
        amount: parseFloat(document.getElementById('amount').value),
        description: document.getElementById('description').value,
        date: document.getElementById('date').value,
        category: document.getElementById('category').value,
        userId: currentUser.uid,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    firebase.firestore().collection('expenses').add(expense)
        .then(() => {
            expenseForm.reset();
            document.getElementById('date').valueAsDate = new Date();
            alert('Expense added!');
        })
        .catch(err => alert(err.message));
});

function loadExpenses() {
    if (!currentUser) return;

    if (unsubscribeFromExpenses) unsubscribeFromExpenses();

    unsubscribeFromExpenses = firebase.firestore().collection('expenses')
        .where('userId', '==', currentUser.uid)
        .orderBy('date', 'desc')
        .onSnapshot(snapshot => {
            const expenses = [];
            snapshot.forEach(doc => {
                expenses.push({ id: doc.id, ...doc.data() });
            });
            renderExpenses(expenses);
            updateDashboard(expenses);
        }, err => {
            console.error('Error loading expenses:', err);
        });
}

function renderExpenses(expenses) {
    expensesList.innerHTML = '';
    expenses.forEach(exp => {
        const card = document.createElement('div');
        card.className = 'expense-item-card';
        card.innerHTML = `
            <div class="expense-main">
                <div class="expense-amount-bold">₹${exp.amount.toFixed(2)}</div>
                <div class="expense-desc-muted">${exp.description}</div>
                <div class="expense-tags">
                    <span class="tag">${exp.date}</span>
                    <span class="tag">${exp.category}</span>
                </div>
            </div>
            <button class="trash-btn" onclick="deleteExpense('${exp.id}')">
                🗑️
            </button>
        `;
        expensesList.appendChild(card);
    });
}

window.deleteExpense = (id) => {
    if (confirm('Delete this expense?')) {
        firebase.firestore().collection('expenses').doc(id).delete()
            .catch(err => alert(err.message));
    }
};

// --- Dashboard & Chart ---

function updateDashboard(expenses) {
    const totals = { Food: 0, Travel: 0, Utilities: 0, Others: 0, Shopping: 0 };
    let total = 0;

    expenses.forEach(exp => {
        total += exp.amount;
        if (totals[exp.category] !== undefined) {
            totals[exp.category] += exp.amount;
        } else {
            totals.Others += exp.amount;
        }
    });

    totalSpentEl.textContent = `₹${total.toFixed(2)}`;
    foodTotalEl.textContent = `₹${totals.Food.toFixed(2)}`;
    travelTotalEl.textContent = `₹${totals.Travel.toFixed(2)}`;
    utilitiesTotalEl.textContent = `₹${totals.Utilities.toFixed(2)}`;
    othersTotalEl.textContent = `₹${(totals.Others + (totals.Shopping || 0)).toFixed(2)}`;

    updateChart(totals);
}

function updateChart(totals) {
    const canvas = document.getElementById('expenseChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const categories = ['Food', 'Travel', 'Utilities', 'Others'];
    const shoppingAmt = totals.Shopping || 0;
    const values = [
        totals.Food, 
        totals.Travel, 
        totals.Utilities, 
        totals.Others + shoppingAmt
    ];
    
    const maxValue = Math.max(...values, 100);
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const barWidth = 40;
    const spacing = 30;
    const startX = 60;
    const chartHeight = 140;
    const bottomY = canvas.height - 40;

    // Draw simple bars
    values.forEach((val, i) => {
        const h = (val / maxValue) * chartHeight;
        const x = startX + i * (barWidth + spacing);
        const y = bottomY - h;

        // Gradient for bars
        const grad = ctx.createLinearGradient(x, y, x, bottomY);
        grad.addColorStop(0, '#6366f1');
        grad.addColorStop(1, '#2563eb');

        ctx.fillStyle = grad;
        // Rounded corners for bars
        roundRect(ctx, x, y, barWidth, h, 8);

        // Labels
        ctx.fillStyle = '#6b7280';
        ctx.font = '12px Inter';
        ctx.textAlign = 'center';
        ctx.fillText(categories[i], x + barWidth/2, bottomY + 20);
        
        // Value
        ctx.fillStyle = '#1f2937';
        ctx.font = 'bold 11px Inter';
        ctx.fillText(`₹${Math.round(val)}`, x + barWidth/2, y - 8);
    });
}

// Helper for rounded rectangles
function roundRect(ctx, x, y, width, height, radius) {
    if (height < radius) radius = height / 2;
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height);
    ctx.lineTo(x, y + height);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();
}

// --- AI Insights ---

aiInsightsBtn.addEventListener('click', () => {
    const total = parseFloat(totalSpentEl.textContent.replace('₹', ''));
    let insights = [];
    
    if (total > 15000) {
        insights.push("High spending detected. Review your 'Others' category for potential savings.");
        insights.push("Consider setting a strict budget for this month.");
    } else if (total > 0) {
        insights.push("Your spending is stable. Great job staying within limits!");
        insights.push("You're saving 15% more than last month.");
    } else {
        insights.push("No data yet. Add some expenses to get personalized insights.");
    }
    
    aiInsightsContainer.innerHTML = `
        <ul>
            ${insights.map(i => `<li>${i}</li>`).join('')}
        </ul>
    `;
});

// --- Bill Upload ---

uploadArea.addEventListener('click', () => billInput.click());

uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = '#2563eb';
    uploadArea.style.background = '#f0f7ff';
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.style.borderColor = '#cbd5e1';
    uploadArea.style.background = '#f8fafc';
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = '#cbd5e1';
    uploadArea.style.background = '#f8fafc';
    if (e.dataTransfer.files.length) {
        handleImage(e.dataTransfer.files[0]);
    }
});

billInput.addEventListener('change', (e) => {
    if (e.target.files.length) {
        handleImage(e.target.files[0]);
    }
});

function handleImage(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        previewImage.src = e.target.result;
        imagePreview.classList.remove('hidden');
    };
    reader.readAsDataURL(file);
}

// Initialize date
document.getElementById('date').valueAsDate = new Date();
