const supabase = require('../utils/supabase');
const {
    createRecordSchema,
    updateCategorySchema,
    searchFilterSchema
} = require('../utils/validation');
const fs = require('fs').promises;
const path = require('path');

// Create a new record (student + events + categories)
const createRecord = async (req, res, next) => {
    try {
        // Validate request body
        const { error, value } = createRecordSchema.validate(req.body);
        if (error) {
            error.isJoi = true;
            return next(error);
        }

        const { register_number, student_name, department, events } = value;

        // Check if student already exists
        let student;
        const { data: existingStudent, error: studentFetchError } = await supabase
            .from('students')
            .select('*')
            .eq('register_number', register_number)
            .single();

        if (studentFetchError && studentFetchError.code !== 'PGRST116') {
            throw new Error(`Database error: ${studentFetchError.message}`);
        }

        if (existingStudent) {
            // Student exists, use existing student
            student = existingStudent;

            // Update student name and department if changed
            if (existingStudent.name !== student_name || existingStudent.department !== department) {
                const { data: updatedStudent, error: updateError } = await supabase
                    .from('students')
                    .update({ name: student_name, department: department })
                    .eq('id', existingStudent.id)
                    .select()
                    .single();

                if (updateError) {
                    throw new Error(`Failed to update student: ${updateError.message}`);
                }
                student = updatedStudent;
            }
        } else {
            // Create new student
            const { data: newStudent, error: createError } = await supabase
                .from('students')
                .insert([{
                    register_number,
                    name: student_name,
                    department
                }])
                .select()
                .single();

            if (createError) {
                throw new Error(`Failed to create student: ${createError.message}`);
            }
            student = newStudent;
        }

        // Create events and categories
        const createdRecords = [];

        for (const event of events) {
            // Create event
            const { data: newEvent, error: eventError } = await supabase
                .from('events')
                .insert([{
                    student_id: student.id,
                    description: event.description,
                    event_name: event.event_name || null,
                    from_date: event.from_date,
                    to_date: event.to_date,
                    created_by_staff_id: req.user?.id || null
                }])
                .select()
                .single();

            if (eventError) {
                throw new Error(`Failed to create event: ${eventError.message}`);
            }

            // Create categories for this event
            for (const category of event.categories) {
                const { data: newCategory, error: categoryError } = await supabase
                    .from('event_categories')
                    .insert([{
                        event_id: newEvent.id,
                        category: category.category,
                        custom_category: category.custom_category || null,
                        prize_result: category.prize_result || null,
                        certificate_url: null,
                        certificate_filename: null
                    }])
                    .select()
                    .single();

                if (categoryError) {
                    throw new Error(`Failed to create category: ${categoryError.message}`);
                }

                createdRecords.push({
                    student,
                    event: newEvent,
                    category: newCategory
                });
            }
        }

        res.status(201).json({
            success: true,
            message: 'Record created successfully',
            data: createdRecords
        });

    } catch (error) {
        next(error);
    }
};

// Get all records with search and filter
const getRecords = async (req, res, next) => {
    try {
        // Validate query parameters
        const { error, value } = searchFilterSchema.validate(req.query);
        if (error) {
            error.isJoi = true;
            return next(error);
        }

        const { search, from_date, to_date, category, department, page, limit } = value;
        const offset = (page - 1) * limit;

        // Build query using the flattened_records view
        let query = supabase
            .from('flattened_records')
            .select('*', { count: 'exact' });

        // ── Scope to current staff only (each staff sees only their records) ──
        if (req.user?.role === 'staff' && req.user?.id) {
            query = query.eq('created_by_staff_id', req.user.id);
        }

        // Apply search filter
        if (search) {
            query = query.or(`register_number.ilike.%${search}%,student_name.ilike.%${search}%,event_description.ilike.%${search}%`);
        }

        // Apply department filter
        if (department) {
            query = query.eq('department', department);
        }

        // Apply date range filter
        if (from_date) {
            query = query.gte('from_date', from_date);
        }
        if (to_date) {
            query = query.lte('to_date', to_date);
        }

        // Apply category filter
        if (category) {
            query = query.eq('category', category);
        }

        // Apply pagination
        query = query.range(offset, offset + limit - 1);

        // Execute query
        const { data, error: fetchError, count } = await query;

        if (fetchError) {
            throw new Error(`Failed to fetch records: ${fetchError.message}`);
        }

        res.status(200).json({
            success: true,
            data: data || [],
            pagination: {
                page,
                limit,
                total: count || 0,
                totalPages: Math.ceil((count || 0) / limit)
            }
        });

    } catch (error) {
        next(error);
    }
};

