import type { NextApiRequest, NextApiResponse } from "next";
import { collection, getDocs, doc, getDoc, DocumentData, query, where } from "firebase/firestore";
import { db } from "../../lib/firebase";
import NextCors from "nextjs-cors";

// Response type
interface User {
  id: string;
  username: string;
  email: string;
  password: string;
  confirm_password?: string;
  level?: string;
  position?: string;
  fired?: string;
  phone?: string;
  sick?: number;
  createdAt?: string;
  permission?: number;
  not_reason?: number;
  role_job?: string[];
  role: string;
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

      // 🔹 Ambil user by ID
      if (id) {
        const docRef = doc(db, "users", id as string);
        const snap = await getDoc(docRef);

        if (!snap.exists()) {
          return res.status(404).json({ error: "User tidak ditemukan" });
        }

        const data = convertTimestamps(snap.data()!);
        const user: User = {
          id: snap.id,
          username: data.username || "",
          email: data.email || "",
          password: data.password || "",
          role: data.role || "",
          ...data,
        };

        // 🔹 Hanya izinkan kalau role guest
        if (user.role !== "admin") {
          return res.status(403).json({ error: "User bukan admin" });
        }

        return res.status(200).json(user);
      }

      // 🔹 Ambil semua user dengan role guest
      const q = query(collection(db, "users"), where("role", "==", "admin"));
      const snap = await getDocs(q);

      const users: User[] = snap.docs.map(doc => {
        const data = convertTimestamps(doc.data());
        return {
          id: doc.id,
          username: data.username || "",
          email: data.email || "",
          password: data.password || "",
          role: data.role || "",
          ...data,
        };
      });

      return res.status(200).json(users);
    }

    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} tidak diizinkan`);
  } catch (error) {
    console.error("Error fetching users:", error);
    return res.status(500).json({ error: "Terjadi kesalahan server" });
  }
}
