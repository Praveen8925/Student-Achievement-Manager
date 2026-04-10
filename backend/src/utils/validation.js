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
    participations: Joi.array().min(1).items(
        Joi.object({
            category: Joi.string().valid('Curricular', 'Co-Curricular', 'Extra-Curricular').required().messages({
                'any.only': 'Category must be one of: Curricular, Co-Curricular, Extra-Curricular',
                'any.required': 'Category is required'
            }),
            activity: Joi.string().trim().required().messages({
                'string.empty': 'Activity is required',
                'any.required': 'Activity is required'
            }),
            custom_activity: Joi.string().trim().optional().allow(''),
            participation_description: Joi.string().trim().required().messages({
                'string.empty': 'Participation description is required',
                'any.required': 'Participation description is required'
            }),
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
            awarding_agency: Joi.string().trim().required().messages({
                'string.empty': 'Awarding agency is required',
                'any.required': 'Awarding agency is required'
            }),
            prize_result: Joi.string().trim().required().messages({
                'string.empty': 'Prize or result is required',
                'any.required': 'Prize or result is required'
            })
        })
    ).required().messages({
        'array.min': 'At least one participation entry is required'
    })
});

// Validation schema for updating a category
const updateCategorySchema = Joi.object({
    participation_description: Joi.string().trim().optional(),
    awarding_agency: Joi.string().trim().optional(),
    event_name: Joi.string().trim().optional().allow(''),
    from_date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional(),
    to_date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional(),
    category: Joi.string().valid('Curricular', 'Co-Curricular', 'Extra-Curricular').optional(),
    custom_category: Joi.string().trim().optional().allow(''),
    prize_result: Joi.string().trim().optional().allow('')
}).min(1);

// Validation schema for search and filter
const searchFilterSchema = Joi.object({
    search: Joi.string().trim().optional().allow(''),
    from_date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional().allow(''),
    to_date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional().allow(''),
    category: Joi.string().valid('Curricular', 'Co-Curricular', 'Extra-Curricular').optional().allow(''),
    department: Joi.string().trim().optional().allow(''),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10)
});

const studentLookupSchema = Joi.object({
    department: Joi.string().trim().required(),
    year: Joi.string().trim().required(),
});

module.exports = {
    createRecordSchema,
    updateCategorySchema,
    searchFilterSchema,
    studentLookupSchema
};
