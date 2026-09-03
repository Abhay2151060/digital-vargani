import { BadRequestException } from '@nestjs/common';
import { z } from 'zod';

export function parseRequest<T extends z.ZodTypeAny>(schema: T, value: unknown): z.output<T> {
  const result = schema.safeParse(value);

  if (result.success) {
    return result.data;
  }

  throw new BadRequestException({
    code: 'VALIDATION_ERROR',
    message: 'One or more fields are invalid.',
    details: result.error.flatten(),
  });
}
