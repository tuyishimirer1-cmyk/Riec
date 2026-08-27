import { Body, Controller, Get, Param, Post, Req, Headers } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiExcludeEndpoint,
  ApiProperty,
} from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { IsEmail, IsOptional, IsString } from 'class-validator';
import { ResponseMessage } from '../common/decorators/response-message.decorator';

class InitProjectCheckoutDto {
  @IsString()
  @ApiProperty({ example: '65f34e7e0a2b3c4d5e6f7890' })
  projectId: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ 
    example: '65f34e7e0a2b3c4d5e6f7000',
    required: false,
    description: 'Optional tier ID. If not provided, project basePrice will be used.'
  })
  tierId?: string;

  @IsEmail()
  @ApiProperty({ example: 'customer@example.com' })
  email: string;

  @IsString()
  @ApiProperty({ example: 'John Doe' })
  fullName: string;

  @IsString()
  @ApiProperty({ example: '0788123456', description: 'Rwanda phone number in format 07XXXXXXXX' })
  phone: string;
}

@ApiTags('Payment Endpoints')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('project-checkout')
  @ResponseMessage('Checkout initialized successfully')
  @ApiOperation({
    summary: 'Initialize Flutterwave project checkout',
    description:
      "Initiates a payment flow for purchasing a project pricing tier. Returns a payment link that should be used to redirect the customer to Flutterwave's payment page.",
  })
  @ApiOkResponse({
    description: 'Returns a payment link to redirect the user to Flutterwave',
    schema: {
      example: {
        paymentLink: 'https://flutterwave.co/pay/riec-xyz123',
        reference: 'FLW-REF-123456',
        message: 'Redirect customer to complete payment',
      },
    },
  })
  @ApiBadRequestResponse({
    description:
      'Validation error - projectId, tierId, email, and fullName are required',
  })
  initProjectCheckout(@Body() dto: InitProjectCheckoutDto) {
    return this.paymentsService.initProjectCheckout(dto);
  }

  @Post('webhook/flutterwave')
  @ApiExcludeEndpoint()
  @ApiOperation({
    summary: 'Flutterwave webhook handler (deprecated)',
    description:
      'Legacy webhook endpoint for Flutterwave.',
  })
  handleWebhookLegacy(@Body() body: any) {
    return this.paymentsService.handleWebhook(body);
  }

  @Post('webhook/paypack')
  @ApiExcludeEndpoint()
  @ApiOperation({
    summary: 'Paypack webhook handler (deprecated)',
    description:
      'Legacy webhook endpoint for Paypack.',
  })
  handleWebhookPaypack(@Body() body: any) {
    return this.paymentsService.handleWebhook(body);
  }

  @Post('webhook/rwandapay')
  @ApiExcludeEndpoint()
  @ApiOperation({
    summary: 'RwandaPay webhook handler',
    description:
      'Webhook endpoint for receiving payment status updates from RwandaPay. This endpoint is excluded from public API documentation.',
  })
  handleWebhook(@Body() body: any, @Req() req: any, @Headers('x-webhook-signature') signature?: string) {
    return this.paymentsService.handleWebhook(body, req.rawBody, signature);
  }

  @Get('downloads/:token')
  @ResponseMessage('Downloads retrieved successfully')
  @ApiOperation({
    summary: 'Get downloadable assets for a successful purchase',
    description:
      'After a successful payment, customers receive a download token via email. Use this token to retrieve signed download URLs for purchased assets. The token is one-time use and time-limited.',
  })
  @ApiParam({
    name: 'token',
    description: 'One-time download token from email',
    example: 'dl_6b9d6d2a2a5b4a3b8b9a',
  })
  @ApiOkResponse({
    description:
      'List of assets the customer can download, filtered by pricing tier',
    schema: {
      example: {
        purchase: {
          id: 'purchase1',
          project: {
            id: 'project1',
            title: 'Modern Family Villa',
            slug: 'modern-family-villa',
          },
          tier: {
            name: 'Basic Package',
            currency: 'NGN',
            amount: 150000,
          },
          status: 'COMPLETED',
          fullName: 'John Doe',
          email: 'customer@example.com',
        },
        assets: [
          {
            id: 'asset1',
            filename: 'architectural-plans.pdf',
            fileType: 'application/pdf',
            size: 2048576,
            downloadUrl: 'https://cdn.example.com/...?signature=...',
            documentType: 'ARCHITECTURAL_DRAWINGS',
          },
          {
            id: 'asset2',
            filename: 'site-plan.pdf',
            fileType: 'application/pdf',
            size: 1048576,
            downloadUrl: 'https://cdn.example.com/...?signature=...',
            documentType: 'SITE_PLAN',
          },
        ],
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid, expired, or already-used token',
  })
  getDownloads(@Param('token') token: string) {
    return this.paymentsService.getDownloadsByToken(token);
  }
}
