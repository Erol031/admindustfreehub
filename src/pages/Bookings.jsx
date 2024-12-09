import styles from "./Bookings.module.css";
import Sidebar from "./Sidebar";
import React, { useState, useEffect } from "react";
import { auth, db } from "../firebase/firebase";
import { getDocs, collection, doc, updateDoc, getDoc } from "firebase/firestore";

function Booking({ user }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        // Reference to the 'bookings' collection
        const bookingsRef = collection(db, "bookings");

        // Fetch all the documents from the bookings collection
        const querySnapshot = await getDocs(bookingsRef);
        const allBookings = [];

        // Iterate through each booking document
        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data();

          // Check each key in the document to find arrays that match user.uid
          for (let key in data) {
            if (key === user.uid && Array.isArray(data[key])) {
              // Add the bookings for the user to the list
              data[key].forEach((booking) => {
                allBookings.push({
                  ...booking,
                  bookingDocId: docSnap.id, // Add document ID for reference
                });
              });
            }
          }
        });

        setBookings(allBookings);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching bookings:", error);
        setLoading(false);
      }
    };

    fetchBookings();
  }, [user.uid]);

  const handleStatusUpdate = async (bookingDocId, bookingIndex, currentStatus, action) => {
    try {
      // Determine the new status based on the action
      let newStatus;
      if (action === "accept" && currentStatus === "pending") {
        newStatus = "in-progress";
      } else if (action === "finish" && currentStatus === "in-progress") {
        newStatus = "done";
      } else if (action === "reject" && currentStatus === "pending") {
        newStatus = "rejected";
      } else {
        console.error("Invalid action or current status");
        return;
      }

      // Reference the specific booking document
      const bookingRef = doc(db, "bookings", bookingDocId);

      // Fetch the current booking document
      const bookingDoc = await getDoc(bookingRef);
      if (!bookingDoc.exists()) {
        console.error("Booking document not found");
        return;
      }

      // Get the array of bookings for the current user
      const currentUserBookings = bookingDoc.data()[user.uid];
      if (!Array.isArray(currentUserBookings)) {
        console.error("No bookings found for the user in the document");
        return;
      }

      // Update the status of the specific booking
      const updatedBookings = currentUserBookings.map((booking, idx) =>
        idx === bookingIndex ? { ...booking, status: newStatus } : booking
      );

      // Update the document in Firestore
      await updateDoc(bookingRef, {
        [user.uid]: updatedBookings, // Replace the user's booking array with the updated one
      });

      // Update the local state
      setBookings((prevBookings) =>
        prevBookings.map((booking, idx) =>
          idx === bookingIndex ? { ...booking, status: newStatus } : booking
        )
      );

      console.log(`Booking status updated to "${newStatus}"`);
    } catch (error) {
      console.error("Error updating booking status:", error);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className={styles.container}>
      <Sidebar user={user} />
      <div className={styles.containerBox}>
        <div className={styles.header}>
          <span>Bookings</span>
          <span style={{ fontWeight: "normal" }}>{user.email}</span>
        </div>
        <table>
          <thead>
            <tr>
              <th>Email</th>
              <th>Number</th>
              <th>Date</th>
              <th>Time</th>
              <th>Address</th>
              <th>Type of Cleaning</th>
              <th>Comment</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {bookings.length > 0 ? (
              bookings.map((booking, index) => (
                <tr key={index}>
                  <td>{booking.email}</td>
                  <td>{booking.contactNumber}</td>
                  <td>{booking.bookingDate}</td>
                  <td>{booking.bookingTime}</td>
                  <td>{booking.address}</td>
                  <td>{booking.typesOfCleaning.join(", ")}</td>
                  <td>{booking.comment}</td>
                  <td>{booking.status}</td>
                  <td>
                    {booking.status === "pending" && (
                      <>
                        <button
                          onClick={() =>
                            handleStatusUpdate(booking.bookingDocId, index, booking.status, "accept")
                          }
                        >
                          Accept
                        </button>
                        <button
                          onClick={() =>
                            handleStatusUpdate(booking.bookingDocId, index, booking.status, "reject")
                          }
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {booking.status === "in-progress" && (
                      <>
                        <button
                          onClick={() =>
                            handleStatusUpdate(booking.bookingDocId, index, booking.status, "finish")
                          }
                        >
                          Finish
                        </button>
                      </>
                    )}
                    {(booking.status === "done" || booking.status === "rejected") && <span>Completed</span>}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="9">No bookings found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Booking;
