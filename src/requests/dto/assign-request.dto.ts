import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class AssignRequestDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  agentId: string;
}
