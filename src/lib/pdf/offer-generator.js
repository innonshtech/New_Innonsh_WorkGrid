import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Generates a professional branded Offer Letter PDF
 * @param {Object} data - Candidate and Job information
 */
export const generateOfferLetter = (data) => {
    try {
        const { 
            candidateName = "Candidate", 
            jobTitle = "Team Member", 
            salary = "As per Discussion", 
            joiningDate = "Immediate", 
            companyName = "Bizmate Technologies",
            hrName = "HR Department"
        } = data;

        const doc = new jsPDF();
        const primaryColor = [79, 70, 229];
        const secondaryColor = [30, 41, 59];

        doc.setFillColor(...primaryColor);
        doc.rect(0, 0, 210, 40, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.setFont("helvetica", "bold");
        doc.text("LETTER OF OFFER", 105, 25, { align: "center" });

        doc.setTextColor(...secondaryColor);
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(`Date: ${new Date().toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata' })}`, 170, 50);

        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("To,", 20, 70);
        doc.text(String(candidateName).toUpperCase(), 20, 78);
        doc.setFont("helvetica", "normal");
        doc.text("Candidate for Employment", 20, 85);

        doc.setFontSize(11);
        doc.text(`Dear ${candidateName},`, 20, 105);
        const intro = `We are delighted to offer you the position of ${jobTitle} at ${companyName}.`;
        doc.text(doc.splitTextToSize(intro, 170), 20, 115);

        // Explicitly check for autoTable
        let finalY = 135;
        try {
            if (typeof doc.autoTable === 'function') {
                doc.autoTable({
                    startY: 135,
                    head: [['Component', 'Details']],
                    body: [
                        ['Position', jobTitle],
                        ['Organization', companyName],
                        ['Annual CTC', salary],
                        ['Joining Date', joiningDate]
                    ],
                    theme: 'striped',
                    headStyles: { fillColor: primaryColor }
                });
                finalY = doc.lastAutoTable.finalY + 15;
            } else if (typeof autoTable === 'function') {
                autoTable(doc, {
                    startY: 135,
                    head: [['Component', 'Details']],
                    body: [
                        ['Position', jobTitle],
                        ['Organization', companyName],
                        ['Annual CTC', salary],
                        ['Joining Date', joiningDate]
                    ]
                });
                finalY = doc.lastAutoTable.finalY + 15;
            } else {
                throw new Error("Table plugin missing");
            }
        } catch (e) {
            console.warn("Table generation skipped:", e.message);
            doc.text(`Position: ${jobTitle}`, 20, 140);
            doc.text(`CTC: ${salary}`, 20, 150);
            finalY = 170;
        }

        doc.setFont("helvetica", "bold");
        doc.text("Terms and Conditions:", 20, finalY);
        doc.setFont("helvetica", "normal");
        doc.text("1. Verification required.", 20, finalY + 10);
        doc.text("2. 6-month probation.", 20, finalY + 18);

        return doc.output('datauristring');
    } catch (err) {
        console.error("PDF CRASH:", err);
    }
};
