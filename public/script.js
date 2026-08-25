// Service categories data
const serviceCategories = {
    cleaning: [
        "Cleaning",
        "Party clean up",
        "Apartment cleaning",
        "Deep clean",
        "Garage Cleaning",
        "Move-out clean",
        "Gutter cleaning",
        "Pressure washing",
    ],
    handyman: [
        "Appliance installation",
        "Carpentry",
        "Door lock repair",
        "Painting & drywall",
        "Ceiling installation",
        "Light fixture replacement",
        "Deck & fence repair",
    ],
    moving: [
        "Moving Help",
        "Truck-assisted help moving",
        "Trash & furniture removal",
        "Heavy lifting & Loading",
        "Rearrange Furniture",
        "Junk haul away",
    ],
    painting: [
        "Indoor painting",
        "Wallpapering",
        "Outdoor painting",
        "Concrete & brick painting",
        "Accent wall painting",
        "Wallpaper removal",
    ],
    assembly: [
        "Desk assembly",
        "General furniture assembly",
        "IKEA assembly",
        "Crib assembly",
        "PAX assembly",
        "Bookshelf assembly",
    ],
    mounting: [
        "Hang art, mirror & decor",
        "Install blinds & window treatments",
        "Mount & anchor furniture",
        "Install Shelves, rods & hooks",
        "TV mounting",
    ],
    outdoor: [
        "Yard work",
        "Lawn care",
        "Snow removal",
        "Landscaping help",
        "Branch & Hedge Trimming",
        "Gardening & Weeding",
        "Fence repair",
        "Pool maintenance",
    ],
    "home repairs": [
        "Door repair",
        "Wall repair",
        "Sealing & caulking",
        "Appliance repair",
        "Window repair",
        "Floor repair",
        "Roof repair",
        "Gutter repair",
    ],
    plumbing: [
        "Pipe repair",
        "Leak detection & repair",
        "Faucet installation",
        "Toilet repair",
        "Drain repair",
        "Water heater installation",
    ],
    electrical: [
        "Wiring & rewiring",
        "Circuit breaker repair",
        "Outlet & switch installation",
        "Lighting installation",
        "Ceiling fan installation",
    ],
    furniture: [
        "Furniture assembly & repair",
        "Custom furniture making",
        "Upholstery repair",
        "Cabinet installation",
        "Shelving & wardrobe installation",
    ],
    trending: [
        "Smart home setup",
        "EV supply installation",
        "AI-powered security system",
        "Ergonomic furniture setup",
        "Standing desk assembly",
    ],
};

let selectedService = "";
let selectedSubcategory = "";
let managedAuthReady = false;

// Configure API base URL
const API_BASE_URL = "/api";

function getClerkDomain(publishableKey) {
    const encodedDomain = publishableKey.replace(/^pk_(test|live)_/, "");
    return atob(encodedDomain).replace(/\$$/, "");
}

function loadExternalScript(src, attributes = {}) {
    return new Promise((resolve, reject) => {
        const existingScript = document.querySelector(`script[src="${src}"]`);
        if (existingScript) {
            existingScript.addEventListener("load", resolve, { once: true });
            return;
        }

        const script = document.createElement("script");
        script.src = src;
        script.async = true;
        script.crossOrigin = "anonymous";

        Object.entries(attributes).forEach(([key, value]) => {
            script.setAttribute(key, value);
        });

        script.onload = resolve;
        script.onerror = () => reject(new Error(`Failed to load ${src}`));
        document.head.appendChild(script);
    });
}

async function initializeManagedAuth() {
    try {
        const response = await fetch("/api/auth/config");
        const { publishableKey, configured } = await response.json();

        if (!configured || !publishableKey) {
            console.warn("Clerk is not configured. Add keys to .env to enable managed auth.");
            updateAuthUI();
            return;
        }

        const clerkDomain = getClerkDomain(publishableKey);

        await loadExternalScript(`https://${clerkDomain}/npm/@clerk/ui@1/dist/ui.browser.js`);
        await loadExternalScript(
            `https://${clerkDomain}/npm/@clerk/clerk-js@6/dist/clerk.browser.js`,
            { "data-clerk-publishable-key": publishableKey },
        );

        await window.Clerk.load({
            ui: { ClerkUI: window.__internal_ClerkUICtor },
            afterSignInUrl: "/",
            afterSignUpUrl: "/",
        });

        managedAuthReady = true;
        updateAuthUI();
    } catch (error) {
        console.error("Managed auth failed to initialize:", error);
        updateAuthUI();
    }
}

function getCurrentUserEmail() {
    return window.Clerk?.user?.primaryEmailAddress?.emailAddress || "";
}

