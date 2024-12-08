import React, { useState } from "react";
import styles from "./Login.module.css";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase/firebase";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";


function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
          // Authenticate the user
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          const user = userCredential.user;
    
          // Check if user is in the admins collection
          const adminDocRef = doc(db, "admins", user.uid);
          const adminDoc = await getDoc(adminDocRef);

          const serviceDocRef = doc(db, "services", user.uid);
          const serviceDoc = await getDoc(serviceDocRef)
    
          if (adminDoc.exists() || serviceDoc.exists()) {
            toast.success("Welcome, Admin!");
            navigate("/panel"); // Navigate to the admin panel
          } else {
            toast.error("Access Denied!");
          }
        } catch (error) {
          toast.error(`Login Failed, Invalid Credentials`);
        }
      };

    return (
        <>
            <ToastContainer />
            <div className={styles.container}>
                <div className={styles.cardBox}>
                    <h2 className={styles.title}>Login</h2>
                    <form className={styles.form} onSubmit={handleSubmit}>
                    <div className={styles.inputGroup}>
                        <label htmlFor="email" className={styles.label}>Email</label>
                        <input
                        type="email"
                        id="email"
                        className={styles.input}
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        />
                    </div>
                    <div className={styles.inputGroup}>
                        <label htmlFor="password" className={styles.label}>Password</label>
                        <input
                        type="password"
                        id="password"
                        className={styles.input}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        />
                    </div>
                    <button type="submit" className={styles.button}>Login</button>
                    </form>
                </div>
            </div>
        </>
    );
}

export default Login;
