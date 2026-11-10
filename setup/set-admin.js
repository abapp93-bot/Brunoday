"use strict";
const {initializeApp}=require("firebase-admin/app");
const {getAuth}=require("firebase-admin/auth");
const uid=process.argv[2];
if(!uid)throw new Error("Usage: npm run admin -- FIREBASE_AUTH_UID");
initializeApp();
getAuth().setCustomUserClaims(uid,{admin:true}).then(()=>console.log("Admin claim assigned; sign out and back in on the dashboard."))
.catch(e=>{console.error(e);process.exitCode=1});
