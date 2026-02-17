"use server"
import sql from './db';

export async function saveClients(data: any[]) {
  try {
    for (const item of data) {
      await sql`
        INSERT INTO clients (calling_name, mobile_number, car_name)
        VALUES (${item["first name"]}, ${item.phone}, ${item.car})
      `;
    }
    return { success: true };
  } catch (error) {
    console.error("Database Error:", error);
    return { success: false };
  }
}