import {
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Column,
  JoinColumn,
  Index,
} from 'typeorm';
import { ActivityAction } from '../../common/enums/activity-action.enum';
import { SalesRequest } from './sales-request.entity';

@Entity('request_activities')
@Index(['requestId'])
export class RequestActivity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'request_id' })
  requestId: string;

  @ManyToOne(() => SalesRequest, (request) => request.activities, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'request_id' })
  request: SalesRequest;

  @Column({ type: 'enum', enum: ActivityAction, enumName: 'activity_action' })
  action: ActivityAction;

  @Column({ name: 'from_value', type: 'varchar', nullable: true })
  fromValue: string | null;

  @Column({ name: 'to_value' })
  toValue: string;

  @Column({ name: 'user_id' })
  userId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
