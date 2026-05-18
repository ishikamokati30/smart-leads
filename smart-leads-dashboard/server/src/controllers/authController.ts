import { Request, Response, NextFunction } from 'express';
import User from '../models/User';
import generateToken from '../utils/generateToken';
import { z } from 'zod';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['admin', 'sales_user']).optional(),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const registerUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validatedData = registerSchema.parse(req.body);

    const userExists = await User.findOne({ email: validatedData.email });

    if (userExists) {
      res.status(400);
      throw new Error('User already exists');
    }

    const user = await User.create(validatedData);

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id as string),
      });
    } else {
      res.status(400);
      throw new Error('Invalid user data');
    }
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400);
      next(new Error(error.errors.map(e => e.message).join(', ')));
    } else {
      next(error);
    }
  }
};

export const loginUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validatedData = loginSchema.parse(req.body);

    const user = await User.findOne({ email: validatedData.email }).select('+password');

    if (user && (await user.matchPassword(validatedData.password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id as string),
      });
    } else {
      res.status(401);
      throw new Error('Invalid email or password');
    }
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400);
      next(new Error(error.errors.map(e => e.message).join(', ')));
    } else {
      next(error);
    }
  }
};
