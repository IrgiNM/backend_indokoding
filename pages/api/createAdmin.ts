import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "../../lib/firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
} from "firebase/firestore";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const SECRET_KEY = process.env.JWT_SECRET || "rahasia-super-aman";

interface UserData {
  update: boolean;
  id?: string;
  username: string;
  email: string;
  password?: string;
  confirm_password?: string;
  role: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // ✅ Allow CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST", "OPTIONS"]);
    return res.status(405).json({ error: `Method ${req.method} tidak diizinkan` });
  }

  try {
    const {
      update,
      id,
      username,
      email,
      password,
      confirm_password,
      role,
    }: UserData = req.body;

    // ✅ Validasi input dasar
    if (!username || !email) {
      return res.status(400).json({ error: "Username dan email wajib diisi" });
    }

    // ✅ Validasi role
    const allowedRoles = ["admin", "user"];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ error: "Role tidak valid" });
    }

    // ✅ Jika UPDATE data admin
    if (update) {
      if (!id) {
        return res.status(400).json({ error: "ID wajib disertakan untuk update" });
      }

      // 🔍 Cek duplikasi username pada akun lain
      const qUsername = query(collection(db, "users"), where("username", "==", username));
      const snapUsername = await getDocs(qUsername);

      if (!snapUsername.empty && snapUsername.docs[0].id !== id) {
        return res.status(400).json({ error: "Username sudah dipakai akun lain" });
      }

      // 🔍 Cek duplikasi email pada akun lain
      const qEmail = query(collection(db, "users"), where("email", "==", email));
      const snapEmail = await getDocs(qEmail);

      if (!snapEmail.empty && snapEmail.docs[0].id !== id) {
        return res.status(400).json({ error: "Email sudah dipakai akun lain" });
      }

      // ✅ Siapkan data update
      const updateData: any = {
        username,
        email,
        updatedAt: serverTimestamp(),
      };

      // 🔑 Jika password diisi → validasi + hash
      if (password) {
        if (password !== confirm_password) {
          return res.status(400).json({ error: "Password dan konfirmasi password tidak sama" });
        }
        updateData.password = await bcrypt.hash(password, 10);
      }

      // ✅ Update Firestore
      const docRef = doc(db, "users", id);
      await updateDoc(docRef, updateData);

      return res.status(200).json({
        message: "Admin berhasil diupdate",
        id,
        username,
        email,
      });
    }

    // ✅ Jika CREATE admin baru
    // 🔍 Pastikan username belum terdaftar
    const qUser = query(collection(db, "users"), where("username", "==", username));
    const snapUser = await getDocs(qUser);
    if (!snapUser.empty) {
      return res.status(400).json({ error: "Username sudah terdaftar" });
    }

    // 🔍 Pastikan email belum terdaftar
    const qEmail = query(collection(db, "users"), where("email", "==", email));
    const snapEmail = await getDocs(qEmail);
    if (!snapEmail.empty) {
      return res.status(400).json({ error: "Email sudah terdaftar" });
    }

    // 🔑 Validasi password wajib diisi saat CREATE
    if (!password || !confirm_password) {
      return res.status(400).json({ error: "Password dan konfirmasi password wajib diisi" });
    }
    if (password !== confirm_password) {
      return res.status(400).json({ error: "Password dan konfirmasi password tidak sama" });
    }

    // ✅ Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ Simpan ke Firestore
    const docRef = await addDoc(collection(db, "users"), {
      username,
      email,
      password: hashedPassword,
      role,
      createdAt: serverTimestamp(),
    });

    // ✅ Buat JWT
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
    console.error("Error di Create/Update Admin:", error);
    return res.status(500).json({ error: "Terjadi kesalahan server" });
  }
}