async function getManagedAuthHeaders() {
    if (!window.Clerk?.isSignedIn) {
        await showLoginForm();
        return null;
    }

    const token = await window.Clerk.session.getToken();
    return {
        Authorization: `Bearer ${token}`,
    };
}

// Show subcategories when a main category is clicked
function showSubcategories(category, clickedElement) {
    const existingSubcategories = document.querySelector(".subcategories");
    if (existingSubcategories) {
        existingSubcategories.remove();
    }

    const parentCol = clickedElement.closest(".col-md-3");
    const subcategoriesDiv = document.createElement("div");
    subcategoriesDiv.className = "subcategories active";

    const subcategoryList = serviceCategories[category.toLowerCase()] || [];
    subcategoryList.forEach((subcat) => {
        const subcatDiv = document.createElement("div");
        subcatDiv.className = "subcategory-item";
        subcatDiv.textContent = subcat;
        subcatDiv.onclick = () => showServiceForm(category, subcat);
        subcategoriesDiv.appendChild(subcatDiv);
    });

    const nextElement = parentCol.nextElementSibling;
    const parentRow = parentCol.parentElement;
    const rowWidth = parentRow.offsetWidth;
    const colWidth = parentCol.offsetWidth;
    const colsPerRow = Math.floor(rowWidth / colWidth);
    const colIndex = Array.from(parentRow.children).indexOf(parentCol);
    const insertAfterIndex =
        Math.floor(colIndex / colsPerRow) * colsPerRow + colsPerRow - 1;
    const insertAfterElement =
        parentRow.children[insertAfterIndex] || parentRow.lastElementChild;

    insertAfterElement.after(subcategoriesDiv);
}

// Show service booking form
function showServiceForm(category, subcategory) {
    selectedService = category;
    selectedSubcategory = subcategory;
    document.getElementById("selectedServiceTitle").textContent = `Book ${subcategory}`;
    const emailInput = document.getElementById("email");
    if (emailInput && getCurrentUserEmail()) {
        emailInput.value = getCurrentUserEmail();
    }
    document.getElementById("serviceFormModal").style.display = "block";
}

// Handle service form submission
async function handleServiceSubmit(event) {
    event.preventDefault();

    const authHeaders = await getManagedAuthHeaders();
    if (!authHeaders) {
        return;
    }

    const payload = {
        user_name: document.getElementById("fullName").value,
        contact_number: document.getElementById("phone").value,
        email: document.getElementById("email").value,
        service_address: document.getElementById("address").value,
        date: document.getElementById("serviceDate").value,
        time: document.getElementById("serviceTime").value,
        work_details: document.getElementById("workDetails").value,
    };

    const submitButton = event.currentTarget.querySelector('button[type="submit"]');
    submitButton.disabled = true;

    try {
        const response = await fetch("/api/book/create", {
            method: "POST",
            headers: { "Content-Type": "application/json", ...authHeaders },
            body: JSON.stringify(payload),
        });
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Unable to create the booking.");
        }

        console.log("Booking success:", data);
        document.getElementById("serviceFormModal").style.display = "none";
        document.getElementById("confirmationDialog").style.display = "block";
    } catch (err) {
        console.error("Booking error:", err);
        alert(err.message || "Something went wrong while creating the booking.");
    } finally {
        submitButton.disabled = false;
    }
}


// Confirm service order
function confirmServiceOrder() {
    if (!window.Clerk?.isSignedIn) {
        alert("Please log in first to confirm your order");
        document.getElementById("confirmationDialog").style.display = "none";
        showLoginForm();
        return;
    }

    // Here you could add API call to save the order
    document.getElementById("confirmationDialog").style.display = "none";
    alert("Your service order has been confirmed! We will contact you soon.");
}


// Managed authentication with Clerk
async function showLoginForm() {
    if (!managedAuthReady || !window.Clerk) {
        alert("Managed authentication is not configured yet. Add your Clerk keys to .env and restart the server.");
        return;
    }

    await window.Clerk.openSignIn({ redirectUrl: "/" });
}

async function showSignupForm() {
    if (!managedAuthReady || !window.Clerk) {
        alert("Managed authentication is not configured yet. Add your Clerk keys to .env and restart the server.");
        return;
    }

    await window.Clerk.openSignUp({ redirectUrl: "/" });
}

function closeAuthForms() {
    window.Clerk?.closeSignIn?.();
    window.Clerk?.closeSignUp?.();
}

async function handleLogout() {
    if (window.Clerk?.isSignedIn) {
        await window.Clerk.signOut();
    }
    updateAuthUI();
}

