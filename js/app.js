const api = '/api';


// =====================================================
// COMMON API REQUEST FUNCTION
// =====================================================

async function request(url, opt = {}) {

    const response = await fetch(api + url, {
        headers: {
            'Content-Type': 'application/json',
            ...(opt.headers || {})
        },
        ...opt
    });

    const text = await response.text();

    let data = {};

    try {
        data = text ? JSON.parse(text) : {};
    } catch {
        data = {};
    }

    if (!response.ok) {

        throw new Error(
            data.message ||
            `Request failed (${response.status} ${response.statusText})`
        );
    }

    return data;
}


// =====================================================
// REGISTER
// =====================================================

async function registerUser() {

    try {

        const nameInput = document.getElementById("name");
        const emailInput = document.getElementById("email");
        const passwordInput = document.getElementById("password");
        const msg = document.getElementById("msg");

        const nameValue = nameInput.value.trim();
        const emailValue = emailInput.value.trim();
        const passwordValue = passwordInput.value;

        if (!nameValue || !emailValue || !passwordValue) {

            msg.textContent = "Please fill all fields.";

            return;
        }

        const d = await request("/auth/register", {

            method: "POST",

            body: JSON.stringify({
                name: nameValue,
                email: emailValue,
                password: passwordValue
            })
        });

        msg.textContent = d.message;

        setTimeout(() => {

            window.location.href = "login.html";

        }, 800);

    } catch (e) {

        document.getElementById("msg").textContent = e.message;

        console.error("REGISTER ERROR:", e);
    }
}


// =====================================================
// LOGIN
// =====================================================

async function login() {

    try {

        const emailInput = document.getElementById("email");
        const passwordInput = document.getElementById("password");
        const msg = document.getElementById("msg");

        const emailValue = emailInput.value.trim();
        const passwordValue = passwordInput.value;

        if (!emailValue || !passwordValue) {

            msg.textContent = "Please enter email and password.";

            return;
        }

        const d = await request("/auth/login", {

            method: "POST",

            body: JSON.stringify({
                email: emailValue,
                password: passwordValue
            })
        });

        console.log("LOGIN RESPONSE:", d);

        if (!d.name || !d.role) {

            msg.textContent =
                "Login response is missing user information.";

            console.error("Invalid login response:", d);

            return;
        }

        sessionStorage.setItem("role", d.role);
        sessionStorage.setItem("name", d.name);
        sessionStorage.setItem("userId", d.userId);

        console.log(
            "Logged in:",
            d.name,
            d.role,
            d.userId
        );

        if (d.role === "ADMIN") {

            window.location.href = "admin.html";

        } else {

            window.location.href = "index.html";
        }

    } catch (e) {

        document.getElementById("msg").textContent = e.message;

        console.error("LOGIN ERROR:", e);
    }
}


// =====================================================
// LOGOUT
// =====================================================

async function logout() {

    try {

        await request("/auth/logout", {
            method: "POST"
        });

    } catch (error) {

        console.error("Logout request failed:", error);

    } finally {

        sessionStorage.clear();

        window.location.href = "login.html";
    }
}


// =====================================================
// SEARCH BUSES
// =====================================================

async function searchBuses() {

    const from = document.getElementById('from').value.trim();
    const to = document.getElementById('to').value.trim();
    const date = document.getElementById('date').value;

    const results = document.getElementById('results');

    if (!from || !to || !date) {

        results.textContent =
            "Please enter From, To and Date.";

        return;
    }

    try {

        const data = await request(
            `/buses?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&date=${date}`
        );

        if (data.length) {

            results.innerHTML = data.map(b => `

                <div class="bus">

                    <h3>
                        ${b.busName} (${b.busNumber})
                    </h3>

                    <p>
                        ${b.fromCity} → ${b.toCity}
                    </p>

                    <p>
                        Date: ${b.travelDate}
                    </p>

                    <p>
                        ${b.departureTime} - ${b.arrivalTime}
                    </p>

                    <p>
                        Fare: ₹${b.fare}
                        |
                        Seats: ${b.totalSeats}
                    </p>

                    <button
                        onclick="location.href='booking.html?busId=${b.id}'">

                        Select Seats

                    </button>

                </div>

            `).join('');

        } else {

            results.innerHTML =
                '<p>No buses found.</p>';
        }

    } catch (error) {

        results.textContent = error.message;

        console.error("SEARCH ERROR:", error);
    }
}


