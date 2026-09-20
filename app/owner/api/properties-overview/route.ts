import { createServerClient } from "@supabase/ssr";

import { createClient } from "@supabase/supabase-js";

import { cookies } from "next/headers";

import { NextRequest, NextResponse } from "next/server";



async function getSupabaseServerClient() {

const cookieStore = await cookies();



return createServerClient(

process.env.NEXT_PUBLIC_SUPABASE_URL!,

process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,

{

cookies: {

getAll() {

return cookieStore.getAll();

},

setAll(cookiesToSet) {

try {

cookiesToSet.forEach(({ name, value, options }) =>

cookieStore.set(name, value, options)

);

} catch {}

},

},

}

);

}



async function getAuthenticatedUserAndClient(request: NextRequest) {

// 1. Check for Bearer token in request headers

const authHeader = request.headers.get("authorization");

if (authHeader && authHeader.startsWith("Bearer ")) {

const token = authHeader.split(" ")[1];



const bearerClient = createClient(

process.env.NEXT_PUBLIC_SUPABASE_URL!,

process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,

{

global: {

headers: {

Authorization: `Bearer ${token}`,

},

},

}

);



const { data: { user } } = await bearerClient.auth.getUser(token);

if (user) {

return { user, supabase: bearerClient };

}

}



// 2. Fallback: Cookie-based auth

const serverClient = await getSupabaseServerClient();

const { data: { user } } = await serverClient.auth.getUser();

if (user) {

return { user, supabase: serverClient };

}



return { user: null, supabase: null };

}



export async function GET(request: NextRequest) {

try {

const { user, supabase } = await getAuthenticatedUserAndClient(request);



if (!user || !supabase) {

return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });

}



// 1. Query properties and units

const { data: properties, error: propErr } = await supabase

.from("properties")

.select(`

id,

name,

location,

owner_id,

units (

id,

property_id,

unit_number,

rent_amount,

deposit_fee,

use_type,

vat_treatment,

vat_rate,

garbage_fee,

parking_fee,

water_fee,

is_occupied

)

`)

.eq("owner_id", user.id);



if (propErr) {

console.error("Properties query error:", propErr);

return NextResponse.json({ error: propErr.message }, { status: 500 });

}



if (!properties || properties.length === 0) {

return NextResponse.json({ properties: [] });

}



// 2. Safely fetch invoices in a separate query to prevent join/schema errors

const propertyIds = properties.map((p) => p.id);

let invoices: any[] = [];



try {

const { data: invData, error: invErr } = await supabase

.from("invoices")

.select("id, property_id, status, amount_paid, total_amount, due_date")

.in("property_id", propertyIds);



if (!invErr && invData) {

invoices = invData;

}

} catch (e) {

console.warn("Invoice fetching skipped or not configured:", e);

}



// 3. Format and aggregate calculations

const formattedProperties = properties.map((prop: any) => {

const units = prop.units || [];

const propInvoices = invoices.filter((inv: any) => inv.property_id === prop.id);



const totalUnits = units.length;

const occupiedUnits = units.filter((u: any) => u.is_occupied).length;

const vacantUnits = totalUnits - occupiedUnits;



const financials = propInvoices.reduce(

(acc: any, inv: any) => {

const total = Number(inv.total_amount || 0);

const paid = Number(inv.amount_paid || 0);

const status = inv.status?.toLowerCase();



if (status === "paid") {

acc.paidInvoices += 1;

acc.totalPaidAmount += total;

} else if (status === "overdue") {

acc.overdueInvoices += 1;

acc.totalOverdueAmount += total - paid;

} else if (status === "partial") {

acc.partialPayments += 1;

acc.totalPartialAmount += paid;

} else {

acc.unpaidInvoices += 1;

acc.totalUnpaidAmount += total;

}



return acc;

},

{

paidInvoices: 0,

unpaidInvoices: 0,

overdueInvoices: 0,

partialPayments: 0,

totalPaidAmount: 0,

totalUnpaidAmount: 0,

totalOverdueAmount: 0,

totalPartialAmount: 0,

}

);



return {

propertyId: prop.id,

propertyName: prop.name,

location: prop.location,

totalUnits,

occupiedUnits,

vacantUnits,

units,

financials,

};

});



return NextResponse.json({ properties: formattedProperties });

} catch (err: any) {

console.error("GET properties-overview unhandled error:", err);

return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });

}

}



