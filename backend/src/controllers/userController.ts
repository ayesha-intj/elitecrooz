import { Request, response, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User";

export const signUp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, fullName, password } = req.body as {
      email: string;
      fullName: string;
      password: string;
    };

    const avatarFile = req.file;

    if (!email || !fullName || !password || !avatarFile) {
      res.status(400).json({
        response: {
          status: false,
          message: "All fields including avatar are required",
        },
      });
      return;
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });

    if (existingUser) {
      res.status(409).json({
        response: { status: false, message: "Email is already registered" },
      });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const avatarUrl = `${process.env.BASE_URL}/${avatarFile.filename}`;

    const newUser = await User.create({
      fullName,
      email: email.toLowerCase(),
      password: hashedPassword,
      avatar: avatarFile.filename,
    });

    const token = jwt.sign(
      {
        userId: newUser._id,
        email: newUser.email,
      },
      process.env.JWT_SECRET as string,
      { expiresIn: "7d" },
    );

    res.status(201).json({
      response: {
        status: true,
        data: {
          auth: {
            jwt: token,
            email: newUser.email,
            fullName: newUser.fullName,
            avatar: avatarUrl,
          },
        },
      },
    });
  } catch (error) {
    console.error("Sign-up error:", error);
    res.status(500).json({
      response: {
        status: false,
        message: "Internal server error",
      },
    });
  }
};
