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

const SECRET_KEY = "rahasia-super-aman";

interface UserData {
  username: string;
  email: string;
  role: string;
  total_contact?: number;
  total_join?: number;
  total_career?: number;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
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
        role,
        total_contact,
        total_join,
        total_career,
      }: UserData = req.body;

      if (!username || !email) {
        return res
          .status(400)
          .json({ error: "Username dan email wajib diisi" });
      }

      const qEmail = query(collection(db, "users"), where("email", "==", email), where("role", "==", 'guest'));
      const snapEmail = await getDocs(qEmail);

      // if (!snapEmail.empty) {
      //   return res.status(400).json({ error: "Email sudah dipakai akun lain" });
      // }
      
      if (snapEmail.empty) {
        const docRef = await addDoc(collection(db, "users"), {
          username,
          email,
          role,
          total_contact: total_contact || 0,
          total_join: total_join || 0,
          total_career: total_career || 0,
          createdAt: serverTimestamp()
        });
      }

      const token = jwt.sign( 
        {
          username,         
          email,
          role,       
        },                  
        SECRET_KEY,         
        { expiresIn: "1h" }
      );

      return res
        .status(200)
        .json({ 
          message: "User berhasil disimpan",
          username,         
          email,
          role,
          token
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Terjadi kesalahan server" });
    }
  } else {
    res.setHeader("Allow", ["POST", "OPTIONS"]);
    res.status(405).end(`Method ${req.method} tidak diizinkan`);
  }
}

