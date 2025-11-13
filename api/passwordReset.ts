import { Request, Response } from 'express';
import { KeystoneContext } from '@keystone-6/core/types';
import { z } from 'zod';

// Strong validation for incoming POST data
const bodySchema = z.object({
  email: z.string().email(),
  newPassword: z.string().min(8),
  security: z.array(
    z.object({
      questionId: z.string(),
      answer: z.string()
    })
  ).length(3)
});

export const passwordResetHandler = async (
  req: Request,
  res: Response,
  context: KeystoneContext
) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  // Validate POST body
  const result = bodySchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      error: "Invalid parameters",
      details: result.error.format()
    });
  }
  const { email, newPassword, security } = result.data;

  try {
    // Check for duplicate question IDs
    const questionIds = security.map(q => q.questionId);
    const uniqueQuestionIds = new Set(questionIds);
    if (uniqueQuestionIds.size !== questionIds.length) {
      return res.status(400).json({
        error: "Duplicate security questions detected. Please choose different questions."
      });
    }

    const user = await context.db.User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    for (const { questionId, answer } of security) {
      const secAnswers = await context.db.SecurityAnswer.findMany({
        where: {
          user: { id: { equals: user.id } },
          question: { id: { equals: questionId } }
        }
      });
      const secAnswer = secAnswers && secAnswers.length > 0 ? secAnswers[0] : null;

      if (!secAnswer || secAnswer.answer !== answer) {
        return res.status(401).json({ error: 'One or more security answers incorrect' });
      }
    }

    await context.db.User.updateOne({
      where: { id: user.id },
      data: { password: newPassword }
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Error during password reset:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
