import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { RequestStatus } from '../../common/enums/request-status.enum';
import { RequestActivity } from './request-activity.entity';

@Entity('sales_requests')
export class SalesRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'external_id', unique: true })
  externalId: string;

  @Column({ name: 'customer_name' })
  customerName: string;

  @Column()
  email: string;

  @Column('text')
  description: string;

  @Column({
    type: 'enum',
    enum: RequestStatus,
    enumName: 'sales_request_status',
    default: RequestStatus.NEW,
  })
  status: RequestStatus;

  @Column({ name: 'assigned_to', type: 'varchar', nullable: true })
  assignedTo: string | null;

  @OneToMany(() => RequestActivity, (activity) => activity.request)
  activities: RequestActivity[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
