import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "../../lib/firebase";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method === "POST") {
    try {
      const { keyword } = req.body;

      if (!keyword || keyword.trim() === "") {
        return res.status(400).json({ error: "Keyword harus diisi" });
      }

      const contactsRef = collection(db, "contacts");
      const searchKeyword = keyword.toLowerCase().trim();

      // Dapatkan semua dokumen (karena Firestore tidak mendukung pencarian case-insensitive native)
      const snapshot = await getDocs(contactsRef);
      
      // Filter data secara manual di sisi server
      const contacts = snapshot.docs
        .map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            subject: data.subject || "", // Pastikan subject ada
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : null,
            // Tambahkan field lain jika diperlukan
            ...data
          };
        })
        .filter((item) => {
          // Cek jika subject ada dan mengandung keyword (case-insensitive)
          return item.subject && item.subject.toLowerCase().includes(searchKeyword);
        });

      return res.status(200).json({ contacts });
    } catch (error) {
      console.error("Error mencari data:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  } else {
    res.setHeader("Allow", ["POST", "OPTIONS"]);
    res.status(405).end(`Method ${req.method} not allowed`);
  }
}