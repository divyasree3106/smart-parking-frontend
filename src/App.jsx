
import { useEffect, useState } from "react";
import "./App.css";

const API = "http://localhost:8080/api/parking-slots";

function App() {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [bookingId, setBookingId] = useState(null);
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState([]);

  async function loadSlots() {
    try {
      setError("");

      const response = await fetch(API);

      if (!response.ok) {
        throw new Error("Failed to load slots");
      }

      const data = await response.json();
      setSlots(data);
    } catch (err) {
      setError("Cannot connect to the backend. Check if Spring Boot is running.");
    } finally {
      setLoading(false);
    }
  }

  async function loadHistory() {
    try {
      const response = await fetch(`${API}/history`);

      if (!response.ok) {
        throw new Error("Failed to load booking history");
      }

      const data = await response.json();
      setHistory(data);
    } catch (err) {
      console.error("Booking history error:", err);
    }
  }

  async function bookSlot(slot) {
    if (slot.status !== "AVAILABLE") {
      return;
    }

    const confirmed = window.confirm(
      `Book slot ${slot.slotNumber} for ₹${slot.pricePerHour} per hour?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setBookingId(slot.id);
      setMessage("");

      const response = await fetch(`${API}/${slot.id}/book`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Booking failed");
      }

      const updatedSlot = await response.json();

      setSlots((currentSlots) =>
        currentSlots.map((item) =>
          item.id === updatedSlot.id ? updatedSlot : item
        )
      );

      setMessage(`Slot ${slot.slotNumber} booked successfully!`);

      await loadHistory();
    } catch (err) {
      setMessage("Booking failed. Please try again.");
      await loadSlots();
    } finally {
      setBookingId(null);
    }
  }

  useEffect(() => {
    loadSlots();
    loadHistory();
  }, []);

  const availableCount = slots.filter(
    (slot) => slot.status === "AVAILABLE"
  ).length;

  return (
    <div className="app">
      <header>
        <h1>Smart Parking Reservation System</h1>
        <p>Find and book your parking slot easily.</p>
      </header>

      <main>
        <section className="summary">
          <h2>Parking Overview</h2>
          <p>Total Slots: {slots.length}</p>
          <p>Available Slots: {availableCount}</p>
          <p>Booked Slots: {slots.length - availableCount}</p>
        </section>

        {message && <p className="message">{message}</p>}
        {error && <p className="error">{error}</p>}

        <section>
          <h2>Parking Slots</h2>

          {loading ? (
            <p>Loading parking slots...</p>
          ) : slots.length === 0 ? (
            <p>No parking slots found.</p>
          ) : (
            <div className="parking-grid">
              {slots.map((slot) => (
                <div className="parking-card" key={slot.id}>
                  <h3>Slot {slot.slotNumber}</h3>

                  <p>
                    Status: <strong>{slot.status}</strong>
                  </p>

                  <p>Price: ₹{slot.pricePerHour} per hour</p>

                  <button
                    onClick={() => bookSlot(slot)}
                    disabled={
                      slot.status !== "AVAILABLE" ||
                      bookingId === slot.id
                    }
                  >
                    {bookingId === slot.id
                      ? "Booking..."
                      : slot.status === "BOOKED"
                      ? "Already Booked"
                      : "Book Slot"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="history-section">
          <h2>Booking History</h2>

          <button onClick={loadHistory}>Refresh History</button>

          {history.length === 0 ? (
            <p>No bookings yet.</p>
          ) : (
            <div>
              {history.map((booking) => (
                <div className="history-item" key={booking.id}>
                  <p>Booking ID: {booking.id}</p>
                  <p>Slot: {booking.slotNumber}</p>
                  <p>
                    Booking Time:{" "}
                    {booking.bookingTime
                      ? new Date(booking.bookingTime).toLocaleString()
                      : "Not available"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
