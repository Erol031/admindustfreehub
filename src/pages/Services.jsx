import React, { useEffect, useState } from "react";
import styles from "./Services.module.css";
import Sidebar from "./Sidebar";
import { db, auth } from "../firebase/firebase";
import { collection, getDocs, doc, setDoc, deleteDoc, getDoc } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { ToastContainer, toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import "react-toastify/dist/ReactToastify.css";

function Services({ user }) {
    const [servicesList, setServicesList] = useState([]);
    const [memberModal, setMemberModal] = useState(false);
    const [isUserProvider, setIsUserProvider] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentServiceId, setCurrentServiceId] = useState(null);  // Store the ID of the service being edited
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        serviceName: "",
        avatar: null,
        bio: "",
    });

    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Check if logged-in user is a service provider
                const serviceDocRef = doc(db, "services", user.uid);
                const serviceDocSnapshot = await getDoc(serviceDocRef);

                // If the document exists, this user is a provider
                if (serviceDocSnapshot.exists()) {
                    setIsUserProvider(true);
                    navigate("/bookings"); // Redirect to /bookings if the user is a provider
                    return;
                }
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        };

        fetchData();
    }, [user, navigate]);

    // Fetch the services data from Firestore
    useEffect(() => {
        const fetchServices = async () => {
            try {
                const servicesCollection = collection(db, "services");
                const servicesSnapshot = await getDocs(servicesCollection);
                const services = servicesSnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }));
                setServicesList(services);
            } catch (error) {
                console.error("Error fetching services:", error);
                toast.error("Error fetching services.");
            }
        };

        fetchServices();
    }, []);

    // Handle form data input change
    const handleInputChange = (e) => {
        const { name, value, type, files } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: type === "file" ? files[0] : value,
        }));
    };

    // Convert image file to Base64
    const convertToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = (error) => reject(error);
        });
    };

    // Handle form submit
    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            // If we're editing, update the service details, otherwise create a new user
            let userId = currentServiceId;

            if (!isEditing) {
                const userCredential = await createUserWithEmailAndPassword(
                    auth,
                    formData.email,
                    formData.password
                );
                userId = userCredential.user.uid;
            }

            // Convert avatar to Base64 (if selected)
            let avatarBase64 = "";
            if (formData.avatar) {
                avatarBase64 = await convertToBase64(formData.avatar);
            }

            // Store service details in Firestore
            await setDoc(doc(db, "services", userId), {
                serviceName: formData.serviceName,
                avatar: avatarBase64,
                bio: formData.bio,
                serviceId: userId,
                email: formData.email, // Or any other additional fields you want to store
            });

            // Store review fields
            const initialReviews = [];
            const initialTotalReviews = 0;
            const initialTotalRating = 0;

            await setDoc(doc(db, "reviews", userId), {
                reviews: initialReviews,
                totalRating: initialTotalRating,
                totalReviews: initialTotalReviews,
            });

            // Close the modal after successful submission
            setMemberModal(false);
            setFormData({
                email: "",
                password: "",
                serviceName: "",
                avatar: null,
                bio: "",
            });

            // Show success toast
            toast.success(isEditing ? "Service provider updated successfully!" : "Service provider added successfully!");
        } catch (error) {
            console.error("Error creating user or storing service details:", error);
            toast.error("Error adding/updating service provider.");
        }
    };

    // Handle edit button click
    const handleEditClick = (serviceId) => {
        const service = servicesList.find((service) => service.id === serviceId);
        setFormData({
            email: service.email,
            password: "",  // Password should not be populated for editing
            serviceName: service.serviceName,
            avatar: null,  // Avatar will remain unchanged unless a new one is uploaded
            bio: service.bio,
        });
        setCurrentServiceId(serviceId);
        setIsEditing(true);
        setMemberModal(true);
    };

    // Handle delete button click
    const handleDeleteClick = async (serviceId) => {
        try {
            // Delete the service from Firestore
            await deleteDoc(doc(db, "services", serviceId));
            await deleteDoc(doc(db, "reviews", serviceId));

            // Remove the service from the list to update the UI
            setServicesList((prevList) => prevList.filter((service) => service.id !== serviceId));

            // Show success toast
            toast.success("Service provider deleted successfully!");
        } catch (error) {
            console.error("Error deleting service:", error);
            toast.error("Error deleting service provider.");
        }
    };

    return (
        <div className={styles.container}>
            <Sidebar user={user} />
            <div className={styles.containerBox}>
                <div className={styles.header}>Service Providers</div>
                <div className={styles.manageUsers}>
                    <div className={styles.addUserButton} onClick={() => setMemberModal(true)}>Add New Member</div>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Service Name</th>
                            <th>Email</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {servicesList.map((service) => (
                            <tr key={service.id}>
                                <td>{service.serviceName}</td>
                                <td>{service.email}</td>
                                <td className={styles.actions}>
                                    <button
                                        className={styles.editButton}
                                        onClick={() => handleEditClick(service.id)}
                                    >
                                        Edit
                                    </button>
                                    <button
                                        className={styles.deleteButton}
                                        onClick={() => handleDeleteClick(service.id)}
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {memberModal && (
                <div className={styles.memberModal}>
                    <div className={styles.memberModalContent}>
                        <i className="fa-solid fa-xmark" onClick={() => setMemberModal(false)}></i>
                        <h2>{isEditing ? "Edit Member" : "Add New Member"}</h2>
                        <form onSubmit={handleSubmit}>
                            <h3>Account Details</h3>
                            <label htmlFor="email">Email:</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                required
                            />
                            {!isEditing && (
                                <>
                                    <label htmlFor="password">Password:</label>
                                    <input
                                        type="password"
                                        id="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </>
                            )}
                            <h3>Service Details</h3>
                            <label htmlFor="serviceName">Service Name</label>
                            <input
                                type="text"
                                id="serviceName"
                                name="serviceName"
                                value={formData.serviceName}
                                onChange={handleInputChange}
                                required
                            />
                            <label htmlFor="avatar">Upload Avatar:</label>
                            <input
                                type="file"
                                id="avatar"
                                name="avatar"
                                onChange={handleInputChange}
                            />
                            <label htmlFor="bio">Bio</label>
                            <input
                                type="text"
                                id="bio"
                                name="bio"
                                value={formData.bio}
                                onChange={handleInputChange}
                            />
                            <button type="submit">{isEditing ? "Update Member" : "Add Member"}</button>
                        </form>
                    </div>
                </div>
            )}

            {/* Toast container */}
            <ToastContainer />
        </div>
    );
}

export default Services;
