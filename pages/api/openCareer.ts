import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "../../lib/firebase";
import { doc, deleteDoc, getDoc } from "firebase/firestore";

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
      const { id, email, }: CareerData = req.body;

      if (!id || !email) {
        return res.status(400).json({ error: "All fields are required" });
      }

      // Tambah data ke Careers
      const careersRef = doc(db, "career_message", id);
      const messageDoc = await getDoc(careersRef);

      if (!messageDoc.exists()) {
        return res.status(404).json({ error: "message not found" });
      }

      // Menambahkan data ke array tanpa duplikasi
      await updateDoc(messageDoc.ref, {
        dibaca_oleh: arrayUnion(email)
      });

      return res.status(200).json({
        message: "Career berhasil dibuka",
      });
    } catch (error) {
      console.error("Error processing Career:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  } else {
    res.setHeader("Allow", ["POST", "OPTIONS"]);
    res.status(405).end(`Method ${req.method} not allowed`);
  }
}
