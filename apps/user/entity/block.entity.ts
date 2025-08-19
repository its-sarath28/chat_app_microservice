import {
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity()
export class Block {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.blockedUsers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'blocker_id' })
  blockerId: User;

  @ManyToOne(() => User, (user) => user.blockedByUsers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'blocked_id' })
  blockedId: User;

  @CreateDateColumn()
  blockedOn: Date;
}
