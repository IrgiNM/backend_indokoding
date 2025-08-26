import type { NextApiRequest, NextApiResponse } from "next";
import { doc, deleteDoc, writeBatch } from "firebase/firestore";
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

interface ContactData {
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
    // Contoh: hapus hanya messages yang sudah dibaca
    const contactsQuery = query(
        collection(db, "contacts"),
        where("dibaca_oleh", "!=", [])
    );
    
    const snapshot = await getDocs(contactsQuery);

    // Gunakan batch untuk menghapus lebih efisien
    const batch = writeBatch(db);
    snapshot.docs.forEach(docSnap => {
        batch.delete(docSnap.ref);
    });

    await batch.commit();

    return res.status(200).json({
        message: `${snapshot.size} messages berhasil dihapus`,
        deletedCount: snapshot.size
    });
  } catch (error) {
    console.error("Error hapus semua message:", error);
    return res.status(500).json({ error: "Terjadi kesalahan server" });
  }
}
