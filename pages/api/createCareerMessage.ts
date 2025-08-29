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
  name: string;
  email: string;
  from: string;
  phone: string;
  position: string;
  rate: 0,
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
      const { name, from, phone, rate, email, message, position }: ContactData = req.body;

      if (!name || !from || !phone || !rate || !email || !position) {
        return res.status(400).json({ error: "All fields are required" });
      }

      const usersRef = collection(db, "users");

      // 🔍 Cek apakah email ada
      const emailQuery = query(usersRef, where("email", "==", email));
      const emailSnap = await getDocs(emailQuery);

      if (emailSnap.empty) {
        return res.status(404).json({ error: "Email not found" });
      }

      // ✅ Ambil user pertama yang cocok
      const userDoc = emailSnap.docs[0];
      const userData = userDoc.data();

      // Update total_contact
      const newTotalCareer = (userData.total_career || 0) + 1;
      await updateDoc(userDoc.ref, { total_career: newTotalCareer });

      // Tambah data ke contacts
      const contactsRef = collection(db, "career_message");
      await addDoc(contactsRef, {
        userId: userDoc.id,
        dibaca_oleh: [],
        favorite: false,
        position,
        name,
        email,
        rate,
        from,
        phone,
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
        contactCount: newTotalCareer,
      });
    } catch (error) {
      console.error("Error processing career:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  } else {
    res.setHeader("Allow", ["POST", "OPTIONS"]);
    res.status(405).end(`Method ${req.method} not allowed`);
  }
}
