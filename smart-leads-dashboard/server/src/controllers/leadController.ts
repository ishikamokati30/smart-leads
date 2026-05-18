import { Request, Response, NextFunction } from 'express';
import Lead from '../models/Lead';
import { z } from 'zod';

const leadSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email address'),
  status: z.enum(['New', 'Contacted', 'Qualified', 'Lost']).optional(),
  source: z.enum(['Website', 'Instagram', 'Referral']),
});

// @desc    Create a new lead
// @route   POST /api/leads
// @access  Private (sales_user, admin)
export const createLead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = leadSchema.parse(req.body);
    const lead = await Lead.create(validatedData);
    res.status(201).json(lead);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400);
      next(new Error(((error as any).errors || (error as any).issues).map((e: any) => e.message).join(', ')));
    } else {
      next(error);
    }
  }
};

// @desc    Get all leads with filtering, search, sorting, and pagination
// @route   GET /api/leads
// @access  Private (sales_user, admin)
export const getLeads = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, source, search, sort, page = '1', limit = '10' } = req.query;

    const query: any = {};

    // Advanced filtering
    if (status) query.status = status;
    if (source) query.source = source;

    // Search by name or email using regex for partial match
    if (search) {
      query.$or = [
        { name: { $regex: search as string, $options: 'i' } },
        { email: { $regex: search as string, $options: 'i' } },
      ];
    }

    // Pagination setup
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // Sorting setup (default to latest)
    let sortOption: any = { createdAt: -1 }; // latest
    if (sort === 'oldest') {
      sortOption = { createdAt: 1 };
    }

    const leads = await Lead.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum);

    const total = await Lead.countDocuments(query);

    res.json({
      leads,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
        limit: limitNum,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single lead
// @route   GET /api/leads/:id
// @access  Private (sales_user, admin)
export const getLeadById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      res.status(404);
      throw new Error('Lead not found');
    }
    res.json(lead);
  } catch (error) {
    next(error);
  }
};

// @desc    Update a lead
// @route   PUT /api/leads/:id
// @access  Private (sales_user, admin)
export const updateLead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const lead = await Lead.findById(req.params.id);

    if (!lead) {
      res.status(404);
      throw new Error('Lead not found');
    }

    // Validate request body
    const validatedData = leadSchema.partial().parse(req.body);

    const updatedLead = await Lead.findByIdAndUpdate(req.params.id, validatedData, {
      new: true,
      runValidators: true,
    });

    res.json(updatedLead);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400);
      next(new Error(((error as any).errors || (error as any).issues).map((e: any) => e.message).join(', ')));
    } else {
      next(error);
    }
  }
};

// @desc    Delete a lead
// @route   DELETE /api/leads/:id
// @access  Private (Admin only)
export const deleteLead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const lead = await Lead.findById(req.params.id);

    if (!lead) {
      res.status(404);
      throw new Error('Lead not found');
    }

    await Lead.findByIdAndDelete(req.params.id);

    res.json({ message: 'Lead removed successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Export leads to CSV
// @route   GET /api/leads/export/csv
// @access  Private (sales_user, admin)
export const exportLeadsCsv = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // You could apply the same filters here if desired, but we'll export all or filtered
    const { status, source, search } = req.query;
    const query: any = {};

    if (status) query.status = status;
    if (source) query.source = source;
    if (search) {
      query.$or = [
        { name: { $regex: search as string, $options: 'i' } },
        { email: { $regex: search as string, $options: 'i' } },
      ];
    }

    const leads = await Lead.find(query).sort({ createdAt: -1 });

    const csvHeaders = ['Name,Email,Status,Source,CreatedAt'];
    const csvRows = leads.map(lead => {
      // Escape commas and quotes inside strings
      const name = `"${lead.name.replace(/"/g, '""')}"`;
      const email = `"${lead.email.replace(/"/g, '""')}"`;
      const status = `"${lead.status}"`;
      const source = `"${lead.source}"`;
      const createdAt = `"${lead.createdAt.toISOString()}"`;
      
      return `${name},${email},${status},${source},${createdAt}`;
    });

    const csvString = [csvHeaders, ...csvRows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=leads.csv');
    res.status(200).send(csvString);
  } catch (error) {
    next(error);
  }
};
