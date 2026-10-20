import { IsEnum } from 'class-validator';
import { RequestStatus } from '../../common/enums/request-status.enum';

export class UpdateStatusDto {
  @IsEnum(RequestStatus)
  status: RequestStatus;
}
