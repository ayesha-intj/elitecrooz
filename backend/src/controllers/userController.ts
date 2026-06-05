import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User";
import { PasswordType } from "../constants/passwordType.enum";

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

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body as {
      email: string;
      password: string;
    };
    if (!email || !password) {
      res.status(400).json({
        response: {
          status: false,
          message: "Email or password is missing",
        },
      });
      return;
    }
    const existingUser = await User.findOne({
      email: email.toLowerCase(),
    });

    if (!existingUser) {
      res.status(401).json({
        response: {
          status: false,
          message: "Invalid email or password",
        },
      });
      return;
    }

    const isMatch = await bcrypt.compare(password, existingUser.password);

    if (!isMatch) {
      res.status(401).json({
        response: {
          status: false,
          message: "Invalid email or password",
        },
      });
      return;
    }

    const token = jwt.sign(
      {
        userId: existingUser._id,
        email: existingUser.email,
      },
      process.env.JWT_SECRET as string,
      { expiresIn: "7d" },
    );

    res.status(200).json({
      response: {
        status: true,
        data: {
          auth: {
            jwt: token,
            email: existingUser.email,
            fullName: existingUser.fullName,
            avatar: existingUser.avatar
              ? `${process.env.BASE_URL}/${existingUser.avatar}`
              : null,
          },
        },
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      response: {
        status: false,
        message: "Internal server error",
      },
    });
  }
};

export const resetPassword = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { email, passwordType, currentPassword, newPassword } = req.body as {
      email: string;
      passwordType: PasswordType;
      currentPassword: string | null;
      newPassword: string;
    };

    if (
      !email ||
      !currentPassword ||
      !newPassword ||
      !Object.values(PasswordType).includes(passwordType)
    ) {
      res.status(400).json({
        response: { status: false, message: "Required fields are missing" },
      });
      return;
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (!existingUser) {
      res.status(401).json({
        response: {
          status: false,
          message: "This user does not exist",
        },
      });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const newHashedPassword = await bcrypt.hash(newPassword, salt);

    if (passwordType === PasswordType.RESET_FORGOT_PASSWORD) {
      await User.updateOne(
        { _id: existingUser._id },
        { $set: { password: newHashedPassword } },
      );

      res.status(204).json({});
      return;
    } else if (passwordType === PasswordType.CHANGE_PASSWORD) {
      const isMatch =
        currentPassword != null
          ? await bcrypt.compare(currentPassword, existingUser.password)
          : null;

      if (!isMatch || isMatch == null) {
        res.status(401).json({
          response: {
            status: false,
            message: "Invalid email or password",
          },
        });
        return;
      }

      await User.updateOne(
        { _id: existingUser._id },
        { $set: { password: newHashedPassword } },
      );

      res.status(204).json({});
      return;
    } else {
      res.status(401).json({
        response: {
          status: false,
          message: "Invalid or missing password type",
        },
      });
      return;
    }
  } catch (error) {
    console.error("Password reset error:", error);
    res.status(500).json({
      response: {
        status: false,
        message: "Internal server error",
      },
    });
  }
};
