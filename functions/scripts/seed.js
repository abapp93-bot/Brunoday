"use strict";
// Run locally with GOOGLE_APPLICATION_CREDENTIALS pointing to a service-account file
// and GOOGLE_CLOUD_PROJECT set. Input file MUST NOT be committed.
const fs=require("node:fs");
const {initializeApp}=require("firebase-admin/app");
const {getFirestore}=require("firebase-admin/firestore");
const input=process.argv[2];
if(!input)throw new Error("Usage: npm run seed -- ./path/private-participants.json");
const data=JSON.parse(fs.readFileSync(input,"utf8"));
if(!Array.isArray(data)||data.length!==22)throw new Error("22 participants are required.");
const ids=new Set();
for(const item of data){
 if(!/^BD-0(0[1-9]|1[0-9]|2[0-2])$/.test(item.card)||typeof item.name!=="string"||!item.name.trim()||ids.has(item.card))
 throw new Error("Invalid participant or duplicate: "+JSON.stringify(item));
 ids.add(item.card);
}
initializeApp();
const db=getFirestore();
(async()=>{
 const existing=await db.collection("advent_cards_2026").limit(1).get();
 if(!existing.empty)throw new Error("Refusing to overwrite existing participants or bookings.");
 const batch=db.batch();
 for(const p of data)batch.create(db.collection("advent_cards_2026").doc(p.card),{name:p.name.trim(),day:null});
 await batch.commit();
 console.log("Seeded 22 cards (no bookings).");
})().catch(e=>{console.error(e);process.exitCode=1});
