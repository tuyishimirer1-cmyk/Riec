import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';
import { isValidSlug } from '../utils/slug.util';

export function IsSlug(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isSlug',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (value === undefined || value === null || value === '') {
            return true; // Allow empty values (handled by @IsOptional)
          }
          return typeof value === 'string' && isValidSlug(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a valid slug (lowercase letters, numbers, and hyphens only)`;
        },
      },
    });
  };
}
