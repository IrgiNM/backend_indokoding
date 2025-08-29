import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "../../lib/firebase";
import {
  collection,
  getDocs,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";

interface CareerData {
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
      const { email }: CareerData = req.body;

      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      // Ambil semua dokumen di collection Careers
      const careersRef = collection(db, "career_message");
      const snapshot = await getDocs(careersRef);

      if (snapshot.empty) {
        return res.status(404).json({ error: "No Careers found" });
      }

      // Update semua dokumen
      const updatePromises = snapshot.docs.map(async (docSnap) => {
        await updateDoc(docSnap.ref, {
          dibaca_oleh: arrayUnion(email),
        });
      });

      await Promise.all(updatePromises);

      return res.status(200).json({
        message: "Semua data Careers berhasil diperbarui",
      });
    } catch (error) {
      console.error("Error processing Careers:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  } else {
    res.setHeader("Allow", ["POST", "OPTIONS"]);
    res.status(405).end(`Method ${req.method} not allowed`);
  }
}
