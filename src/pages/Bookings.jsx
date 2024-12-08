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
          console.log("Document Data:", data); // Log to check structure

          // Check each key in the document to find arrays that match user.uid
          for (let key in data) {
            // Only proceed if the key name matches user.uid
            if (key === user.uid && Array.isArray(data[key])) {
              console.log("Array Found for User:", key); // Log the matching array key

              // Iterate through the array (this should be an array of booking objects)
              data[key].forEach((booking, index) => {
                console.log("Booking:", booking); // Log each booking object

                // Add the booking to the list if the user.uid matches
                allBookings.push({ ...booking, bookingDocId: docSnap.id });
              });
            }
          }
        });

        // If there are bookings, update state
        setBookings(allBookings);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching bookings:", error);
        setLoading(false);
      }
    };

    // Fetch bookings when the component mounts
    fetchBookings();
  }, [user.uid]);

  const handleStatusUpdate = async (bookingDocId, currentStatus, action) => {
    try {
      let newStatus = currentStatus;
  
      // Define status changes based on the action
      if (action === "accept" && currentStatus === "pending") {
        newStatus = "in-progress";
      } else if (action === "finish" && currentStatus === "in-progress") {
        newStatus = "done";
      } else if (action === "reject" && currentStatus === "pending") {
        newStatus = "rejected";
      }
  
      // Reference to the specific booking document
      const bookingRef = doc(db, "bookings", bookingDocId);
  
      // Fetch the current document before updating to preserve the structure
      const docSnap = await getDoc(bookingRef);
      const docData = docSnap.data();
  
      // Get the current state of the specific booking and user fields
      const updatedBookings = docData[user.uid].map((booking) =>
        booking.bookingDocId === bookingDocId
          ? { ...booking, status: newStatus } // Only update the status
          : booking
      );
  
      // Update the status field in Firestore while preserving other fields
      await updateDoc(bookingRef, {
        [`${user.uid}`]: updatedBookings, // Ensure the structure is correct for Firestore update
      });
  
      // Update the local state to reflect the new status
      setBookings((prevBookings) =>
        prevBookings.map((booking) =>
          booking.bookingDocId === bookingDocId
            ? { ...booking, status: newStatus }
            : booking
        )
      );
    } catch (error) {
      console.error("Error updating status:", error);
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
                    {/* Actions based on status */}
                    {booking.status === "pending" && (
                      <>
                        <button
                          onClick={() =>
                            handleStatusUpdate(booking.bookingDocId, booking.status, "accept")
                          }
                        >
                          Accept
                        </button>
                        <button
                          onClick={() =>
                            handleStatusUpdate(booking.bookingDocId, booking.status, "reject")
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
                            handleStatusUpdate(booking.bookingDocId, booking.status, "finish")
                          }
                        >
                          Finish
                        </button>
                        <button
                          onClick={() =>
                            handleStatusUpdate(booking.bookingDocId, booking.status, "reject")
                          }
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {booking.status === "done" || booking.status === "rejected" ? (
                      <span>Completed</span>
                    ) : null}
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