// =====================================================
// ADMIN - ADD BUS
// =====================================================

async function addBus() {

    const msg = document.getElementById("msg");

    try {

        const bus = {

            busName:
                document.getElementById("busName").value.trim(),

            busNumber:
                document.getElementById("busNumber").value.trim(),

            fromCity:
                document.getElementById("fromCity").value.trim(),

            toCity:
                document.getElementById("toCity").value.trim(),

            travelDate:
                document.getElementById("travelDate").value,

            departureTime:
                document.getElementById("departureTime").value.trim(),

            arrivalTime:
                document.getElementById("arrivalTime").value.trim(),

            fare:
                Number(document.getElementById("fare").value),

            totalSeats:
                Number(document.getElementById("totalSeats").value)
        };


        // Check required fields

        if (
            !bus.busName ||
            !bus.busNumber ||
            !bus.fromCity ||
            !bus.toCity ||
            !bus.travelDate ||
            !bus.departureTime ||
            !bus.arrivalTime ||
            !bus.fare ||
            !bus.totalSeats
        ) {

            msg.textContent =
                "Please fill all bus details.";

            return;
        }


        const data = await request("/admin/buses", {

            method: "POST",

            body: JSON.stringify(bus)
        });


        msg.textContent =
            "Bus added successfully!";


        console.log("BUS ADDED:", data);


        // Clear form

        document.getElementById("busName").value = "";
        document.getElementById("busNumber").value = "";
        document.getElementById("fromCity").value = "";
        document.getElementById("toCity").value = "";
        document.getElementById("travelDate").value = "";
        document.getElementById("departureTime").value = "";
        document.getElementById("arrivalTime").value = "";
        document.getElementById("fare").value = "";
        document.getElementById("totalSeats").value = "40";


        // Refresh bus list

        loadAdmin();

    } catch (error) {

        msg.textContent = error.message;

        console.error("ADD BUS ERROR:", error);
    }
}


// =====================================================
// ADMIN - LOAD DASHBOARD
// =====================================================

async function loadAdmin() {

    try {

        const role = sessionStorage.getItem("role");

        if (role !== "ADMIN") {

            document.body.innerHTML = `
                <h2 style="text-align:center;margin-top:50px;">
                    Admin access required
                </h2>
            `;

            return;
        }


        // Load statistics

        const stats = await request("/admin/stats");

        const statsDiv =
            document.getElementById("stats");

        if (statsDiv) {

            statsDiv.innerHTML = `

                <div>
                    <h3>${stats.buses}</h3>
                    <p>Total Buses</p>
                </div>

                <div>
                    <h3>${stats.users}</h3>
                    <p>Total Users</p>
                </div>

                <div>
                    <h3>${stats.bookings}</h3>
                    <p>Total Bookings</p>
                </div>

            `;
        }


        // Load buses

        await loadAdminBuses();


        // Load bookings

        await loadAdminBookings();

    } catch (error) {

        console.error("ADMIN LOAD ERROR:", error);

        const msg = document.getElementById("msg");

        if (msg) {

            msg.textContent = error.message;
        }
    }
}


// =====================================================
// ADMIN - LOAD ALL BUSES
// =====================================================

