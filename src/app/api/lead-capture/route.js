import { NextResponse } from "next/server";

export async function POST(req) {
  const reqId = Math.random().toString(36).substring(7);
  const timestamp = new Date().toISOString();

  try {
    const body = await req.json();
    const { name, email, phone, companyName, employeeCount, message } = body;
    const product = "Innonsh WorkGrid";

    console.log(`[${timestamp}] [reqId: ${reqId}] Lead received. Company: ${companyName}, Email: ${email}, Product: ${product}`);

    // Input validation
    if (!name || !email || !phone || !companyName || !employeeCount || !message) {
      console.warn(`[${timestamp}] [reqId: ${reqId}] Validation failure. Missing fields.`);
      return NextResponse.json(
        { success: false, message: "All form fields are required" },
        { status: 400 }
      );
    }

    const crmUrl = process.env.CRM_API_URL || "http://127.0.0.1:3000";
    const apiKey = process.env.WEBSITE_API_KEY || "innonsh_sec_v9x82jf398dlk29ds";

    // Forward to CRM
    try {
      console.log(`[${timestamp}] [reqId: ${reqId}] CRM request started. Forwarding to ${crmUrl}/api/leads/website`);
      const crmResponse = await fetch(`${crmUrl}/api/leads/website`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          service: "WorkGrid Demo Request",
          companyName,
          name,
          email,
          phone,
          message,
          interestedProduct: "Innonsh WorkGrid",
          employeeCount
        })
      });

      const responseText = await crmResponse.text();
      let crmData;
      try {
        crmData = JSON.parse(responseText);
      } catch (e) {
        console.error("CRM Response is not JSON:", responseText);
        crmData = { success: false, message: "Invalid CRM Response" };
      }

      console.log(`[${timestamp}] [reqId: ${reqId}] CRM response received. Status: ${crmResponse.status}`);

      if (!crmResponse.ok || !crmData.success) {
        console.error(`[${timestamp}] [reqId: ${reqId}] CRM response failed or Database insert failed. CRM Data:`, crmData);
        
        return NextResponse.json(
          { success: false, message: "We couldn't submit your request right now. Please try again in a few minutes." },
          { status: crmResponse.status || 500 }
        );
      }
      
      console.log(`[${timestamp}] [reqId: ${reqId}] Successfully sent to CRM! Lead DB inserted.`);
      return NextResponse.json({
        success: true,
        message: "Your demo request has been received."
      });

    } catch (crmError) {
      console.error(`[${timestamp}] [reqId: ${reqId}] Network failure. Failed to reach CRM API:`, crmError);
      
      return NextResponse.json(
        { success: false, message: "We couldn't submit your request right now. Please try again in a few minutes." },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error(`[${timestamp}] [reqId: ${reqId}] Lead capture critical error:`, error);
    return NextResponse.json(
      { success: false, message: "Internal server error occurred." },
      { status: 500 }
    );
  }
}

