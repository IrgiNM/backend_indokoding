import type { NextApiRequest, NextApiResponse } from "next";
import { doc, deleteDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import NextCors from "nextjs-cors";
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";

interface CareerData {
  id: string;
  email: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 🔹 Aktifkan CORS
  await NextCors(req, res, {
    methods: ["DELETE", "OPTIONS"],
    origin: "*", // bisa disesuaikan
    optionsSuccessStatus: 200,
  });

  if (req.method !== "DELETE") {
    res.setHeader("Allow", ["DELETE"]);
    return res.status(405).end(`Method ${req.method} tidak diizinkan`);
  }

  try {
    const { id, email, }: CareerData = req.body;

    if (!id || !email) {
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

    // ✅ Ambil user pertama yang cocok
    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data();

    // Update total_Career
    const newTotalCareer = (userData.total_career || 0) - 1;
    await updateDoc(userDoc.ref, { total_career: newTotalCareer });

    // Referensi ke dokumen user
    const userRef = doc(db, "career_message", id);

    // Hapus dokumen
    await deleteDoc(userRef);

    return res.status(200).json({
      message: `Career message dengan id ${id} berhasil dihapus`,
    });
  } catch (error) {
    console.error("Error hapus user:", error);
    return res.status(500).json({ error: "Terjadi kesalahan server" });
  }
}
