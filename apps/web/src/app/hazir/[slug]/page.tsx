import{PickupBoard}from"@/components/pickup-board";export default async function Page({params}:{params:Promise<{slug:string}>}){return<PickupBoard slug={(await params).slug}/>}
