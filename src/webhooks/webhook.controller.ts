import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { CreateRequestDto } from './dto/create-request.dto';
import { WebhooksService } from './webhooks.service';

@Controller('webhooks')
export class WebhookController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post('sales-requests')
  @HttpCode(HttpStatus.OK)
  async receive(
    @Body() dto: CreateRequestDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.webhooksService.createFromWebhook(dto);
    response.status(result.created ? HttpStatus.CREATED : HttpStatus.OK);
    return result;
  }
}
