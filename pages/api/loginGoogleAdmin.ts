import type { NextApiRequest, NextApiResponse } from "next";
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "../../lib/firebase";
import NextCors from "nextjs-cors";

const SECRET_KEY = process.env.JWT_SECRET || "rahasia-super-aman";

interface LoginRequestBody {
  username: string;
  email: string;
  role: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 🔹 Tambahin CORS
  await NextCors(req, res, {
    methods: ["GET", "POST", "OPTIONS"],
    origin: "*", // bisa diganti spesifik misalnya "http://localhost:3000"
    optionsSuccessStatus: 200,
  });

  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} tidak diizinkan`);
  }

  try {
    const { username, email, role }: LoginRequestBody = req.body;

    if (!username || !email || !role) {
      return res.status(400).json({ error: "Username, email, dan role wajib diisi" });
    }

    // Query berdasarkan email
    const q2 = query(
      collection(db, "users"),
      where("email", "==", email),
      where("role", "==", role)
    );

    const [snap1] = await Promise.all([getDocs(q2)]);

    let userDoc = snap1.docs[0];
    if (!userDoc) {
      return res.status(401).json({ error: "Username/email atau role tidak ditemukan" });
    }

    const userData = userDoc.data();
    const userRef = doc(db, "users", userDoc.id);

    // Buat token
    const token = jwt.sign(
      { id: userDoc.id, username: userData.username, role: userData.role },
      SECRET_KEY,
      { expiresIn: "1h" }
    );

    return res.status(200).json({
      message: "Login berhasil",
      token,
      username: userData.username,
      email: userData.email,
      role: userData.role,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Terjadi kesalahan server" });
  }
}