import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Panel.module.css";
import Sidebar from "./Sidebar";
import { db } from "../firebase/firebase";
import { collection, getDocs, doc, getDoc } from "firebase/firestore"; // Added getDoc to check for user in services

function Panel({ user }) {
    const [totalUsers, setTotalUsers] = useState(0);
    const [totalProviders, setTotalProviders] = useState(0);
    const [usersList, setUsersList] = useState([]); // State to store user data
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Check if logged-in user is a service provider
                const serviceDocRef = doc(db, "services", user.uid);
                const serviceDocSnapshot = await getDoc(serviceDocRef);

                // If the document exists, this user is a provider
                if (serviceDocSnapshot.exists()) {
                    navigate("/bookings"); // Redirect to /bookings if the user is a provider
                    return;
                }
                
                // If not a provider, fetch general users data
                const usersCollection = collection(db, "users");
                const usersSnapshot = await getDocs(usersCollection);
                setTotalUsers(usersSnapshot.size);

                const users = usersSnapshot.docs.map((doc) => ({
                    id: doc.id, // Document ID
                    ...doc.data(), // All fields in the document
                }));
                setUsersList(users);

                // Fetch total providers
                const providersCollection = collection(db, "services");
                const providersSnapshot = await getDocs(providersCollection);
                setTotalProviders(providersSnapshot.size);
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        };

        fetchData();
    }, [user, navigate]); // Add user and navigate as dependencies

    // Delete user from Firestore
    const handleDeleteUser = async (userId) => {
        try {
            // Delete the user document from the "users" collection
            await deleteDoc(doc(db, "users", userId));
            console.log(`User with ID ${userId} has been deleted.`);

            // Update the UI by filtering out the deleted user
            setUsersList((prevUsers) => prevUsers.filter((user) => user.id !== userId));
            setTotalUsers((prevTotal) => prevTotal - 1); // Update total users count
        } catch (error) {
            console.error("Error deleting user:", error);
        }
    };

    return (
        <div className={styles.container}>
            <Sidebar user={user} />

            {/* Main Content */}
            <div className={styles.mainContent}>
                {/* Header */}
                <header className={styles.header}>
                    <h1>Welcome, Admin</h1>
                </header>

                {/* Dashboard Content */}
                <section className={styles.dashboard}>
                    <div className={styles.card}>
                        <h3>Total Users</h3>
                        <p>{totalUsers}</p>
                    </div>
                    <div className={styles.card}>
                        <h3>Total Providers</h3>
                        <p>{totalProviders}</p>
                    </div>
                </section>

                <span style={{ fontWeight: "bold" }}>List of Users</span>
                <table>
                    <thead>
                        <tr>
                            <th>Email</th>
                            <th>UID</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {usersList.map((user) => (
                            <tr key={user.id}>
                                <td>{user.email}</td>
                                <td>{user.id}</td>
                                <td>
                                    <button
                                        className={styles.actionButton}
                                        onClick={() => handleDeleteUser(user.id)}
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default Panel;
