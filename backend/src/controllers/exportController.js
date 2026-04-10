const supabase = require('../utils/supabase');
const { searchFilterSchema } = require('../utils/validation');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

// Export records to Excel
const exportToExcel = async (req, res, next) => {
    try {
        // Validate query parameters (same as getRecords)
        const { error, value } = searchFilterSchema.validate(req.query);
        if (error) {
            error.isJoi = true;
            return next(error);
        }

        const { search, from_date, to_date, category } = value;

        // Build query (without pagination for export)
        let query = supabase
            .from('flattened_records')
            .select('*');

        // Scope to current staff only
        if (req.user?.role === 'staff' && req.user?.id) {
            query = query.eq('created_by_staff_id', req.user.id);
        }

        // Apply filters
        if (search) {
            query = query.or(`register_number.ilike.%${search}%,student_name.ilike.%${search}%,participation_description.ilike.%${search}%,awarding_agency.ilike.%${search}%`);
        }
        if (from_date) {
            query = query.gte('from_date', from_date);
        }
        if (to_date) {
            query = query.lte('to_date', to_date);
        }
        if (category) {
            query = query.eq('category', category);
        }

        // Execute query
        const { data, error: fetchError } = await query;

        if (fetchError) {
            throw new Error(`Failed to fetch records: ${fetchError.message}`);
        }

        // Create workbook
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Staff Records');

        // Define columns
        worksheet.columns = [
            { header: 'Register Number', key: 'register_number', width: 18 },
            { header: 'Student Name', key: 'student_name', width: 25 },
            { header: 'Department', key: 'department', width: 20 },
            { header: 'Category', key: 'category', width: 18 },
            { header: 'Activity', key: 'activity', width: 25 },
            { header: 'Sub-Activity', key: 'sub_activity', width: 25 },
            { header: 'From Date', key: 'from_date', width: 12 },
            { header: 'To Date', key: 'to_date', width: 12 },
            { header: 'Participation Description', key: 'participation_description', width: 35 },
            { header: 'Awarding Agency', key: 'awarding_agency', width: 25 },
            { header: 'Prize / Result', key: 'prize_result', width: 18 },
            { header: 'Certificate', key: 'has_certificate', width: 15 }
        ];

        // Style header row
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFD3D3D3' }
        };

        // Add data rows
        if (data && data.length > 0) {
            data.forEach(record => {
                worksheet.addRow({
                    register_number: record.register_number,
                    student_name: record.student_name,
                    department: record.department,
                    category: record.category,
                    activity: record.event_name || '',
                    sub_activity: record.category === 'Extra-Curricular' ? (record.custom_category || '') : '',
                    from_date: record.from_date,
                    to_date: record.to_date,
                    participation_description: record.participation_description || '',
                    awarding_agency: record.awarding_agency || '',
                    prize_result: record.prize_result || '',
                    has_certificate: record.certificate_filename ? 'Available' : 'Not Available'
                });
            });
        }

        // Set response headers
        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
            'Content-Disposition',
            `attachment; filename=staff_records_${Date.now()}.xlsx`
        );

        // Write to response
        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        next(error);
    }
};

// Export records to PDF
const exportToPDF = async (req, res, next) => {
    try {
        // Validate query parameters (same as getRecords)
        const { error, value } = searchFilterSchema.validate(req.query);
        if (error) {
            error.isJoi = true;
            return next(error);
        }

        const { search, from_date, to_date, category } = value;

        // Build query (without pagination for export)
        let query = supabase
            .from('flattened_records')
            .select('*');

        // Scope to current staff only
        if (req.user?.role === 'staff' && req.user?.id) {
            query = query.eq('created_by_staff_id', req.user.id);
        }

        // Apply filters
        if (search) {
            query = query.or(`register_number.ilike.%${search}%,student_name.ilike.%${search}%,participation_description.ilike.%${search}%,awarding_agency.ilike.%${search}%`);
        }
        if (from_date) {
            query = query.gte('from_date', from_date);
        }
        if (to_date) {
            query = query.lte('to_date', to_date);
        }
        if (category) {
            query = query.eq('category', category);
        }

        // Execute query
        const { data, error: fetchError } = await query;

        if (fetchError) {
            throw new Error(`Failed to fetch records: ${fetchError.message}`);
        }

        // Create PDF document
        const doc = new PDFDocument({ margin: 50, size: 'A4' });

        // Set response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename=staff_records_${Date.now()}.pdf`
        );

        // Pipe PDF to response
        doc.pipe(res);

        // Add logo image if available
        const logoPath = path.join(process.cwd(), '..', 'stc.jpg');
        if (fs.existsSync(logoPath)) {
            try {
                doc.image(logoPath, 50, 50, {
                    fit: [495, 80],
                    align: 'center'
                });
                doc.moveDown(1);
            } catch (err) {
                console.error('Error adding logo:', err);
                doc.moveDown(0.5);
            }
        } else {
            doc.moveDown(0.5);
        }

        // Add filter info if applied
        if (search || from_date || to_date || category) {
            doc.fontSize(12).text('Applied Filters:', { underline: true });
            if (search) doc.fontSize(10).text(`Search: ${search}`);
            if (from_date) doc.fontSize(10).text(`From Date: ${from_date}`);
            if (to_date) doc.fontSize(10).text(`To Date: ${to_date}`);
            if (category) doc.fontSize(10).text(`Category: ${category}`);
            doc.moveDown();
        }

        // Add records
        if (data && data.length > 0) {
            data.forEach((record, index) => {
                // Check if we need a new page
                if (doc.y > 700) {
                    doc.addPage();
                }

                doc.fontSize(11).text(`${index + 1}. Record`, { underline: true });
                doc.fontSize(9);
                doc.text(`Reg No: ${record.register_number}`);
                doc.text(`Student: ${record.student_name}`);
                doc.text(`Dept: ${record.department}`);
                doc.text(`Category: ${record.category}`);
                doc.text(`Activity: ${record.event_name || '—'}`);
                doc.text(`Sub-Activity: ${record.category === 'Extra-Curricular' ? (record.custom_category || '—') : '—'}`);
                doc.text(`From: ${record.from_date}`);
                doc.text(`To: ${record.to_date}`);
                doc.text(`Participation Description: ${record.participation_description || '—'}`);
                doc.text(`Awarding Agency: ${record.awarding_agency || '—'}`);
                doc.text(`Prize / Result: ${record.prize_result || '—'}`);
                doc.text(`Certificate: ${record.certificate_filename ? 'Available' : 'Not Available'}`);
                doc.moveDown(0.5);
            });
        } else {
            doc.fontSize(10).text('No records found.');
        }

        // Finalize PDF
        doc.end();

    } catch (error) {
        next(error);
    }
};

module.exports = {
    exportToExcel,
    exportToPDF
};
