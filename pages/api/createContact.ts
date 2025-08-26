import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "../../lib/firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  updateDoc,
} from "firebase/firestore";

interface ContactData {
  username: string;
  email: string;
  subject: string;
  message: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method === "POST") {
    try {
      const { username, email, subject, message }: ContactData = req.body;

      if (!username || !email || !subject || !message) {
        return res.status(400).json({ error: "All fields are required" });
      }

      const usersRef = collection(db, "users");

      // 🔍 Cek apakah email ada
      const emailQuery = query(usersRef, where("email", "==", email));
      const emailSnap = await getDocs(emailQuery);

      if (emailSnap.empty) {
        return res.status(404).json({ error: "Email not found" });
      }

      // 🔍 Cek apakah username & email ada di dokumen yang sama
      const userQuery = query(
        usersRef,
        where("email", "==", email)
      );
      const querySnapshot = await getDocs(userQuery);

      if (querySnapshot.empty) {
        return res
          .status(400)
          .json({ error: "Username and email do not match" });
      }

      // ✅ Ambil user pertama yang cocok
      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();

      // Update total_contact
      const newTotalContact = (userData.total_contact || 0) + 1;
      await updateDoc(userDoc.ref, { total_contact: newTotalContact });

      // Tambah data ke contacts
      const contactsRef = collection(db, "contacts");
      await addDoc(contactsRef, {
        userId: userDoc.id,
        dibaca_oleh: [],
        username,
        email,
        subject,
        message,
        createdAt: serverTimestamp(),
      });

      return res.status(200).json({
        message: "Contact message sent successfully",
        user: {
          id: userDoc.id,
          username: userData.username,
          email: userData.email,
        },
        contactCount: newTotalContact,
      });
    } catch (error) {
      console.error("Error processing contact:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  } else {
    res.setHeader("Allow", ["POST", "OPTIONS"]);
    res.status(405).end(`Method ${req.method} not allowed`);
  }
}
