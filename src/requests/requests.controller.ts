import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { MockAuthGuard } from '../common/guards/mock-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import type { User } from '../common/interfaces/user.interface';
import { AssignRequestDto } from './dto/assign-request.dto';
import { ListRequestsQueryDto } from './dto/list-requests-query.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { RequestsService } from './requests.service';

@Controller('requests')
@UseGuards(MockAuthGuard, RolesGuard)
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @Get()
  list(@Query() query: ListRequestsQueryDto, @CurrentUser() user: User) {
    return this.requestsService.list(query, user);
  }

  @Get(':id')
  getById(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: User,
  ) {
    return this.requestsService.getById(id, user);
  }

  @Post(':id/assign')
  @Roles(UserRole.ADMIN)
  assign(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: AssignRequestDto,
    @CurrentUser() user: User,
  ) {
    return this.requestsService.assign(id, dto, user);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateStatusDto,
    @CurrentUser() user: User,
  ) {
    return this.requestsService.updateStatus(id, dto, user);
  }
}