// Services functions
function showWelcomeMessage(show) {
    document.getElementById("welcome-section").style.display = show
        ? "block"
        : "none";
}

async function fetchServices(category = "all") {
    try {
        const response = await fetch(`${API_BASE_URL}/services/all`);
        const services = await response.json();

        const filteredServices =
            category === "all"
                ? services
                : services.filter((service) => service.category === category);

        const serviceList = document.getElementById("serviceList");
        serviceList.innerHTML = filteredServices
            .map(
                (service) => `
            <div class="col-md-4">
                <div class="service-card">
                    <h3>${service.service_name}</h3>
                    <p>Category: ${service.category}</p>
                    <p>Price: $${service.price}</p>
                    <button class="btn btn-primary" onclick="bookService(${service.id})">
                        Book Now
                    </button>
                </div>
            </div>
        `,
            )
            .join("");
    } catch (error) {
        console.error("Error fetching services:", error);
    }
}

// Add click handlers for service categories
document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".service-category").forEach((category) => {
        category.addEventListener("click", (e) => {
            const serviceName = category
                .querySelector("h3")
                .textContent.toLowerCase();
            showSubcategories(serviceName, category);
        });
    });
    fetchServices("all");
});

// Update UI Based on Auth State
function updateAuthUI() {
    const isLoggedIn = Boolean(window.Clerk?.isSignedIn);
    const loginButton = document.getElementById("loginButton");
    const signupButton = document.getElementById("signupButton");
    const logoutButton = document.getElementById("logoutButton");
    const userButton = document.getElementById("clerkUserButton");

    if (loginButton) loginButton.style.display = isLoggedIn ? "none" : "inline-block";
    if (signupButton) signupButton.style.display = isLoggedIn ? "none" : "inline-block";
    if (logoutButton) logoutButton.style.display = isLoggedIn ? "inline-block" : "none";

    if (userButton && managedAuthReady && isLoggedIn && !userButton.hasChildNodes()) {
        window.Clerk.mountUserButton(userButton);
    }
}


const districts = [
    "Dhaka", "Chittagong", "Rajshahi", "Khulna", "Barisal", "Sylhet", "Rangpur", "Mymensingh",
    "Comilla", "Narayanganj", "Gazipur", "Bogra", "Kushtia", "Jessore", "Dinajpur"
];

const sCatagorys = [
    "Cleaning", "Handyman", "Moving", "Painting", "Assembly", "Mountain", "Outdoor Help",
    "Home Repairs", "Plumbing", "Electrical", "Furniture", "Trending"
];

const serviceAreaSelect = document.getElementById('serviceArea');
const sCatagorySelect = document.getElementById('service_catagory');

// Populate the Service Area dropdown
if (serviceAreaSelect) {
    districts.forEach(district => {
        const option = document.createElement('option');
        option.value = district.toLowerCase();
        option.textContent = district;
        serviceAreaSelect.appendChild(option);
    });
}

// Populate the Service Catagory dropdown
if (sCatagorySelect) {
    sCatagorys.forEach(sCatagory => {
        const option = document.createElement('option');
        option.value = sCatagory.toLowerCase();
        option.textContent = sCatagory;
        sCatagorySelect.appendChild(option);
    });
}

// Popular services working method
document.querySelectorAll('.hero-category').forEach(link => {
    link.addEventListener('click', function (e) {
        e.preventDefault();
        const selectedCategory = this.getAttribute('data-category');

        // Scroll to the Popular Services section smoothly
        const section = document.querySelector('#mainCategories');
        if (section) {
            section.scrollIntoView({ behavior: 'smooth' });
        }

        // Delay slightly so scroll completes and DOM is ready
        setTimeout(() => {
            const categoryItems = document.querySelectorAll('.service-category');
            categoryItems.forEach(item => {
                const titleElement = item.querySelector('h3');
                if (titleElement && titleElement.innerText.trim() === selectedCategory) {

                    // Optionally close other categories if needed
                    categoryItems.forEach(i => i.classList.remove('active')); // Remove 'active' from all
                    item.classList.add('active'); // Add 'active' to the selected one

                    // If your site uses a toggle function, call it here:
                    showSubcategories(selectedCategory, item);
                }
            });
        }, 500);
    });
});



window.onload = function () {
    initializeManagedAuth();
    updateAuthUI();

    // You might also want to add this if you're using the service categories
    document.querySelectorAll(".service-category").forEach((category) => {
        category.addEventListener("click", (e) => {
            const serviceName = category
                .querySelector("h3")
                .textContent.toLowerCase();
            showSubcategories(serviceName, category);
        });
    });

    // And this if you need to fetch services initially
    fetchServices("all");
};
