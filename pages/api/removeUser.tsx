import type { NextApiRequest, NextApiResponse } from "next";
import { doc, deleteDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import NextCors from "nextjs-cors";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 🔹 Aktifkan CORS
  await NextCors(req, res, {
    methods: ["DELETE", "OPTIONS"],
    origin: "*", // bisa disesuaikan
    optionsSuccessStatus: 200,
  });

  if (req.method !== "DELETE") {
    res.setHeader("Allow", ["DELETE"]);
    return res.status(405).end(`Method ${req.method} tidak diizinkan`);
  }

  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ error: "ID user wajib diisi" });
    }

    // Referensi ke dokumen user
    const userRef = doc(db, "users", id);

    // Hapus dokumen
    await deleteDoc(userRef);

    return res.status(200).json({
      message: `User dengan id ${id} berhasil dihapus`,
    });
  } catch (error) {
    console.error("Error hapus user:", error);
    return res.status(500).json({ error: "Terjadi kesalahan server" });
  }
}