async function loadAdminBuses() {

    const container =
        document.getElementById("adminBuses");

    if (!container) return;

    try {

        const buses =
            await request("/admin/buses");


        if (!buses.length) {

            container.innerHTML =
                "<p>No buses available.</p>";

            return;
        }


        container.innerHTML = buses.map(bus => `

            <div class="bus">

                <h3>
                    ${bus.busName}
                    (${bus.busNumber})
                </h3>

                <p>
                    ${bus.fromCity}
                    →
                    ${bus.toCity}
                </p>

                <p>
                    Date: ${bus.travelDate}
                </p>

                <p>
                    Time:
                    ${bus.departureTime}
                    -
                    ${bus.arrivalTime}
                </p>

                <p>
                    Fare: ₹${bus.fare}
                </p>

                <p>
                    Total Seats: ${bus.totalSeats}
                </p>

                <button
                    onclick="editBus(
                        ${bus.id},
                        '${escapeValue(bus.busName)}',
                        '${escapeValue(bus.busNumber)}',
                        '${escapeValue(bus.fromCity)}',
                        '${escapeValue(bus.toCity)}',
                        '${escapeValue(bus.travelDate)}',
                        '${escapeValue(bus.departureTime)}',
                        '${escapeValue(bus.arrivalTime)}',
                        ${bus.fare},
                        ${bus.totalSeats}
                    )">

                    Edit

                </button>

                <button
                    onclick="deleteBus(${bus.id})">

                    Delete

                </button>

            </div>

        `).join('');

    } catch (error) {

        container.innerHTML =
            `<p>${error.message}</p>`;

        console.error(
            "LOAD BUSES ERROR:",
            error
        );
    }
}


// =====================================================
// ADMIN - EDIT BUS
// =====================================================

function editBus(
    id,
    busName,
    busNumber,
    fromCity,
    toCity,
    travelDate,
    departureTime,
    arrivalTime,
    fare,
    totalSeats
) {

    document.getElementById("busName").value =
        busName;

    document.getElementById("busNumber").value =
        busNumber;

    document.getElementById("fromCity").value =
        fromCity;

    document.getElementById("toCity").value =
        toCity;

    document.getElementById("travelDate").value =
        travelDate;

    document.getElementById("departureTime").value =
        departureTime;

    document.getElementById("arrivalTime").value =
        arrivalTime;

    document.getElementById("fare").value =
        fare;

    document.getElementById("totalSeats").value =
        totalSeats;


    const msg =
        document.getElementById("msg");

    msg.textContent =
        "Editing bus ID " + id;


    // Change Add Bus button into Update Bus button

    const buttons =
        document.querySelectorAll("button");

    buttons.forEach(button => {

        if (button.textContent.trim() === "Add Bus") {

            button.textContent =
                "Update Bus";

            button.onclick = function () {

                updateBus(id);
            };
        }
    });
}


// =====================================================
// ADMIN - UPDATE BUS
// =====================================================

async function updateBus(id) {

    try {

        const bus = {

            busName:
                document.getElementById("busName").value.trim(),

            busNumber:
                document.getElementById("busNumber").value.trim(),

            fromCity:
                document.getElementById("fromCity").value.trim(),

            toCity:
                document.getElementById("toCity").value.trim(),

            travelDate:
                document.getElementById("travelDate").value,

            departureTime:
                document.getElementById("departureTime").value.trim(),

            arrivalTime:
                document.getElementById("arrivalTime").value.trim(),

            fare:
                Number(document.getElementById("fare").value),

            totalSeats:
                Number(document.getElementById("totalSeats").value)
        };


        await request(`/admin/buses/${id}`, {

            method: "PUT",

            body: JSON.stringify(bus)
        });


        document.getElementById("msg").textContent =
            "Bus updated successfully!";


        resetBusForm();


        loadAdmin();

    } catch (error) {

        document.getElementById("msg").textContent =
            error.message;

        console.error(
            "UPDATE BUS ERROR:",
            error
        );
    }
}


// =====================================================
// ADMIN - DELETE BUS
// =====================================================

async function deleteBus(id) {

    const confirmDelete =
        confirm(
            "Are you sure you want to delete this bus?"
        );

    if (!confirmDelete) return;


    try {

        await request(`/admin/buses/${id}`, {

            method: "DELETE"
        });


        alert("Bus deleted successfully!");


        loadAdmin();

    } catch (error) {

        alert(error.message);

        console.error(
            "DELETE BUS ERROR:",
            error
        );
    }
}


// =====================================================
// ADMIN - LOAD BOOKINGS
// =====================================================

