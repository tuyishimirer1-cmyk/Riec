import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { EmailService } from '../contact/email.service';

@Module({
  providers: [PaymentsService, EmailService],
  controllers: [PaymentsController],
})
export class PaymentsModule {}
