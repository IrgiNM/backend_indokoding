import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "../../lib/firebase";
import { doc, deleteDoc, getDoc } from "firebase/firestore";

import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";

interface CareerData {
  id: string;
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
      const { id }: CareerData = req.body;
      if (!id) {
        return res.status(400).json({ error: "ID is required" });
      }

      // Get the career message document
      const careersRef = doc(db, "career_message", id);
      const messageDoc = await getDoc(careersRef);

      if (!messageDoc.exists()) {
        return res.status(404).json({ error: "Message not found" });
      }

      const currentFavorite = messageDoc.data().favorite;
      
      // Toggle the favorite status
      await updateDoc(careersRef, {
        favorite: !currentFavorite
      });

      return res.status(200).json({
        message: `Career successfully ${!currentFavorite ? 'added to' : 'removed from'} favorites`,
        favorite: !currentFavorite
      });
    } catch (error) {
      console.error("Error processing Career:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  } else {
    res.setHeader("Allow", ["POST", "OPTIONS"]);
    res.status(405).end(`Method ${req.method} not allowed`);
  }
}