import React, { useState, useEffect } from "react";
import styles from "./Sidebar.module.css";
import { signOut } from "firebase/auth"; // Import signOut function from Firebase
import { auth, db } from "../firebase/firebase"; // Ensure auth is correctly imported
import { useNavigate } from "react-router-dom"; // For navigation after logout
import { doc, getDoc } from "firebase/firestore";

function Sidebar({ user }) {
    const [isServiceProvider, setIsServiceProvider] = useState(false);
    const navigate = useNavigate();

    // Navigate to login page if no user is logged in
    useEffect(() => {
        if (!user) {
            navigate("/"); // Redirect to login page
        }
    }, [user, navigate]);

    useEffect(() => {
        const fetchData = async () => {
            if (user) {
                try {
                    // Check if logged-in user is a service provider
                    const serviceDocRef = doc(db, "services", user.uid);
                    const serviceDocSnapshot = await getDoc(serviceDocRef);

                    // If the document exists, this user is a provider
                    if (serviceDocSnapshot.exists()) {
                        setIsServiceProvider(true);
                    } else {
                        setIsServiceProvider(false);
                    }
                } catch (error) {
                    console.error("Error fetching data:", error);
                }
            }
        };

        fetchData();
    }, [user]);

    const handleLogout = async () => {
        try {
            await signOut(auth); // Sign out the user
            navigate("/"); // Redirect to the login page
        } catch (error) {
            console.error("Error during logout:", error);
        }
    };

    return (
        <aside className={styles.sidebar}>
            <h2 className={styles.logo}>DustFreeHub</h2>
            <ul className={styles.navList}>
                {isServiceProvider ? (
                    <>
                        <li className={styles.navItem} onClick={() => navigate('/bookings')}>Bookings</li>
                        <li className={styles.navItem} onClick={handleLogout} style={{ cursor: "pointer" }}>
                            Logout
                        </li>
                    </>
                ) : (
                    <>
                        <li className={styles.navItem} onClick={() => navigate('/panel')}>Dashboard</li>
                        <li className={styles.navItem} onClick={() => navigate('/services')}>Services</li>
                        <li className={styles.navItem} onClick={handleLogout} style={{ cursor: "pointer" }}>
                            Logout
                        </li>
                    </>
                )}
            </ul>
        </aside>
    );
}

export default Sidebar;
