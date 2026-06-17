import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';



export async function GET(request) {
    try {
        
        
        const { searchParams } = new URL(request.url);
        const orgId = searchParams.get('orgId');

        let query = { status: 'Open' };
        if (orgId) {
            query.organizationId = orgId;
        }

        // Fetch Open Jobs and populate organization to get LinkedIn Company ID
        const jobs = await prisma.jobRequisition.findMany({ where: query })
            
            ;
        
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        
        const generateXML = (jobsList) => {
            let xml = `<?xml version="1.0" encoding="utf-8"?>\n`;
            xml += `<source>\n`;
            xml += `  <publisher>NewHRPAYROLL Master Ecosystem</publisher>\n`;
            xml += `  <publisherurl>${baseUrl}</publisherurl>\n`;
            xml += `  <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>\n`;
            
            jobsList.forEach(job => {
                const org = job.organizationId || {};
                const linkedinId = org.linkedinCompanyId || '';
                
                xml += `  <job>\n`;
                xml += `    <title><![CDATA[${job.title}]]></title>\n`;
                xml += `    <date><![CDATA[${new Date(job.createdAt).toUTCString()}]]></date>\n`;
                xml += `    <referencenumber><![CDATA[${job._id}]]></referencenumber>\n`;
                xml += `    <url><![CDATA[${baseUrl}/careers?jobId=${job._id}${orgId ? `&orgId=${orgId}` : ''}]]></url>\n`;
                xml += `    <company><![CDATA[${org.name || 'Xpertance'}]]></company>\n`;
                
                if (linkedinId) {
                    xml += `    <linkedin_company_id>${linkedinId}</linkedin_company_id>\n`;
                }

                const locationParts = job.location.split(',').map(s => s.trim());
                xml += `    <city><![CDATA[${locationParts[0] || job.location}]]></city>\n`;
                xml += `    <country><![CDATA[IN]]></country>\n`;
                
                // LinkedIn Workplace Tagging
                let workplaceTag = '';
                if (job.workplaceType === 'Remote') workplaceTag = '#LI-remote';
                else if (job.workplaceType === 'Hybrid') workplaceTag = '#LI-hybrid';
                else workplaceTag = '#LI-onsite';

                let descriptionBody = `<h3>Job Description</h3><p>${job.description.replace(/\n/g, '<br/>')}</p>`;
                if (job.requirements && job.requirements.length > 0) {
                    descriptionBody += `<h3>Requirements</h3><ul>`;
                    job.requirements.forEach(req => descriptionBody += `<li>${req}</li>`);
                    descriptionBody += `</ul>`;
                }
                
                // Append workplace tag for LinkedIn categorization
                descriptionBody += `<p>${workplaceTag}</p>`;
                
                xml += `    <description><![CDATA[${descriptionBody}]]></description>\n`;
                
                const normalizedType = job.type === 'Full-time' ? 'fulltime' : job.type === 'Part-time' ? 'parttime' : 'contract';
                xml += `    <jobtype><![CDATA[${normalizedType}]]></jobtype>\n`;
                
                if (job.salaryRange && job.salaryRange.min) {
                    xml += `    <salary><![CDATA[${job.salaryRange.min} - ${job.salaryRange.max || job.salaryRange.min}]]></salary>\n`;
                }
                xml += `  </job>\n`;
            });
            xml += `</source>`;
            return xml;
        };

        const feedXML = generateXML(jobs);

        return new NextResponse(feedXML, {
            status: 200,
            headers: {
                'Content-Type': 'application/xml; charset=utf-8',
                'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400'
            }
        });

    } catch (error) {
        console.error("XML FEED GENERATION ERROR:", error);
        return new NextResponse('Internal Error Creating Feed', { status: 500 });
    }
}