// Get a single record by category_id
const getRecordById = async (req, res, next) => {
    try {
        const { categoryId } = req.params;

        const { data, error: fetchError } = await supabase
            .from('flattened_records')
            .select('*')
            .eq('category_id', categoryId)
            .single();

        if (fetchError) {
            if (fetchError.code === 'PGRST116') {
                const error = new Error('Record not found');
                error.statusCode = 404;
                return next(error);
            }
            throw new Error(`Failed to fetch record: ${fetchError.message}`);
        }

        res.status(200).json({
            success: true,
            data
        });

    } catch (error) {
        next(error);
    }
};

// Update a record (event + category)
const updateRecord = async (req, res, next) => {
    try {
        const { categoryId } = req.params;

        // Validate request body
        const { error, value } = updateCategorySchema.validate(req.body);
        if (error) {
            error.isJoi = true;
            return next(error);
        }

        // Get the category to find the event
        const { data: categoryData, error: categoryFetchError } = await supabase
            .from('event_categories')
            .select('*, events(*)')
            .eq('id', categoryId)
            .single();

        if (categoryFetchError) {
            if (categoryFetchError.code === 'PGRST116') {
                const error = new Error('Record not found');
                error.statusCode = 404;
                return next(error);
            }
            throw new Error(`Failed to fetch record: ${categoryFetchError.message}`);
        }

        // Update event if event fields are provided
        if (value.event_description || value.event_name !== undefined || value.from_date || value.to_date) {
            const eventUpdate = {};
            if (value.event_description) eventUpdate.description = value.event_description;
            if (value.event_name !== undefined) eventUpdate.event_name = value.event_name || null;
            if (value.from_date) eventUpdate.from_date = value.from_date;
            if (value.to_date) eventUpdate.to_date = value.to_date;

            const { error: eventUpdateError } = await supabase
                .from('events')
                .update(eventUpdate)
                .eq('id', categoryData.events.id);

            if (eventUpdateError) {
                throw new Error(`Failed to update event: ${eventUpdateError.message}`);
            }
        }

        // Update category if category fields are provided
        if (value.category || value.custom_category !== undefined || value.prize_result !== undefined) {
            const categoryUpdate = {};
            if (value.category) categoryUpdate.category = value.category;
            if (value.custom_category !== undefined) categoryUpdate.custom_category = value.custom_category || null;
            if (value.prize_result !== undefined) categoryUpdate.prize_result = value.prize_result || null;

            const { error: categoryUpdateError } = await supabase
                .from('event_categories')
                .update(categoryUpdate)
                .eq('id', categoryId);

            if (categoryUpdateError) {
                throw new Error(`Failed to update category: ${categoryUpdateError.message}`);
            }
        }

        // Fetch updated record
        const { data: updatedRecord, error: fetchError } = await supabase
            .from('flattened_records')
            .select('*')
            .eq('category_id', categoryId)
            .single();

        if (fetchError) {
            throw new Error(`Failed to fetch updated record: ${fetchError.message}`);
        }

        res.status(200).json({
            success: true,
            message: 'Record updated successfully',
            data: updatedRecord
        });

    } catch (error) {
        next(error);
    }
};

// Delete a record (category entry)
const deleteRecord = async (req, res, next) => {
    try {
        const { categoryId } = req.params;

        // First, get the certificate info to delete the file
        const { data: categoryData, error: fetchError } = await supabase
            .from('event_categories')
            .select('*')
            .eq('id', categoryId)
            .single();

        if (fetchError) {
            if (fetchError.code === 'PGRST116') {
                const error = new Error('Record not found');
                error.statusCode = 404;
                return next(error);
            }
            throw new Error(`Failed to fetch record: ${fetchError.message}`);
        }

        // Delete the certificate file if exists
        if (categoryData.certificate_filename) {
            const filePath = path.join('uploads', categoryData.certificate_filename);
            try {
                await fs.unlink(filePath);
            } catch (err) {
                console.error('Failed to delete certificate file:', err);
                // Continue with deletion even if file deletion fails
            }
        }

        // Delete the category
        const { error: deleteError } = await supabase
            .from('event_categories')
            .delete()
            .eq('id', categoryId);

        if (deleteError) {
            throw new Error(`Failed to delete record: ${deleteError.message}`);
        }

        res.status(200).json({
            success: true,
            message: 'Record deleted successfully'
        });

    } catch (error) {
        next(error);
    }
};

module.exports = {
    createRecord,
    getRecords,
    getRecordById,
    updateRecord,
    deleteRecord
};