export async function POST(request: NextRequest) {

try {

const { user, supabase } = await getAuthenticatedUserAndClient(request);



if (!user || !supabase) {

return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });

}



const body = await request.json();

const {

propertyName,

location,

unitNumber,

rentAmount,

depositFee,

useType,

vatTreatment,

vatRate,

garbageFee,

parkingFee,

waterFee,

utilityName,

utilityFee,

} = body;



if (!propertyName || !unitNumber || !rentAmount) {

return NextResponse.json(

{ error: "Property name, unit number, and rent amount are required." },

{ status: 400 }

);

}

let propertyId: string;

const { data: existingProp } = await supabase.from("properties").select("id")

.eq("owner_id", user.id)

.ilike("name", propertyName)

.maybeSingle();



if (existingProp) {

propertyId = existingProp.id;

} else {

const { data: newProp, error: propErr } = await supabase

.from("properties")

.insert({

owner_id: user.id,

name: propertyName,

location: location || "",

})

.select("id")

.single();



if (propErr || !newProp) {

return NextResponse.json(

{ error: propErr?.message || "Failed to create property." },

{ status: 500 }

);

}

propertyId = newProp.id;

}



const { data: savedUnit, error: unitErr } = await supabase.from("units").insert({

property_id: propertyId,

unit_number: unitNumber,

rent_amount: Number(rentAmount),

deposit_fee: Number(depositFee) || 0,

use_type: useType || "residential",

vat_treatment: vatTreatment || "A_EXEMPT",

vat_rate: Number(vatRate) || 0,

garbage_fee: garbageFee === null || garbageFee === undefined ? null : Number(garbageFee),

parking_fee: parkingFee === null || parkingFee === undefined ? null : Number(parkingFee),

water_fee: waterFee === null || waterFee === undefined ? null : Number(waterFee),

is_occupied: false,

}).select("id").single();



if (unitErr) {

return NextResponse.json({ error: unitErr.message }, { status: 500 });

}

if (utilityName && savedUnit) {
	const utilityCode = String(utilityName).trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
	const { data: utilityType, error: utilityTypeError } = await supabase
		.from('property_utility_types')
		.upsert({ property_id: propertyId, name: String(utilityName).trim(), code: utilityCode, default_amount: Number(utilityFee) || 0, created_by: user.id }, { onConflict: 'property_id,code' })
		.select('id').single();
	if (utilityTypeError) return NextResponse.json({ error: utilityTypeError.message }, { status: 500 });
	const { error: chargeError } = await supabase.from('unit_utility_charges').upsert({ unit_id: savedUnit.id, utility_type_id: utilityType.id, amount: Number(utilityFee) || 0 }, { onConflict: 'unit_id,utility_type_id' });
	if (chargeError) return NextResponse.json({ error: chargeError.message }, { status: 500 });
}



return NextResponse.json({ success: true, propertyId });

} catch (err: any) {

return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });

}

}



export async function PUT(request: NextRequest) {

try {

const { user, supabase } = await getAuthenticatedUserAndClient(request);



if (!user || !supabase) {

return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });

}



const body = await request.json();

const {

unitId,

unitNumber,

rentAmount,

depositFee,

useType,

vatTreatment,

vatRate,

garbageFee,

parkingFee,

waterFee,

} = body;



if (!unitId) {

return NextResponse.json({ error: "Unit ID is required for updates." }, { status: 400 });

}



const { data: unit, error: fetchErr } = await supabase

.from("units")

.select("id, properties!inner(owner_id)")

.eq("id", unitId)

.single();



if (fetchErr || !unit) {

return NextResponse.json({ error: "Unit not found or access denied." }, { status: 404 });

}



const { error: updateErr } = await supabase

.from("units")

.update({

unit_number: unitNumber,

rent_amount: Number(rentAmount),

deposit_fee: Number(depositFee) || 0,

use_type: useType || "residential",

vat_treatment: vatTreatment || "A_EXEMPT",

vat_rate: Number(vatRate) || 0,

garbage_fee: garbageFee === null || garbageFee === undefined ? null : Number(garbageFee),

parking_fee: parkingFee === null || parkingFee === undefined ? null : Number(parkingFee),

water_fee: waterFee === null || waterFee === undefined ? null : Number(waterFee),

})

.eq("id", unitId);



if (updateErr) {

return NextResponse.json({ error: updateErr.message }, { status: 500 });

}



return NextResponse.json({ success: true });

} catch (err: any) {

return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });

}

}