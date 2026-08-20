import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { ContactModule } from '../contact/contact.module';

@Module({
  imports: [ContactModule],
  providers: [PaymentsService],
  controllers: [PaymentsController],
})
export class PaymentsModule {}
