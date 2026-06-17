import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getAuthUser } from '@/lib/auth-util';
import cloudinary from '@/lib/cloudinary';

export async function POST(request) {
    try {
        
        const authUser = await getAuthUser();
        if (!authUser) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get('file');

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        // Check if Cloudinary is fully configured. If not, we will inform the frontend to fallback to base64.
        if (!process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_SECRET) {
            return NextResponse.json({ 
                error: "Cloudinary credentials missing",
                fallbackToBase64: true 
            }, { status: 200 });
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const uploadResult = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                { 
                    folder: "finance/receipts",
                    resource_type: "auto",
                    public_id: `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_').split('.')[0]}`
                },
                (error, result) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(result);
                    }
                }
            );
            stream.end(buffer);
        });

        return NextResponse.json({ 
            success: true, 
            secure_url: uploadResult.secure_url 
        }, { status: 200 });

    } catch (error) {
        console.error("RECEIPT UPLOAD ERROR:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
