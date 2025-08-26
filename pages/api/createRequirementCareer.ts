import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "../../lib/firebase";
import { collection, addDoc, serverTimestamp, query, where, getDocs, deleteDoc, doc, updateDoc } from "firebase/firestore";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const SECRET_KEY = "rahasia-super-aman";

interface RequirementData {
    title: string,
    description: string,
    list: string[],
    update: boolean
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
        title,
        description,
        list,
        update
      }: RequirementData = req.body;

      // Validasi input dasar
      if (!title || !description || !list || list.length === 0) {
        return res.status(400).json({ error: "title, description, dan list wajib diisi" });
      }

      // Cek duplikasi Requirementname/email
      const qRequirement = query(collection(db, "Requirements_Career"), where("title", "==", title));
      const [snapRequirement] = await Promise.all([getDocs(qRequirement)]);

      if (!snapRequirement.empty) {
        if(update === true){
            const docId = snapRequirement.docs[0].id;
            // Update dokumen di Firestore
            const docRef = doc(db, "Requirements_Career", docId);
            await updateDoc(docRef, {
            title,
            description,
            list,
            updatedAt: serverTimestamp(), // pakai updatedAt biar jelas kapan terakhir update
            });

            return res.status(200).json({
            message: "Requirements Career berhasil diupdate",
            id: docId,
            title,
            description,
            list,
            });
        }else if(update === false){
            return res.status(400).json({ error: "Requirement sudah terdaftar" });
        }
        
      }else{
        // Simpan ke Firestore
        const docRef = await addDoc(collection(db, "Requirements_Career"), {
          title,
          description,
          list,
          createdAt: serverTimestamp(),
        });
  
        return res.status(200).json({
          message: "Requirements Career berhasil dibuat",
          id: docRef.id,
          title,
          description,
          list,
        });
      }
    } catch (error) {
      console.error("Error di CreateRequirementsCareer:", error);
      return res.status(500).json({ error: "Terjadi kesalahan server" });
    }
  } else {
    res.setHeader("Allow", ["POST", "OPTIONS"]);
    return res.status(405).end(`Method ${req.method} tidak diizinkan`);
  }
}
