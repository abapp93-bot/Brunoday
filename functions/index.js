"use strict";
const {onCall, HttpsError} = require("firebase-functions/v2/https");
const {initializeApp} = require("firebase-admin/app");
const {getFirestore, FieldValue} = require("firebase-admin/firestore");
initializeApp();
const db=getFirestore();
const REGION="europe-west1";
const ZONE="Europe/Rome";
const START="2026-11-15";
const LAST_BOOKING="2026-11-30";
function todayRome(){
  const parts=new Intl.DateTimeFormat("en-GB",{timeZone:ZONE,year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date());
  const p=Object.fromEntries(parts.filter(x=>x.type!=="literal").map(x=>[x.type,x.value]));
  return p.year+"-"+p.month+"-"+p.day;
}
function validateCard(raw){
  const card=String(raw||"").trim().toUpperCase();
  if(!/^BD-0(0[1-9]|1[0-9]|2[0-2])$/.test(card)){
    throw new HttpsError("invalid-argument","Numero tessera non valido.");
  }
  return card;
}
function validateDay(raw){
  const day=Number(raw);
  if(!Number.isInteger(day)||day<3||day>24){
    throw new HttpsError("invalid-argument","Giorno non valido.");
  }
  return day;
}
function checkAnonymousAuth(request){
  if(!request.auth)throw new HttpsError("unauthenticated","Accesso temporaneo necessario.");
}
function isRevealed(day,today){return today>="2026-12-"+String(day).padStart(2,"0");}
exports.calendarState=onCall({region:REGION,maxInstances:4},async(request)=>{
  checkAnonymousAuth(request);
  const snap=await db.collection("advent_slots_2026").get();
  const today=todayRome();
  const reserved=snap.docs.map(d=>{
    const val=d.data(),day=Number(d.id);
    return {
      day,
      reserved:true,
      ...(isRevealed(day,today)?{recipientName:String(val.name||"")}:{}),
    };
  }).filter(x=>x.day>=3&&x.day<=24).sort((a,b)=>a.day-b.day);
  return {date:today,slots:reserved};
});
exports.myReservation=onCall({region:REGION,maxInstances:4},async(request)=>{
  checkAnonymousAuth(request);
  const card=validateCard(request.data?.card);
  const doc=await db.collection("advent_cards_2026").doc(card).get();
  if(!doc.exists)throw new HttpsError("not-found","Tessera non riconosciuta.");
  const data=doc.data();
  return {name:data.name,day:data.day||null};
});
exports.reserveDay=onCall({region:REGION,maxInstances:4},async(request)=>{
  checkAnonymousAuth(request);
  const card=validateCard(request.data?.card);
  const day=validateDay(request.data?.day);
  const now=todayRome();
  if(now<START||now>LAST_BOOKING)throw new HttpsError("failed-precondition","Prenotazioni non aperte.");
  const cardRef=db.collection("advent_cards_2026").doc(card);
  const slotRef=db.collection("advent_slots_2026").doc(String(day));
  return db.runTransaction(async(tx)=>{
    const [person,slot]=await Promise.all([tx.get(cardRef),tx.get(slotRef)]);
    if(!person.exists)throw new HttpsError("not-found","Tessera non riconosciuta.");
    const p=person.data();
    if(p.day!==undefined&&p.day!==null)throw new HttpsError("already-exists","Questa tessera ha già una prenotazione.");
    if(slot.exists)throw new HttpsError("already-exists","Casella già prenotata.");
    tx.update(cardRef,{day,bookedAt:FieldValue.serverTimestamp()});
    tx.create(slotRef,{card,name:p.name,bookedAt:FieldValue.serverTimestamp()});
    return {day,name:p.name};
  });
});
exports.adminOverview=onCall({region:REGION,maxInstances:2},async(request)=>{
  // The admin claim must be granted manually from a trusted local Admin SDK script.
  if(!request.auth?.token?.admin)throw new HttpsError("permission-denied","Solo amministratore.");
  const [cards,slots]=await Promise.all([db.collection("advent_cards_2026").get(),db.collection("advent_slots_2026").get()]);
  return {cards:cards.docs.map(d=>({card:d.id,name:d.data().name,day:d.data().day||null})),
    slots:slots.docs.map(d=>({day:Number(d.id),card:d.data().card,name:d.data().name,
      bookedAt:d.data().bookedAt?.toDate?.()?.toISOString?.()||null}))};
});