async function loadAdminBookings() {

    const container =
        document.getElementById("adminBookings");

    if (!container) return;

    try {

        const bookings =
            await request("/admin/bookings");


        if (!bookings.length) {

            container.innerHTML =
                "<p>No bookings available.</p>";

            return;
        }


        container.innerHTML = bookings.map(booking => `

            <div class="bus">

                <h3>
                    Booking ID: ${booking.id}
                </h3>

                <p>
                    User ID:
                    ${booking.userId ?? "N/A"}
                </p>

                <p>
                    Bus ID:
                    ${booking.busId ?? "N/A"}
                </p>

                <p>
                    Seat:
                    ${booking.seatNumber ?? "N/A"}
                </p>

                <p>
                    Status:
                    ${booking.status ?? "N/A"}
                </p>

            </div>

        `).join('');

    } catch (error) {

        container.innerHTML =
            `<p>${error.message}</p>`;

        console.error(
            "LOAD BOOKINGS ERROR:",
            error
        );
    }
}


// =====================================================
// RESET BUS FORM
// =====================================================

function resetBusForm() {

    document.getElementById("busName").value = "";
    document.getElementById("busNumber").value = "";
    document.getElementById("fromCity").value = "";
    document.getElementById("toCity").value = "";
    document.getElementById("travelDate").value = "";
    document.getElementById("departureTime").value = "";
    document.getElementById("arrivalTime").value = "";
    document.getElementById("fare").value = "";
    document.getElementById("totalSeats").value = "40";


    const buttons =
        document.querySelectorAll("button");

    buttons.forEach(button => {

        if (
            button.textContent.trim() ===
            "Update Bus"
        ) {

            button.textContent =
                "Add Bus";

            button.onclick = addBus;
        }
    });
}


// =====================================================
// ESCAPE TEXT USED IN ONCLICK
// =====================================================

function escapeValue(value) {

    return String(value ?? "")
        .replace(/\\/g, "\\\\")
        .replace(/'/g, "\\'");
}
let selectedSeat = null;
let currentBusId = null;

async function loadBooking() {
    try {
        const params = new URLSearchParams(window.location.search);
        currentBusId = params.get("busId");

        if (!currentBusId) {
            document.getElementById("msg").textContent =
                "Bus ID is missing.";
            return;
        }

        // Get bus details
        const bus = await request(`/buses/${currentBusId}`);

        document.getElementById("details").innerHTML = `
            <b>${bus.busName}</b> (${bus.busNumber})<br>
            ${bus.fromCity} → ${bus.toCity}<br>
            Date: ${bus.travelDate}<br>
            Time: ${bus.departureTime} - ${bus.arrivalTime}<br>
            Fare: ₹${bus.fare}
        `;

        createSeats(bus.totalSeats);

    } catch (error) {
        console.error("BOOKING LOAD ERROR:", error);
        document.getElementById("msg").textContent = error.message;
    }
}

function createSeats(totalSeats) {
    const seatsContainer = document.getElementById("seats");

    seatsContainer.innerHTML = "";

    for (let i = 1; i <= totalSeats; i++) {

        const seat = document.createElement("button");

        seat.type = "button";
        seat.className = "seat";
        seat.textContent = i;

        seat.onclick = function () {
            selectSeat(i, seat);
        };

        seatsContainer.appendChild(seat);
    }
}

function selectSeat(seatNumber, seatElement) {

    // Remove previous selection
    document.querySelectorAll(".seat").forEach(seat => {
        seat.classList.remove("selected-seat");
    });

    // Select this seat
    seatElement.classList.add("selected-seat");

    selectedSeat = seatNumber;

    document.getElementById("selected").textContent =
        "Seat " + seatNumber;
}

async function bookNow() {

    if (!selectedSeat) {
        document.getElementById("msg").textContent =
            "Please select a seat first.";
        return;
    }

    const userId = sessionStorage.getItem("userId");

    if (!userId) {
        document.getElementById("msg").textContent =
            "Please login before booking.";
        return;
    }

    try {

        const booking = {
            userId: Number(userId),
            busId: Number(currentBusId),
            seatNumber: selectedSeat,
            status: "CONFIRMED"
        };

        const result = await request("/bookings", {
            method: "POST",
            body: JSON.stringify(booking)
        });

        document.getElementById("msg").textContent =
            result.message || "Booking successful!";

        setTimeout(() => {
            window.location.href = "my-bookings.html";
        }, 1000);

    } catch (error) {

        console.error("BOOKING ERROR:", error);

        document.getElementById("msg").textContent =
            error.message;
    }
}