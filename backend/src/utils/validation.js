const Joi = require('joi');

// Validation schema for creating a record
const createRecordSchema = Joi.object({
    register_number: Joi.string().trim().required().messages({
        'string.empty': 'Register number is required',
        'any.required': 'Register number is required'
    }),
    student_name: Joi.string().trim().required().messages({
        'string.empty': 'Student name is required',
        'any.required': 'Student name is required'
    }),
    department: Joi.string().trim().required().messages({
        'string.empty': 'Department is required',
        'any.required': 'Department is required'
    }),
    events: Joi.array().min(1).items(
        Joi.object({
            description: Joi.string().trim().required().messages({
                'string.empty': 'Event description is required',
                'any.required': 'Event description is required'
            }),
            event_name: Joi.string().trim().optional().allow(''),
            from_date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required().messages({
                'string.empty': 'From date is required',
                'string.pattern.base': 'From date must be in YYYY-MM-DD format',
                'any.required': 'From date is required'
            }),
            to_date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required().messages({
                'string.empty': 'To date is required',
                'string.pattern.base': 'To date must be in YYYY-MM-DD format',
                'any.required': 'To date is required'
            }),
            categories: Joi.array().min(1).items(
                Joi.object({
                    category: Joi.string().valid('Academic', 'Sports', 'Cultural', 'Technical', 'Other').required().messages({
                        'any.only': 'Category must be one of: Academic, Sports, Cultural, Technical, Other',
                        'any.required': 'Category is required'
                    }),
                    custom_category: Joi.string().trim().optional().allow(''),
                    prize_result: Joi.string().trim().optional().allow(''),
                    event_name: Joi.string().trim().optional().allow('')
                })
            ).required().messages({
                'array.min': 'At least one category is required'
            })
        })
    ).required().messages({
        'array.min': 'At least one event is required'
    })
});

// Validation schema for updating a category
const updateCategorySchema = Joi.object({
    event_description: Joi.string().trim().optional(),
    event_name: Joi.string().trim().optional().allow(''),
    from_date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional(),
    to_date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional(),
    category: Joi.string().valid('Academic', 'Sports', 'Cultural', 'Technical', 'Other').optional(),
    custom_category: Joi.string().trim().optional().allow(''),
    prize_result: Joi.string().trim().optional().allow('')
}).min(1);

// Validation schema for search and filter
const searchFilterSchema = Joi.object({
    search: Joi.string().trim().optional().allow(''),
    from_date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional().allow(''),
    to_date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional().allow(''),
    category: Joi.string().valid('Academic', 'Sports', 'Cultural', 'Technical', 'Other').optional().allow(''),
    department: Joi.string().trim().optional().allow(''),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10)
});

module.exports = {
    createRecordSchema,
    updateCategorySchema,
    searchFilterSchema
};
