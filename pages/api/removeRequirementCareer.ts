import {
    collection, deleteDoc, getDocs, query,
    where, doc
} from "firebase/firestore";
import type { NextApiRequest, NextApiResponse } from "next";
import NextCors from "nextjs-cors";
import { db } from "../../lib/firebase";

interface ContactData {
  title: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 🔹 Aktifkan CORS
  await NextCors(req, res, {
    methods: ["DELETE", "OPTIONS"],
    origin: "*",
    optionsSuccessStatus: 200,
  });

  if (req.method !== "DELETE") {
    res.setHeader("Allow", ["DELETE"]);
    return res.status(405).end(`Method ${req.method} tidak diizinkan`);
  }

  try {
    const { title }: ContactData = req.body;

    if (!title) {
      return res.status(400).json({ error: "Title harus diisi" });
    }

    const usersRef = collection(db, "Requirements_Career");
    
    // 🔍 Cek apakah requirement ada
    const requireQuery = query(usersRef, where("title", "==", title));
    const requireSnap = await getDocs(requireQuery);
    
    if (requireSnap.empty) {
      return res.status(404).json({ error: "Requirement tidak ditemukan" });
    }

    // 🚨 Handle multiple documents dengan title yang sama
    if (requireSnap.size > 1) {
      console.warn(`Ditemukan ${requireSnap.size} requirements dengan title yang sama: ${title}`);
    }

    // ✅ Hapus semua documents yang cocok
    const deletePromises = requireSnap.docs.map(async (document) => {
      const docRef = doc(db, "Requirements_Career", document.id);
      await deleteDoc(docRef);
    });

    await Promise.all(deletePromises);

    return res.status(200).json({
      message: `Requirements Career dengan title "${title}" berhasil dihapus`,
      deletedCount: requireSnap.size
    });

  } catch (error) {
    console.error("Error menghapus requirement:", error);
    return res.status(500).json({ 
      error: "Terjadi kesalahan server",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
}