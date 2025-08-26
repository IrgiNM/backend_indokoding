import type { NextApiRequest, NextApiResponse } from "next";
import { collection, getDocs, doc, getDoc, DocumentData } from "firebase/firestore";
import { db } from "../../lib/firebase";
import NextCors from "nextjs-cors";

// Response type
interface Requirement {
  id: string;
  [key: string]: any;
}

function convertTimestamps(data: DocumentData): Record<string, any> {
  const result: Record<string, any> = {};
  for (const key in data) {
    const value = data[key];
    if (value && typeof value === "object" && "seconds" in value && "nanoseconds" in value) {
      // 🔹 convert Timestamp ke string ISO
      result[key] = new Date(value.seconds * 1000).toISOString();
    } else {
      result[key] = value;
    }
  }
  return result;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await NextCors(req, res, {
    methods: ["GET", "OPTIONS"],
    origin: "*",
    optionsSuccessStatus: 200,
  });

  try {
    if (req.method === "GET") {
      const { id } = req.query;

      // 🔹 Ambil Requirement berdasarkan ID
      if (id) {
        const docRef = doc(db, "Requirements_Career", id as string);
        const snap = await getDoc(docRef);

        if (!snap.exists()) {
          return res.status(404).json({ error: "Requirement tidak ditemukan" });
        }

        const Requirement: Requirement = {
          id: snap.id,
          ...convertTimestamps(snap.data()!),
        };

        return res.status(200).json(Requirement);
      }

      // 🔹 Ambil semua data Requirements
      const snap = await getDocs(collection(db, "Requirements_Career"));
      const Requirements: Requirement[] = snap.docs.map(doc => ({
        id: doc.id,
        ...convertTimestamps(doc.data()),
      }));

      return res.status(200).json(Requirements);
    }

    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} tidak diizinkan`);
  } catch (error) {
    console.error("Error fetching Requirements:", error);
    return res.status(500).json({ error: "Terjadi kesalahan server" });
  }
}
