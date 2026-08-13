"use client";

import { useEffect } from "react";
import { insertProducts } from "@/lib/insertProducts";


export default function InsertProducts(){

  useEffect(()=>{

    insertProducts();

  },[]);


  return null;

}