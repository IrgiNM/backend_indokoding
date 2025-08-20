import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "../../lib/firebase";
import { collection, addDoc, serverTimestamp, query, where, getDocs } from "firebase/firestore";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const SECRET_KEY = "rahasia-super-aman";

interface UserData {
  username: string;
  email: string;
  password: string;
  confirm_password?: string;
  level?: string;
  position?: string;
  fired?: string;
  phone?: string;
  sick?: number;
  permission?: number;
  not_reason?: number;
  role_job?: string[];
  role: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method === "POST") {
    try {
      const {
        username,
        email,
        password,
        confirm_password,
        level,
        position,
        fired,
        phone,
        sick,
        permission,
        not_reason,
        role_job,
        role,
      }: UserData = req.body;

      // Validasi input dasar
      if (!username || !email || !password || !confirm_password) {
        return res.status(400).json({ error: "Username, email, password, dan konfirmasi password wajib diisi" });
      }

      if (password !== confirm_password) {
        return res.status(400).json({ error: "Password dan konfirmasi password tidak sama" });
      }

      // Cek duplikasi username/email
      const qUser = query(collection(db, "users"), where("username", "==", username));
      const qEmail = query(collection(db, "users"), where("email", "==", email));
      const [snapUser, snapEmail] = await Promise.all([getDocs(qUser), getDocs(qEmail)]);

      if (!snapUser.empty || !snapEmail.empty) {
        return res.status(400).json({ error: "Username atau email sudah terdaftar" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Simpan ke Firestore
      const docRef = await addDoc(collection(db, "users"), {
        username,
        email,
        password: hashedPassword,
        level: level || "",
        position: position || "",
        fired: fired || "Now",
        phone: phone || "-",
        sick: sick || 0,
        permission: permission || 0,
        not_reason: not_reason || 0,
        role_job: role_job || [],
        role,
        createdAt: serverTimestamp(),
      });

      // Buat JWT
      const token = jwt.sign(
        {
          id: docRef.id,
          username,
          email,
          role,
        },
        SECRET_KEY,
        { expiresIn: "1h" }
      );

      return res.status(200).json({
        message: "Admin berhasil dibuat",
        id: docRef.id,
        username,
        email,
        role,
        token,
      });
    } catch (error) {
      console.error("Error di CreateAdmin:", error);
      return res.status(500).json({ error: "Terjadi kesalahan server" });
    }
  } else {
    res.setHeader("Allow", ["POST", "OPTIONS"]);
    return res.status(405).end(`Method ${req.method} tidak diizinkan`);
  }
}
