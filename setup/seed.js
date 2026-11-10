"use strict";
// Execute only on your own computer with a trusted Google service account.
// Private participants JSON must NEVER be uploaded to the public repository.
const fs=require("node:fs");
const {initializeApp}=require("firebase-admin/app");
const {getFirestore}=require("firebase-admin/firestore");
const input=process.argv[2];
if(!input)throw new Error("Usage: npm run seed -- ./path/to/private-participants.json");
const data=JSON.parse(fs.readFileSync(input,"utf8"));
if(!Array.isArray(data)||data.length!==22)throw new Error("Exactly 22 participants required.");
const ids=new Set();
for(const item of data){
 if(!/^BD-0(0[1-9]|1[0-9]|2[0-2])$/.test(item.card)||typeof item.name!=="string"||!item.name.trim()||ids.has(item.card))
  throw new Error("Invalid entry / duplicate: "+JSON.stringify(item));
 ids.add(item.card);
}
initializeApp();
const db=getFirestore();
(async()=>{
 const [cards,names,slots]=await Promise.all([
  db.collection("advent_cards_2026").limit(1).get(),
  db.collection("advent_names_2026").limit(1).get(),
  db.collection("advent_slots_2026").limit(1).get()
 ]);
 if(!cards.empty||!names.empty||!slots.empty)throw new Error("Refusing to seed nonempty 2026 Advent collections");
 const batch=db.batch();
 for(const p of data){
  batch.create(db.collection("advent_cards_2026").doc(p.card),{day:null});
  batch.create(db.collection("advent_names_2026").doc(p.card),{name:p.name.trim()});
 }
 await batch.commit();
 console.log("Initialized 22 cards plus 22 private names; no reservations.");
})().catch(e=>{console.error(e);process.exitCode=1});
