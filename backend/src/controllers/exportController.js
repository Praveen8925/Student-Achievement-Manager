const supabase = require('../utils/supabase');
const { searchFilterSchema } = require('../utils/validation');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

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
            query = query.or(`register_number.ilike.%${search}%,student_name.ilike.%${search}%,event_description.ilike.%${search}%`);
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
            { header: 'Event Description', key: 'event_description', width: 35 },
            { header: 'Category', key: 'category', width: 15 },
            { header: 'From Date', key: 'from_date', width: 12 },
            { header: 'To Date', key: 'to_date', width: 12 },
            { header: 'Has Certificate', key: 'has_certificate', width: 15 }
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
                    event_description: record.event_description,
                    category: record.category,
                    from_date: record.from_date,
                    to_date: record.to_date,
                    has_certificate: record.certificate_url ? 'Yes' : 'No'
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
            query = query.or(`register_number.ilike.%${search}%,student_name.ilike.%${search}%,event_description.ilike.%${search}%`);
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

        // Add title
        doc.fontSize(20).text('Staff Achievement & Event Records', { align: 'center' });
        doc.moveDown();

        // Add generation date
        doc.fontSize(10).text(`Generated on: ${new Date().toLocaleString()}`, { align: 'right' });
        doc.moveDown();

        // Add filter info if applied
        if (search || from_date || to_date || category) {
            doc.fontSize(12).text('Applied Filters:', { underline: true });
            if (search) doc.fontSize(10).text(`Search: ${search}`);
            if (from_date) doc.fontSize(10).text(`From Date: ${from_date}`);
            if (to_date) doc.fontSize(10).text(`To Date: ${to_date}`);
            if (category) doc.fontSize(10).text(`Category: ${category}`);
            doc.moveDown();
        }

        // Add total count
        doc.fontSize(12).text(`Total Records: ${data ? data.length : 0}`);
        doc.moveDown();

        // Add records
        if (data && data.length > 0) {
            data.forEach((record, index) => {
                // Check if we need a new page
                if (doc.y > 700) {
                    doc.addPage();
                }

                doc.fontSize(11).text(`${index + 1}. Record`, { underline: true });
                doc.fontSize(9);
                doc.text(`Register Number: ${record.register_number}`);
                doc.text(`Student Name: ${record.student_name}`);
                doc.text(`Department: ${record.department}`);
                doc.text(`Event: ${record.event_description}`);
                doc.text(`Category: ${record.category}`);
                doc.text(`Duration: ${record.from_date} to ${record.to_date}`);
                doc.text(`Certificate: ${record.certificate_url ? 'Available' : 'Not Available'}`);
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
